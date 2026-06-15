import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Settings, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getBRMEficiencia,
  getBRMUtilizacao,
  getSSPConfig,
  upsertSSPConfig,
} from '../../services/horasService';
import type { BRMEficienciaRow, SSPConfig, BRMAgrupamento } from '../../types';

const SERVICOS_LABEL: Record<string, string> = {
  extended_maintenance: 'Ext. Maintenance',
  standard_maintenance: 'Std. Maintenance',
  inspection: 'Inspection',
};

const FAMILIAS = ['NOVA series', 'High End', 'Manual'];

function contarDiasUteis(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getQuarterRange(year: number, q: number): { start: string; end: string; label: string } {
  const startMonth = q * 3;
  const s = new Date(year, startMonth, 1);
  const e = new Date(year, startMonth + 3, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(s), end: fmt(e), label: `Q${q + 1} ${year}` };
}

type PeriodoId = 'q_atual' | 'q_anterior' | 'ano_atual' | 'ano_2025' | 'custom';

function getPresetDates(id: PeriodoId): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  switch (id) {
    case 'q_atual': return getQuarterRange(year, q);
    case 'q_anterior': {
      const pq = q === 0 ? 3 : q - 1;
      const py = q === 0 ? year - 1 : year;
      return getQuarterRange(py, pq);
    }
    case 'ano_atual': return { start: `${year}-01-01`, end: `${year}-12-31`, label: `${year}` };
    case 'ano_2025': return { start: '2025-01-01', end: '2025-12-31', label: '2025' };
    default: return getQuarterRange(year, q);
  }
}

const eficienciaColor = (e: number) => e >= 80 ? '#15803D' : e >= 60 ? '#D97706' : '#DC2626';
const eficienciaBg    = (e: number) => e >= 80 ? '#DCFCE7' : e >= 60 ? '#FEF3C7' : '#FEE2E2';

