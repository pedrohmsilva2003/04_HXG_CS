import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Clock, TrendingUp, BarChart2, RefreshCw, AlertCircle, CheckCircle, Pause, WifiOff } from 'lucide-react';
import { getApontamentos, getTecnicos, getMetricasPeriodo, type MetricasResumo } from '../../services/horasService';
import type { ApontamentoCS } from '../../types';

interface TecnicoMetrica {
  id: string;
  nome: string;
  email: string;
  metricas: MetricasResumo;
  apontamentoAtual: ApontamentoCS | null;
  inicioDia?: string;
}

const META_DIARIA_MIN = 8 * 60 + 48;
const AUTO_REFRESH_MS = 60 * 1000; // 1 min

function minToStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calcElapsed(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// Live status badge for a technician
const StatusBadge: React.FC<{ apt: ApontamentoCS | null }> = ({ apt }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!apt || apt.status !== 'em_andamento') return;
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, [apt?.id, apt?.status]);

  if (!apt) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#F1F5F9', color: '#64748B' }}>
        <WifiOff size={11} /> Ocioso
      </span>
    );
  }
  if (apt.status === 'em_andamento') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#DCFCE7', color: '#15803D' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
        Em andamento · {calcElapsed(apt.inicio)}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>
      <Pause size={11} /> Pausado
    </span>
  );
};

