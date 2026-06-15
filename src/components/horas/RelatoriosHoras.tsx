import React, { useState, useCallback } from 'react';
import { Download, Filter, Search, RefreshCw, AlertCircle, FileText, Table2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getApontamentos, getTecnicos, type FiltroApontamentos } from '../../services/horasService';
import type { ApontamentoCS } from '../../types';
import { useHoras } from '../../contexts/HorasContext';

interface Props {
  isManager: boolean;
  userId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function minToStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatDateBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dateRangePreset(preset: string): { inicio: string; fim: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const inicio = new Date(now);
  switch (preset) {
    case 'hoje': return { inicio: fmt(now), fim: fmt(now) };
    case 'semana': {
      inicio.setDate(now.getDate() - now.getDay() + 1);
      return { inicio: fmt(inicio), fim: fmt(now) };
    }
    case 'mes': {
      inicio.setDate(1);
      return { inicio: fmt(inicio), fim: fmt(now) };
    }
    case 'mes_anterior': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { inicio: fmt(first), fim: fmt(last) };
    }
    default: return { inicio: fmt(now), fim: fmt(now) };
  }
}

// ── Excel export ──────────────────────────────────────────────────────────

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

function exportXLSX(rows: ApontamentoCS[], periodo: string): void {
  const wb = XLSX.utils.book_new();

  // ── Aba 1: Apontamentos detalhados ──────────────────────────────────────
  const detalhes = rows.map(r => ({
    'OS': r.nr_os,
    'Técnico': r.tecnico_nome,
    'E-mail Técnico': r.tecnico_email,
    'Tipo de Serviço': r.servico_descricao,
    'Data': formatDateBR(r.inicio),
    'Hora Início': formatHHMM(r.inicio),
    'Hora Fim': r.fim ? formatHHMM(r.fim) : '',
    'Produtivo (min)': r.tempo_produtivo_minutos ?? '',
    'Produtivo (h)': r.tempo_produtivo_minutos != null ? +(r.tempo_produtivo_minutos / 60).toFixed(2) : '',
    'Pausa (min)': r.tempo_pausa_minutos ?? 0,
    'Nº Pausas': r.pausas?.length ?? 0,
    'Status': r.status === 'finalizado' ? 'Finalizado' : r.status === 'em_andamento' ? 'Em andamento' : 'Pausado',
    'Obs. Inicial': r.observacao_inicial ?? '',
    'Obs. Final': r.observacao_final ?? '',
  }));
  const wsDetalhe = XLSX.utils.json_to_sheet(detalhes);
  setColWidths(wsDetalhe, [12, 22, 28, 24, 12, 12, 12, 16, 14, 12, 10, 14, 30, 30]);
  XLSX.utils.book_append_sheet(wb, wsDetalhe, 'Apontamentos');

  // ── Aba 2: Resumo por Técnico ────────────────────────────────────────────
  const byTec = new Map<string, { nome: string; email: string; minProd: number; minPausa: number; qtd: number; osSet: Set<string> }>();
  for (const r of rows) {
    if (!byTec.has(r.tecnico_id)) {
      byTec.set(r.tecnico_id, { nome: r.tecnico_nome, email: r.tecnico_email, minProd: 0, minPausa: 0, qtd: 0, osSet: new Set() });
    }
    const t = byTec.get(r.tecnico_id)!;
    t.minProd += r.tempo_produtivo_minutos ?? 0;
    t.minPausa += r.tempo_pausa_minutos ?? 0;
    t.qtd += 1;
    t.osSet.add(r.nr_os);
  }
  const resumoTec = Array.from(byTec.values()).map(t => ({
    'Técnico': t.nome,
    'E-mail': t.email,
    'Apontamentos': t.qtd,
    'OS Distintas': t.osSet.size,
    'Total Produtivo (min)': t.minProd,
    'Total Produtivo (h)': +(t.minProd / 60).toFixed(2),
    'Total Pausa (min)': t.minPausa,
    'Utilização (%)': t.minProd > 0 ? +((t.minProd / (t.minProd + t.minPausa)) * 100).toFixed(1) : 0,
  }));
  const wsTec = XLSX.utils.json_to_sheet(resumoTec);
  setColWidths(wsTec, [22, 28, 14, 14, 22, 20, 18, 14]);
  XLSX.utils.book_append_sheet(wb, wsTec, 'Por Técnico');

  // ── Aba 3: Resumo por OS ─────────────────────────────────────────────────
  const byOs = new Map<string, { tecnicos: Set<string>; minProd: number; qtd: number; servicos: Set<string> }>();
  for (const r of rows) {
    if (!byOs.has(r.nr_os)) {
      byOs.set(r.nr_os, { tecnicos: new Set(), minProd: 0, qtd: 0, servicos: new Set() });
    }
    const o = byOs.get(r.nr_os)!;
    o.tecnicos.add(r.tecnico_nome);
    o.minProd += r.tempo_produtivo_minutos ?? 0;
    o.qtd += 1;
    o.servicos.add(r.servico_descricao);
  }
  const resumoOs = Array.from(byOs.entries())
    .sort((a, b) => b[1].minProd - a[1].minProd)
    .map(([nr_os, o]) => ({
      'OS': nr_os,
      'Técnicos': Array.from(o.tecnicos).join(', '),
      'Serviços': Array.from(o.servicos).join(', '),
      'Apontamentos': o.qtd,
      'Total Produtivo (min)': o.minProd,
      'Total Produtivo (h)': +(o.minProd / 60).toFixed(2),
    }));
  const wsOs = XLSX.utils.json_to_sheet(resumoOs);
  setColWidths(wsOs, [12, 35, 35, 14, 22, 20]);
  XLSX.utils.book_append_sheet(wb, wsOs, 'Por OS');

  // ── Aba 4: Pausas detalhadas ─────────────────────────────────────────────
  const pausaRows: object[] = [];
  for (const r of rows) {
    if (!r.pausas?.length) continue;
    for (const p of r.pausas) {
      pausaRows.push({
        'OS': r.nr_os,
        'Técnico': r.tecnico_nome,
        'Data': formatDateBR(r.inicio),
        'Início Pausa': formatHHMM(p.inicio_pausa),
        'Fim Pausa': p.fim_pausa ? formatHHMM(p.fim_pausa) : 'Em aberto',
        'Duração (min)': p.fim_pausa
          ? Math.round((new Date(p.fim_pausa).getTime() - new Date(p.inicio_pausa).getTime()) / 60000)
          : '',
        'Motivo': p.motivo ?? '',
      });
    }
  }
  if (pausaRows.length > 0) {
    const wsPausa = XLSX.utils.json_to_sheet(pausaRows);
    setColWidths(wsPausa, [12, 22, 12, 14, 14, 16, 20]);
    XLSX.utils.book_append_sheet(wb, wsPausa, 'Pausas');
  }

  const nomeArquivo = `apontamentos_${periodo.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
}

// ── Component ─────────────────────────────────────────────────────────────

const RelatoriosHoras: React.FC<Props> = ({ isManager, userId }) => {
  const { servicos } = useHoras();
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [apontamentos, setApontamentos] = useState<ApontamentoCS[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const preset = dateRangePreset('mes');
  const [filtro, setFiltro] = useState<FiltroApontamentos & { preset: string }>({
    preset: 'mes',
    data_inicio: preset.inicio,
    data_fim: preset.fim,
    tecnico_id: isManager ? undefined : userId,
    servico_codigo: undefined,
    nr_os: '',
    status: undefined,
  });

  const applyPreset = (p: string) => {
    const { inicio, fim } = dateRangePreset(p);
    setFiltro(f => ({ ...f, preset: p, data_inicio: inicio, data_fim: fim }));
  };

  const loadTecnicos = useCallback(async () => {
    if (!isManager) return;
    const list = await getTecnicos();
    setTecnicos(list);
  }, [isManager]);

  React.useEffect(() => { loadTecnicos(); }, [loadTecnicos]);

  const search = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getApontamentos({
        tecnico_id: filtro.tecnico_id,
        data_inicio: filtro.data_inicio,
        data_fim: filtro.data_fim,
        servico_codigo: filtro.servico_codigo,
        nr_os: filtro.nr_os || undefined,
        status: filtro.status,
      });
      setApontamentos(data);
      setSearched(true);
    } catch (e: any) {
      setError('Erro ao buscar dados: ' + (e.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const totalProd = apontamentos.reduce((s, a) => s + (a.tempo_produtivo_minutos ?? 0), 0);
  const totalPause = apontamentos.reduce((s, a) => s + (a.tempo_pausa_minutos ?? 0), 0);
  const osSet = new Set(apontamentos.map(a => a.nr_os));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    background: 'white', color: '#374151',
  };

  const periodoLabel = filtro.data_inicio && filtro.data_fim
    ? `${formatDateBR(filtro.data_inicio + 'T12:00:00')} a ${formatDateBR(filtro.data_fim + 'T12:00:00')}`
    : 'periodo';

  return (
    <div>
      {/* Filter panel */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={16} color="#6B7280" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Filtros</span>
        </div>

        {/* Period presets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta semana' },
            { key: 'mes', label: 'Este mês' },
            { key: 'mes_anterior', label: 'Mês anterior' },
            { key: 'custom', label: 'Personalizado' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => p.key !== 'custom' && applyPreset(p.key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: `1.5px solid ${filtro.preset === p.key ? '#005198' : '#E5E7EB'}`,
                background: filtro.preset === p.key ? '#EFF6FF' : 'white',
                color: filtro.preset === p.key ? '#005198' : '#6B7280',
                fontWeight: filtro.preset === p.key ? 700 : 400,
              }}
            >{p.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isManager ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Data inicial</label>
            <input type="date" value={filtro.data_inicio ?? ''} onChange={e => setFiltro(f => ({ ...f, data_inicio: e.target.value, preset: 'custom' }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Data final</label>
            <input type="date" value={filtro.data_fim ?? ''} onChange={e => setFiltro(f => ({ ...f, data_fim: e.target.value, preset: 'custom' }))} style={inputStyle} />
          </div>
          {isManager && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Técnico</label>
              <select value={filtro.tecnico_id ?? ''} onChange={e => setFiltro(f => ({ ...f, tecnico_id: e.target.value || undefined }))} style={inputStyle}>
                <option value="">Todos</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Tipo de serviço</label>
            <select value={filtro.servico_codigo ?? ''} onChange={e => setFiltro(f => ({ ...f, servico_codigo: e.target.value || undefined }))} style={inputStyle}>
              <option value="">Todos</option>
              {servicos.map(s => <option key={s.codigo} value={s.codigo}>{s.descricao}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Número da OS</label>
            <input value={filtro.nr_os ?? ''} onChange={e => setFiltro(f => ({ ...f, nr_os: e.target.value }))} placeholder="Ex: 12345" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={search}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #005198, #01adff)',
              color: 'white', fontWeight: 700, fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={15} />}
            {loading ? 'Buscando...' : 'Buscar'}
          </button>

          {apontamentos.length > 0 && (
            <button
              onClick={() => exportXLSX(apontamentos, periodoLabel)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px',
                border: '1.5px solid #16A34A', background: 'white',
                color: '#16A34A', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}
            >
              <Download size={15} /> Exportar Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Export info */}
      {apontamentos.length > 0 && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <Table2 size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>Planilha Excel com 4 abas</div>
            <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
              <strong>Apontamentos</strong> (todos os registros) ·{' '}
              <strong>Por Técnico</strong> (totais e utilização) ·{' '}
              <strong>Por OS</strong> (tempo por ordem de serviço) ·{' '}
              {apontamentos.some(a => a.pausas?.length) && <><strong>Pausas</strong> (detalhamento de cada pausa)</>}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#DC2626' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Summary cards */}
      {searched && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Apontamentos', value: String(apontamentos.length) },
              { label: 'OS distintas', value: String(osSet.size) },
              { label: 'Tempo produtivo', value: minToStr(totalProd) },
              { label: 'Tempo em pausa', value: minToStr(totalPause) },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>{c.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#005198' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {apontamentos.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #F3F4F6' }}>
              <FileText size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Nenhum apontamento encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                      {(isManager
                        ? ['Data', 'Técnico', 'OS', 'Serviço', 'Início', 'Fim', 'Produtivo', 'Pausas', 'Status']
                        : ['Data', 'OS', 'Serviço', 'Início', 'Fim', 'Produtivo', 'Pausas', 'Status']
                      ).map(h => (
                        <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apontamentos.map((apt, i) => {
                      const sc: Record<string, string> = {
                        finalizado: '#16A34A',
                        em_andamento: '#2563EB',
                        pausado: '#D97706',
                      };
                      return (
                        <tr key={apt.id} style={{ borderBottom: i < apontamentos.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                          onMouseOver={e => (e.currentTarget.style.background = '#FAFBFF')}
                          onMouseOut={e => (e.currentTarget.style.background = 'white')}
                        >
                          <td style={{ padding: '11px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{formatDateBR(apt.inicio)}</td>
                          {isManager && <td style={{ padding: '11px 12px', fontWeight: 600, color: '#111827' }}>{apt.tecnico_nome}</td>}
                          <td style={{ padding: '11px 12px', color: '#374151', fontWeight: 600 }}>{apt.nr_os}</td>
                          <td style={{ padding: '11px 12px', color: '#6B7280' }}>{apt.servico_descricao}</td>
                          <td style={{ padding: '11px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{formatHHMM(apt.inicio)}</td>
                          <td style={{ padding: '11px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{apt.fim ? formatHHMM(apt.fim) : '—'}</td>
                          <td style={{ padding: '11px 12px', color: '#005198', fontWeight: 700 }}>
                            {apt.tempo_produtivo_minutos != null ? minToStr(apt.tempo_produtivo_minutos) : '—'}
                          </td>
                          <td style={{ padding: '11px 12px', color: '#6B7280' }}>
                            {apt.tempo_pausa_minutos ? minToStr(apt.tempo_pausa_minutos) : '—'}
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: sc[apt.status] ?? '#6B7280', background: `${sc[apt.status] ?? '#6B7280'}18` }}>
                              {apt.status === 'em_andamento' ? 'Em andamento' : apt.status === 'pausado' ? 'Pausado' : 'Finalizado'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{apontamentos.length} registro{apontamentos.length !== 1 ? 's' : ''} · {periodoLabel}</span>
                <button
                  onClick={() => exportXLSX(apontamentos, periodoLabel)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '7px', border: '1px solid #D1D5DB', background: 'white', fontSize: '12px', color: '#374151', cursor: 'pointer' }}
                >
                  <Download size={13} /> Exportar Excel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RelatoriosHoras;
