import { supabase } from './supabaseClient';
import type {
  ServicoCS,
  ApontamentoCS,
  PausaApontamentoCS,
  OSAdministrativaCS,
  ApontamentoAtivo,
  SSPConfig,
  BRMEficienciaRow,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────

function toISO(date: string | Date): string {
  return new Date(date).toISOString();
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// ── Serviços ─────────────────────────────────────────────────

export async function getServicos(): Promise<ServicoCS[]> {
  const { data, error } = await supabase
    .from('servicos_cs')
    .select('*')
    .eq('ativo', true)
    .order('descricao');
  if (error) throw error;
  return (data ?? []) as ServicoCS[];
}

// ── OS Base Administrativa ────────────────────────────────────

export async function buscarOS(nrOs: string): Promise<OSAdministrativaCS | null> {
  const { data } = await supabase
    .from('base_administrativa_cs')
    .select('*')
    .ilike('nr_os', nrOs.trim())
    .maybeSingle();
  return (data as OSAdministrativaCS | null) ?? null;
}

export async function pesquisarOS(termo: string, limit = 10): Promise<OSAdministrativaCS[]> {
  const { data } = await supabase
    .from('base_administrativa_cs')
    .select('id, nr_os, item, descricao, razao_social, situacao, estagio')
    .or(`nr_os.ilike.%${termo}%,descricao.ilike.%${termo}%,razao_social.ilike.%${termo}%`)
    .limit(limit);
  return (data ?? []) as OSAdministrativaCS[];
}

export async function buscarFamiliaByItem(item: string): Promise<string | null> {
  const { data } = await supabase
    .from('base_equipamentos_cs')
    .select('familia')
    .eq('referencia', item.trim())
    .maybeSingle();
  return (data as { familia?: string } | null)?.familia ?? null;
}

// ── Criar Apontamento ─────────────────────────────────────────

export interface CriarApontamentoInput {
  nr_os: string;
  tecnico_id: string;
  tecnico_nome: string;
  tecnico_email: string;
  servico_id?: string;
  servico_codigo: string;
  servico_descricao: string;
  familia_equipamento?: string;
  observacao_inicial?: string;
}

export async function criarApontamento(input: CriarApontamentoInput): Promise<ApontamentoCS> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('apontamentos_cs')
    .insert({
      nr_os: input.nr_os.trim(),
      tecnico_id: input.tecnico_id,
      tecnico_nome: input.tecnico_nome,
      tecnico_email: input.tecnico_email,
      servico_id: input.servico_id ?? null,
      servico_codigo: input.servico_codigo,
      servico_descricao: input.servico_descricao,
      familia_equipamento: input.familia_equipamento ?? null,
      observacao_inicial: input.observacao_inicial ?? null,
      inicio: now,
      status: 'em_andamento',
    })
    .select()
    .single();
  if (error) throw error;

  await registrarEvento(data.id, 'inicio', {
    id: input.tecnico_id,
    nome: input.tecnico_nome,
    email: input.tecnico_email,
  });

  return data as ApontamentoCS;
}

// ── Pausar ────────────────────────────────────────────────────

export async function pausarApontamento(
  apontamentoId: string,
  motivo: string | undefined,
  user: { id: string; nome: string; email: string }
): Promise<PausaApontamentoCS> {
  const now = new Date().toISOString();

  const { data: pausa, error: pausaErr } = await supabase
    .from('apontamento_pausas_cs')
    .insert({ apontamento_id: apontamentoId, inicio_pausa: now, motivo: motivo ?? null })
    .select()
    .single();
  if (pausaErr) throw pausaErr;

  const { error: updErr } = await supabase
    .from('apontamentos_cs')
    .update({ status: 'pausado', updated_at: now })
    .eq('id', apontamentoId);
  if (updErr) throw updErr;

  await registrarEvento(apontamentoId, 'pausa', user, { motivo, pausa_id: pausa.id });

  return pausa as PausaApontamentoCS;
}

// ── Retomar ───────────────────────────────────────────────────

export async function retomarApontamento(
  apontamentoId: string,
  pausaId: string,
  user: { id: string; nome: string; email: string }
): Promise<void> {
  const now = new Date().toISOString();

  const { error: pausaErr } = await supabase
    .from('apontamento_pausas_cs')
    .update({ fim_pausa: now })
    .eq('id', pausaId);
  if (pausaErr) throw pausaErr;

  const { error: updErr } = await supabase
    .from('apontamentos_cs')
    .update({ status: 'em_andamento', updated_at: now })
    .eq('id', apontamentoId);
  if (updErr) throw updErr;

  await registrarEvento(apontamentoId, 'retomada', user, { pausa_id: pausaId });
}

// ── Finalizar ─────────────────────────────────────────────────

export interface FinalizarInput {
  observacao_final?: string;
  elapsed: ApontamentoAtivo;
}

export async function finalizarApontamento(
  apontamento: ApontamentoAtivo,
  observacao_final: string | undefined,
  user: { id: string; nome: string; email: string }
): Promise<void> {
  const now = new Date().toISOString();

  // Close any open pause first
  const pausaAberta = apontamento.pausas.find(p => !p.fim_pausa);
  if (pausaAberta?.id) {
    await supabase
      .from('apontamento_pausas_cs')
      .update({ fim_pausa: now })
      .eq('id', pausaAberta.id);
  }

  // Calculate total productive and pause minutes
  const inicio = new Date(apontamento.inicio).getTime();
  let totalPausedMs = 0;
  for (const p of apontamento.pausas) {
    const pStart = new Date(p.inicio_pausa).getTime();
    const pEnd = p.fim_pausa ? new Date(p.fim_pausa).getTime() : Date.now();
    totalPausedMs += pEnd - pStart;
  }
  const totalMs = Date.now() - inicio;
  const produtivos = Math.round((totalMs - totalPausedMs) / 60000);
  const pausas = Math.round(totalPausedMs / 60000);

  const { error } = await supabase
    .from('apontamentos_cs')
    .update({
      fim: now,
      status: 'finalizado',
      tempo_produtivo_minutos: Math.max(0, produtivos),
      tempo_pausa_minutos: Math.max(0, pausas),
      observacao_final: observacao_final ?? null,
      updated_at: now,
    })
    .eq('id', apontamento.id);
  if (error) throw error;

  await registrarEvento(apontamento.id, 'finalizacao', user, {
    tempo_produtivo_minutos: produtivos,
    tempo_pausa_minutos: pausas,
  });
}

// ── Consultas ─────────────────────────────────────────────────

export async function getApontamentosHoje(tecnicoId: string): Promise<ApontamentoCS[]> {
  const { data, error } = await supabase
    .from('apontamentos_cs')
    .select('*, pausas:apontamento_pausas_cs(*)')
    .eq('tecnico_id', tecnicoId)
    .gte('inicio', todayStart())
    .lte('inicio', todayEnd())
    .is('deleted_at', null)
    .order('inicio', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApontamentoCS[];
}

export interface FiltroApontamentos {
  tecnico_id?: string;
  data_inicio?: string;
  data_fim?: string;
  servico_codigo?: string;
  nr_os?: string;
  status?: string;
}

export async function getApontamentos(filtro: FiltroApontamentos): Promise<ApontamentoCS[]> {
  let query = supabase
    .from('apontamentos_cs')
    .select('*, pausas:apontamento_pausas_cs(*)')
    .is('deleted_at', null)
    .order('inicio', { ascending: false });

  if (filtro.tecnico_id) query = query.eq('tecnico_id', filtro.tecnico_id);
  if (filtro.data_inicio) query = query.gte('inicio', toISO(filtro.data_inicio));
  if (filtro.data_fim) query = query.lte('inicio', toISO(filtro.data_fim + 'T23:59:59'));
  if (filtro.servico_codigo) query = query.eq('servico_codigo', filtro.servico_codigo);
  if (filtro.nr_os) query = query.ilike('nr_os', `%${filtro.nr_os}%`);
  if (filtro.status) query = query.eq('status', filtro.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ApontamentoCS[];
}

export async function getTecnicos(): Promise<{ id: string; nome: string; email: string }[]> {
  const { data } = await supabase
    .from('apontamentos_cs')
    .select('tecnico_id, tecnico_nome, tecnico_email')
    .is('deleted_at', null);
  if (!data) return [];
  const seen = new Set<string>();
  return data
    .filter(r => { if (seen.has(r.tecnico_id)) return false; seen.add(r.tecnico_id); return true; })
    .map(r => ({ id: r.tecnico_id, nome: r.tecnico_nome, email: r.tecnico_email }));
}

// ── Auditoria ─────────────────────────────────────────────────

async function registrarEvento(
  apontamentoId: string,
  evento: string,
  user: { id: string; nome: string; email: string },
  dadosExtra?: Record<string, unknown>
): Promise<void> {
  await supabase.from('apontamento_eventos_cs').insert({
    apontamento_id: apontamentoId,
    evento,
    usuario_id: user.id,
    usuario_nome: user.nome,
    usuario_email: user.email,
    navegador: navigator.userAgent.slice(0, 200),
    dados_extra: dadosExtra ?? null,
  });
}

// ── Métricas ──────────────────────────────────────────────────

export interface MetricasResumo {
  minutos_produtivos: number;
  minutos_pausa: number;
  qtd_apontamentos: number;
  qtd_os: number;
  por_servico: { servico_codigo: string; servico_descricao: string; minutos: number; qtd: number }[];
}

export async function getMetricasPeriodo(
  tecnicoId: string | null,
  dataInicio: string,
  dataFim: string
): Promise<MetricasResumo> {
  let query = supabase
    .from('apontamentos_cs')
    .select('*')
    .eq('status', 'finalizado')
    .is('deleted_at', null)
    .gte('inicio', toISO(dataInicio))
    .lte('inicio', toISO(dataFim + 'T23:59:59'));

  if (tecnicoId) query = query.eq('tecnico_id', tecnicoId);

  const { data } = await query;
  const rows = (data ?? []) as ApontamentoCS[];

  const minutos_produtivos = rows.reduce((s, r) => s + (r.tempo_produtivo_minutos ?? 0), 0);
  const minutos_pausa = rows.reduce((s, r) => s + (r.tempo_pausa_minutos ?? 0), 0);
  const osSet = new Set(rows.map(r => r.nr_os));

  const byServico = new Map<string, { servico_codigo: string; servico_descricao: string; minutos: number; qtd: number }>();
  for (const r of rows) {
    const k = r.servico_codigo;
    const cur = byServico.get(k) ?? { servico_codigo: k, servico_descricao: r.servico_descricao, minutos: 0, qtd: 0 };
    cur.minutos += r.tempo_produtivo_minutos ?? 0;
    cur.qtd += 1;
    byServico.set(k, cur);
  }

  return {
    minutos_produtivos,
    minutos_pausa,
    qtd_apontamentos: rows.length,
    qtd_os: osSet.size,
    por_servico: Array.from(byServico.values()),
  };
}

// ── BRM ───────────────────────────────────────────────────────

export async function getSSPConfig(): Promise<SSPConfig[]> {
  const { data, error } = await supabase.from('ssp_config_cs').select('*').order('familia').order('servico_codigo');
  if (error) throw error;
  return (data ?? []) as SSPConfig[];
}

export async function upsertSSPConfig(familia: string, servico_codigo: string, ssp_horas: number): Promise<void> {
  const { error } = await supabase.from('ssp_config_cs').upsert({ familia, servico_codigo, ssp_horas, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getBRMEficiencia(dataInicio: string, dataFim: string): Promise<BRMEficienciaRow[]> {
  const { data } = await supabase
    .from('apontamentos_cs')
    .select('familia_equipamento, servico_codigo, servico_descricao, tempo_produtivo_minutos')
    .eq('status', 'finalizado')
    .is('deleted_at', null)
    .not('familia_equipamento', 'is', null)
    .gte('inicio', toISO(dataInicio))
    .lte('inicio', toISO(dataFim + 'T23:59:59'));

  const rows = (data ?? []) as Pick<ApontamentoCS, 'familia_equipamento' | 'servico_codigo' | 'servico_descricao' | 'tempo_produtivo_minutos'>[];
  const sspConfig = await getSSPConfig();
  const sspMap = new Map(sspConfig.map(s => [`${s.familia}|${s.servico_codigo}`, s.ssp_horas]));

  const groups = new Map<string, { familia: string; servico_codigo: string; servico_descricao: string; horas: number[] }>();
  for (const r of rows) {
    if (!r.familia_equipamento) continue;
    const key = `${r.familia_equipamento}|${r.servico_codigo}`;
    if (!groups.has(key)) groups.set(key, { familia: r.familia_equipamento, servico_codigo: r.servico_codigo, servico_descricao: r.servico_descricao, horas: [] });
    groups.get(key)!.horas.push((r.tempo_produtivo_minutos ?? 0) / 60);
  }

  const familiaOrder = ['NOVA series', 'High End', 'Manual'];
  const result: BRMEficienciaRow[] = Array.from(groups.values()).map(g => {
    const count = g.horas.length;
    const avg = count > 0 ? g.horas.reduce((a, b) => a + b, 0) / count : 0;
    const max = count > 0 ? Math.max(...g.horas) : 0;
    const min = count > 0 ? Math.min(...g.horas) : 0;
    const ssp = sspMap.get(`${g.familia}|${g.servico_codigo}`) ?? 0;
    return { familia: g.familia, servico_codigo: g.servico_codigo, servico_descricao: g.servico_descricao, count, avg_horas: avg, max_horas: max, min_horas: min, ssp_horas: ssp, eficiencia: avg > 0 ? (ssp / avg) * 100 : 0 };
  });

  return result.sort((a, b) => {
    const diff = familiaOrder.indexOf(a.familia) - familiaOrder.indexOf(b.familia);
    return diff !== 0 ? diff : a.servico_codigo.localeCompare(b.servico_codigo);
  });
}

export async function getBRMUtilizacao(dataInicio: string, dataFim: string): Promise<{ total_minutos_produtivos: number; qtd_tecnicos: number }> {
  const { data } = await supabase
    .from('apontamentos_cs')
    .select('tecnico_id, tempo_produtivo_minutos')
    .eq('status', 'finalizado')
    .is('deleted_at', null)
    .gte('inicio', toISO(dataInicio))
    .lte('inicio', toISO(dataFim + 'T23:59:59'));
  const rows = (data ?? []) as Pick<ApontamentoCS, 'tecnico_id' | 'tempo_produtivo_minutos'>[];
  const total = rows.reduce((s, r) => s + (r.tempo_produtivo_minutos ?? 0), 0);
  const tecnicos = new Set(rows.map(r => r.tecnico_id)).size;
  return { total_minutos_produtivos: total, qtd_tecnicos: tecnicos };
}