const DashboardGerencial: React.FC = () => {
  const [tecnicos, setTecnicos] = useState<TecnicoMetrica[]>([]);
  const [aptsHoje, setAptsHoje] = useState<ApontamentoCS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'atividades'>('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const [tecList, apts] = await Promise.all([
        getTecnicos(),
        getApontamentos({ data_inicio: today, data_fim: today }),
      ]);

      const metricasList = await Promise.all(
        tecList.map(async t => {
          const met = await getMetricasPeriodo(t.id, today, today);
          // Find the current open apontamento (em_andamento or pausado)
          const aptAtual = apts.find(a =>
            a.tecnico_id === t.id && (a.status === 'em_andamento' || a.status === 'pausado')
          ) ?? null;
          // Earliest apontamento of the day
          const dayApts = apts.filter(a => a.tecnico_id === t.id);
          const inicioDia = dayApts.length > 0
            ? dayApts.reduce((earliest, a) => a.inicio < earliest ? a.inicio : earliest, dayApts[0].inicio)
            : undefined;
          return { id: t.id, nome: t.nome, email: t.email, metricas: met, apontamentoAtual: aptAtual, inicioDia };
        })
      );

      setTecnicos(metricasList.sort((a, b) => b.metricas.minutos_produtivos - a.metricas.minutos_produtivos));
      setAptsHoje(apts);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError('Erro ao carregar dados gerenciais: ' + (e.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
    // Auto-refresh every minute
    timerRef.current = setInterval(() => load(false), AUTO_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #E5E7EB', borderTop: '3px solid #005198', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <AlertCircle size={20} color="#DC2626" />
        <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
        <button onClick={() => load()} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #DC2626', background: 'white', color: '#DC2626', fontSize: '13px', cursor: 'pointer' }}>Tentar novamente</button>
      </div>
    );
  }

  const totalProd = tecnicos.reduce((s, t) => s + t.metricas.minutos_produtivos, 0);
  const totalOS = tecnicos.reduce((s, t) => s + t.metricas.qtd_os, 0);
  const ativos = tecnicos.filter(t => t.apontamentoAtual?.status === 'em_andamento').length;
  const pausados = tecnicos.filter(t => t.apontamentoAtual?.status === 'pausado').length;
  const emAndamento = aptsHoje.filter(a => a.status !== 'finalizado').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Visão Gerencial</h2>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            &nbsp;·&nbsp;Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '6px' }}>(auto-refresh a cada 1 min)</span>
          </p>
        </div>
        <button
          onClick={() => load()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Gravando agora', value: `${ativos}`, sub: `${pausados} pausados`, icon: <Users size={18} />, color: '#16a34a' },
          { label: 'Apontamentos abertos', value: String(emAndamento), sub: 'em andamento ou pausados', icon: <Clock size={18} />, color: '#d97706' },
          { label: 'OS atendidas hoje', value: String(totalOS), sub: 'ordens distintas', icon: <CheckCircle size={18} />, color: '#005198' },
          { label: 'Total produtivo hoje', value: minToStr(totalProd), sub: `equipe de ${tecnicos.length} técnico${tecnicos.length > 1 ? 's' : ''}`, icon: <TrendingUp size={18} />, color: '#8b5cf6' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Live status panel ─────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
          Status em tempo real — {tecnicos.length} técnico{tecnicos.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tecnicos.length, 3)}, 1fr)`, gap: '16px' }}>
          {tecnicos.map(t => {
            const util = Math.min(100, Math.round((t.metricas.minutos_produtivos / META_DIARIA_MIN) * 100));
            const utilColor = util >= 80 ? '#16a34a' : util >= 50 ? '#d97706' : '#dc2626';
            const isRecording = t.apontamentoAtual?.status === 'em_andamento';
            const isPaused = t.apontamentoAtual?.status === 'pausado';

            return (
              <div key={t.id} style={{
                border: `2px solid ${isRecording ? '#86efac' : isPaused ? '#fcd34d' : '#E5E7EB'}`,
                borderRadius: '14px', padding: '18px',
                background: isRecording ? '#F0FDF4' : isPaused ? '#FFFBEB' : '#FAFAFA',
                transition: 'all 0.3s',
              }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: isRecording
                      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                      : isPaused
                      ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                      : '#E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 800,
                    color: (isRecording || isPaused) ? 'white' : '#9CA3AF',
                    flexShrink: 0,
                    boxShadow: isRecording ? '0 0 0 3px #dcfce7' : isPaused ? '0 0 0 3px #fef9c3' : 'none',
                  }}>
                    {t.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</div>
                    <StatusBadge apt={t.apontamentoAtual} />
                  </div>
                </div>

                {/* Current activity */}
                {t.apontamentoAtual && (
                  <div style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '2px' }}>OS {t.apontamentoAtual.nr_os}</div>
                    <div style={{ color: '#6B7280' }}>{t.apontamentoAtual.servico_descricao}</div>
                    <div style={{ color: '#9CA3AF', marginTop: '3px' }}>Iniciou às {formatHHMM(t.apontamentoAtual.inicio)}</div>
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                    <span style={{ color: '#6B7280' }}>Meta do dia</span>
                    <span style={{ color: utilColor, fontWeight: 700 }}>{util}%</span>
                  </div>
                  <div style={{ background: '#E5E7EB', borderRadius: '100px', height: '7px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '100px', width: `${util}%`, background: utilColor, transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#9CA3AF' }}>
                    <span>{minToStr(t.metricas.minutos_produtivos)} produtivos</span>
                    <span>{t.metricas.qtd_os} OS</span>
                  </div>
                </div>

                {/* Simultaneous recording note */}
                {t.inicioDia && (
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#9CA3AF', textAlign: 'right' }}>
                    Ativo desde {formatHHMM(t.inicioDia)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Concurrent info banner */}
      {ativos > 1 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#1E40AF' }}>
          <strong>{ativos} técnicos gravando simultaneamente.</strong>
          {' '}Cada apontamento é independente no banco de dados — não há conflito entre OS diferentes.
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#F1F5F9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['overview', 'atividades'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              padding: '7px 16px', borderRadius: '7px', border: 'none',
              background: selectedTab === tab ? 'white' : 'transparent',
              color: selectedTab === tab ? '#005198' : '#64748B',
              fontWeight: selectedTab === tab ? 700 : 500,
              fontSize: '13px', cursor: 'pointer',
              boxShadow: selectedTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab === 'overview' ? 'Desempenho do Dia' : `Todas as Atividades (${aptsHoje.length})`}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && (
        <div>
          {tecnicos.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #F3F4F6' }}>
              <Users size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Nenhum técnico com atividade hoje.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    {['Técnico', 'Status', 'OS Atual', 'Serviço Atual', 'Produtivo Hoje', 'Meta (%)', 'OS Atendidas'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tecnicos.map((t, i) => {
                    const util = Math.min(100, Math.round((t.metricas.minutos_produtivos / META_DIARIA_MIN) * 100));
                    const utilColor = util >= 80 ? '#16a34a' : util >= 50 ? '#d97706' : '#dc2626';
                    return (
                      <tr key={t.id} style={{ borderBottom: i < tecnicos.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111827' }}>{t.nome}</td>
                        <td style={{ padding: '12px 14px' }}><StatusBadge apt={t.apontamentoAtual} /></td>
                        <td style={{ padding: '12px 14px', color: '#374151' }}>{t.apontamentoAtual?.nr_os ?? '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: '12px' }}>{t.apontamentoAtual?.servico_descricao ?? '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#005198' }}>{minToStr(t.metricas.minutos_produtivos)}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: utilColor }}>{util}%</td>
                        <td style={{ padding: '12px 14px', color: '#374151' }}>{t.metricas.qtd_os}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'atividades' && (
        <div>
          {aptsHoje.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #F3F4F6' }}>
              <BarChart2 size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Nenhuma atividade hoje.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    {['Técnico', 'OS', 'Serviço', 'Início', 'Fim', 'Produtivo', 'Pausas', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aptsHoje.map((apt, i) => {
                    const sc: Record<string, string> = { finalizado: '#16A34A', em_andamento: '#2563EB', pausado: '#D97706' };
                    return (
                      <tr key={apt.id} style={{ borderBottom: i < aptsHoje.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#111827' }}>{apt.tecnico_nome}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#374151' }}>{apt.nr_os}</td>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6B7280' }}>{apt.servico_descricao}</td>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>{formatHHMM(apt.inicio)}</td>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>{apt.fim ? formatHHMM(apt.fim) : '—'}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#005198' }}>
                          {apt.tempo_produtivo_minutos != null ? minToStr(apt.tempo_produtivo_minutos) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#6B7280' }}>
                          {apt.tempo_pausa_minutos ? minToStr(apt.tempo_pausa_minutos) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: sc[apt.status], background: `${sc[apt.status]}18` }}>
                            {apt.status === 'em_andamento' ? 'Em andamento' : apt.status === 'pausado' ? 'Pausado' : 'Finalizado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '12px 14px', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#9CA3AF' }}>
                {aptsHoje.length} atividade{aptsHoje.length !== 1 ? 's' : ''} hoje
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
};

export default DashboardGerencial;