const RelatoriosBRM: React.FC = () => {
  const [periodoId, setPeriodoId] = useState<PeriodoId>('q_anterior');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [agrupamento, setAgrupamento] = useState<BRMAgrupamento>('familia');

  const [loading, setLoading] = useState(false);
  const [eficiencia, setEficiencia] = useState<BRMEficienciaRow[]>([]);
  const [utilTotal, setUtilTotal] = useState(0);
  const [utilTecnicos, setUtilTecnicos] = useState(1);

  const [feriados, setFeriados] = useState(0);
  const [horasDia, setHorasDia] = useState(8);

  const [capacFamilia, setCapacFamilia] = useState('NOVA series');
  const [capacServico, setCapacServico] = useState('extended_maintenance');
  const [capacTecnicos, setCapacTecnicos] = useState(1);
  const [capacEstacoes, setCapacEstacoes] = useState(2);

  const [sspConfig, setSSPConfig] = useState<SSPConfig[]>([]);
  const [showSSPEditor, setShowSSPEditor] = useState(false);
  const [editingSSP, setEditingSSP] = useState<Record<string, string>>({});

  const [periodoLabel, setPeriodoLabel] = useState('');
  const [diasUteis, setDiasUteis] = useState(0);

  const getDateRange = useCallback((): { start: string; end: string } => {
    if (periodoId === 'custom') return { start: customStart, end: customEnd };
    const p = getPresetDates(periodoId);
    return { start: p.start, end: p.end };
  }, [periodoId, customStart, customEnd]);

  const load = useCallback(async () => {
    const { start, end } = getDateRange();
    if (!start || !end) return;
    setLoading(true);
    try {
      const [ef, util, ssp] = await Promise.all([
        getBRMEficiencia(start, end, agrupamento),
        getBRMUtilizacao(start, end),
        getSSPConfig(),
      ]);
      setEficiencia(ef);
      setUtilTotal(util.total_minutos_produtivos);
      setUtilTecnicos(util.qtd_tecnicos || 1);
      setSSPConfig(ssp);
      const label = periodoId === 'custom' ? `${start} — ${end}` : getPresetDates(periodoId).label;
      setPeriodoLabel(label);
      setDiasUteis(contarDiasUteis(start, end));
    } finally {
      setLoading(false);
    }
  }, [getDateRange, periodoId, agrupamento]);

  useEffect(() => { load(); }, [load]);

  // Utilization
  const diasNominais = Math.max(0, diasUteis - feriados);
  const horasNominais = diasNominais * horasDia * utilTecnicos;
  const horasProdutivas = utilTotal / 60;
  const utilizacao = horasNominais > 0 ? (horasProdutivas / horasNominais) * 100 : 0;
  const utilizacaoColor = utilizacao >= 70 ? '#15803D' : utilizacao >= 50 ? '#D97706' : '#DC2626';

  // Capacity
  const sspCapac = sspConfig.find(s => s.familia === capacFamilia && s.servico_codigo === capacServico)?.ssp_horas ?? 0;
  const reparosPorPeriodo = sspCapac > 0 ? (diasUteis * horasDia) / sspCapac : 0;

  // SSP editing
  const handleSSPSave = async (familia: string, servico_codigo: string) => {
    const key = `${familia}|${servico_codigo}`;
    const val = parseFloat(editingSSP[key] ?? '0');
    if (isNaN(val) || val <= 0) return;
    await upsertSSPConfig(familia, servico_codigo, val);
    setSSPConfig(prev => prev.map(s =>
      s.familia === familia && s.servico_codigo === servico_codigo ? { ...s, ssp_horas: val } : s
    ));
    setEditingSSP(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const maxBar = Math.max(...eficiencia.map(r => Math.max(r.avg_horas, r.ssp_horas)), 1);

  const presets: { id: PeriodoId; label: string }[] = [
    { id: 'q_atual',    label: getPresetDates('q_atual').label },
    { id: 'q_anterior', label: `← ${getPresetDates('q_anterior').label}` },
    { id: 'ano_atual',  label: new Date().getFullYear().toString() },
    { id: 'ano_2025',   label: '2025' },
    { id: 'custom',     label: 'Personalizado' },
  ];

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #005198, #01adff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>BRM — Relatório Trimestral</h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>SSP Efficiency · Utilização · Capacidade Teórica</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', background: 'white', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      {/* Period selector */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Período de análise</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button key={p.id} onClick={() => setPeriodoId(p.id)} style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${periodoId === p.id ? '#005198' : '#E5E7EB'}`,
              background: periodoId === p.id ? '#EFF6FF' : 'white',
              color: periodoId === p.id ? '#005198' : '#374151',
            }}>{p.label}</button>
          ))}
        </div>
        {periodoId === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '7px 10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} />
            <span style={{ color: '#9CA3AF' }}>até</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '7px 10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} />
            <button onClick={load} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#005198', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Buscar</button>
          </div>
        )}
        {periodoLabel && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
            <strong style={{ color: '#374151' }}>{periodoLabel}</strong> · {diasUteis} dias úteis no período
          </div>
        )}
      </div>

      {/* ── SSP EFFICIENCY ── */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>SSP efficiency (reality vs. service product)</h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Eficiência = SSP ÷ Média real × 100. Verde ≥80%, laranja ≥60%, vermelho &lt;60%.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              {([['familia', 'Família (Col C)'], ['clase', 'Clase (Col E)']] as [BRMAgrupamento, string][]).map(([id, label]) => (
                <button key={id} onClick={() => setAgrupamento(id)} style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: agrupamento === id ? 'white' : 'transparent',
                  color: agrupamento === id ? '#005198' : '#64748B',
                  boxShadow: agrupamento === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>{label}</button>
              ))}
            </div>
            <button onClick={() => setShowSSPEditor(!showSSPEditor)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #E5E7EB', background: 'white', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>
              <Settings size={13} /> SSP {showSSPEditor ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* SSP Config Editor */}
        {showSSPEditor && (
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Valores SSP configurados (horas por família + tipo)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    {['Família', 'Serviço', 'SSP (h)', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'SSP (h)' ? 'center' : 'left', color: '#6B7280', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sspConfig.map(s => {
                    const key = `${s.familia}|${s.servico_codigo}`;
                    const editing = editingSSP[key] !== undefined;
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 600 }}>{s.familia}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{SERVICOS_LABEL[s.servico_codigo] ?? s.servico_codigo}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {editing
                            ? <input type="number" value={editingSSP[key]} onChange={e => setEditingSSP(p => ({ ...p, [key]: e.target.value }))} step="0.5" style={{ width: '70px', padding: '4px 6px', border: '1.5px solid #005198', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }} />
                            : <strong>{s.ssp_horas}h</strong>
                          }
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {editing
                            ? <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button onClick={() => handleSSPSave(s.familia, s.servico_codigo)} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: '#005198', color: 'white', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>Salvar</button>
                                <button onClick={() => setEditingSSP(p => { const n = { ...p }; delete n[key]; return n; })} style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #D1D5DB', background: 'white', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                              </div>
                            : <button onClick={() => setEditingSSP(p => ({ ...p, [key]: String(s.ssp_horas) }))} style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid #D1D5DB', background: 'white', fontSize: '11px', cursor: 'pointer', color: '#374151' }}>Editar</button>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {eficiencia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Sem dados de família de equipamento</div>
            <div style={{ fontSize: '12px', lineHeight: 1.6 }}>Os dados aparecerão após os técnicos selecionarem a <strong>Família do Equipamento</strong><br />ao iniciar apontamentos (campo novo no formulário).</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Família', 'Serviço', 'Qtd', 'Média (h)', 'Máx', 'Mín', 'SSP', 'Eficiência', 'Visual'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: ['Qtd','Média (h)','Máx','Mín','SSP','Eficiência'].includes(h) ? 'center' : 'left', fontWeight: 700, fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eficiencia.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '11px 12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      {row.grupo}
                      {agrupamento === 'clase' && row.familia && <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>{row.familia}</div>}
                      {agrupamento === 'familia' && row.clase && <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>{row.clase}</div>}
                    </td>
                    <td style={{ padding: '11px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{SERVICOS_LABEL[row.servico_codigo] ?? row.servico_descricao}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center', color: '#374151' }}>{row.count}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>{row.avg_horas.toFixed(1)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center', color: '#374151' }}>{row.max_horas.toFixed(1)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center', color: '#374151' }}>{row.min_horas.toFixed(1)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center', fontWeight: 700, color: '#005198' }}>{row.ssp_horas}h</td>
                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, background: eficienciaBg(row.eficiencia), color: eficienciaColor(row.eficiencia) }}>
                        {row.eficiencia.toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '11px 12px', minWidth: '120px' }}>
                      <div style={{ position: 'relative', height: '18px', background: '#F3F4F6', borderRadius: '4px' }}>
                        <div style={{ height: '100%', borderRadius: '4px', width: `${Math.min(100, (row.avg_horas / maxBar) * 100)}%`, background: 'linear-gradient(90deg, #005198, #01adff)' }} />
                        <div style={{ position: 'absolute', top: '-3px', bottom: '-3px', left: `${Math.min(100, (row.ssp_horas / maxBar) * 100)}%`, width: '2px', background: '#F59E0B', transform: 'translateX(-50%)' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                        <span style={{ color: '#005198' }}>■</span> Média &nbsp;
                        <span style={{ color: '#F59E0B' }}>│</span> SSP
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── UTILIZATION ── */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Capacity planning, projection and Utilization</h3>
        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>Ajuste os inputs — dias úteis é calculado automaticamente a partir do período selecionado.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', background: '#F8FAFC', borderRadius: '10px', padding: '14px' }}>
          {[
            { label: 'Dias úteis', value: diasUteis, readOnly: true, note: 'calculado' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '16px', fontWeight: 800, color: '#111827', textAlign: 'center' }}>{f.value}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px', textAlign: 'center' }}>{f.note}</div>
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feriados/Ausências</label>
            <input type="number" min="0" value={feriados} onChange={e => setFeriados(Math.max(0, parseInt(e.target.value) || 0))} style={{ width: '100%', padding: '10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horas/dia</label>
            <input type="number" min="1" max="12" value={horasDia} onChange={e => setHorasDia(Math.max(1, parseInt(e.target.value) || 8))} style={{ width: '100%', padding: '10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº de técnicos</label>
            <input type="number" min="1" value={utilTecnicos} onChange={e => setUtilTecnicos(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%', padding: '10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
            <tbody>
              {[
                { label: 'Dias úteis no período', value: `${diasUteis} dias`, bg: '#F8FAFC' },
                { label: 'Dias nominais trabalhados', value: `${diasNominais} dias`, bg: 'white' },
                { label: 'Horas nominais (total equipe)', value: `${horasNominais.toFixed(0)}h`, bg: '#F8FAFC' },
                { label: 'Horas produtivas registradas', value: `${horasProdutivas.toFixed(1)}h`, bg: 'white' },
              ].map((r, i) => (
                <tr key={i} style={{ background: r.bg, borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{r.label}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#111827', textAlign: 'right' }}>{r.value}</td>
                </tr>
              ))}
              <tr style={{ background: '#EFF6FF' }}>
                <td style={{ padding: '11px 14px', fontWeight: 800, color: '#111827' }}>Utilização</td>
                <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: utilizacaoColor }}>{utilizacao.toFixed(1)}%</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Utilização no período</div>
            <div style={{ fontSize: '52px', fontWeight: 900, color: utilizacaoColor, lineHeight: 1, marginBottom: '14px' }}>{utilizacao.toFixed(1)}%</div>
            <div style={{ height: '12px', background: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', borderRadius: '6px', width: `${Math.min(100, utilizacao)}%`, background: utilizacaoColor, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF' }}>
              <span>0%</span>
              <span style={{ color: utilizacao >= 70 ? '#15803D' : '#D97706' }}>Meta ≥70%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAPACITY PLANNING ── */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Current Theoretical Capacity</h3>
        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>Selecione família e serviço para calcular a capacidade teórica com base nos dias úteis do período.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Família</label>
              <select value={capacFamilia} onChange={e => setCapacFamilia(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
                {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de serviço</label>
              <select value={capacServico} onChange={e => setCapacServico(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
                <option value="extended_maintenance">Ext. Maintenance</option>
                <option value="standard_maintenance">Std. Maintenance</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Técnicos</label>
                <input type="number" min="1" value={capacTecnicos} onChange={e => setCapacTecnicos(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%', padding: '10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estações</label>
                <input type="number" min="1" value={capacEstacoes} onChange={e => setCapacEstacoes(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%', padding: '10px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
              <tbody>
                {[
                  { label: `SSP — ${capacFamilia} · ${SERVICOS_LABEL[capacServico]}`, value: `${sspCapac}h`, big: false, highlight: false },
                  { label: 'Reparos teóricos / trimestre', value: reparosPorPeriodo.toFixed(1), big: false, highlight: false },
                  { label: 'Técnicos', value: String(capacTecnicos), big: false, highlight: false },
                  { label: 'Estações disponíveis', value: String(capacEstacoes), big: false, highlight: false },
                  { label: 'Capacidade por ano', value: `${(reparosPorPeriodo * 4).toFixed(1)} eq/ano`, big: true, highlight: true },
                ].map((r, i) => (
                  <tr key={i} style={{ background: r.highlight ? '#EFF6FF' : i % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '11px 14px', color: r.highlight ? '#111827' : '#374151', fontWeight: r.highlight ? 800 : 400 }}>{r.label}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: r.big ? '20px' : '14px', fontWeight: 800, color: r.highlight ? '#005198' : '#111827' }}>{r.value}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', lineHeight: 1.5 }}>
              Fórmula: (dias úteis × {horasDia}h) ÷ SSP = reparos/trimestre · ×4 = capacidade anual
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RelatoriosBRM;
