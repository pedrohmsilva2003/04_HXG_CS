import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, Clock, CheckCircle, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { getApontamentosHoje, getMetricasPeriodo, type MetricasResumo } from '../../services/horasService';
import type { ApontamentoCS } from '../../types';

interface Props {
  userId: string;
}

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

const SERVICE_COLORS: Record<string, string> = {
  inspection: '#0ea5e9',
  standard_maintenance: '#8b5cf6',
  extended_maintenance: '#f59e0b',
};

const META_DIARIA_MIN = 8 * 60 + 48; // 8h48 (44h / 5 dias)

const ApontamentoRow: React.FC<{ apt: ApontamentoCS }> = ({ apt }) => {
  const [expanded, setExpanded] = useState(false);
  const durMin = apt.tempo_produtivo_minutos ?? 0;
  const pauseMin = apt.tempo_pausa_minutos ?? 0;
  const statusColors = {
    finalizado: { bg: '#F0FDF4', text: '#16A34A', label: 'Finalizado' },
    em_andamento: { bg: '#EFF6FF', text: '#2563EB', label: 'Em andamento' },
    pausado: { bg: '#FFFBEB', text: '#D97706', label: 'Pausado' },
  };
  const sc = statusColors[apt.status] ?? statusColors.finalizado;
  const serviceColor = SERVICE_COLORS[apt.servico_codigo] ?? '#64748b';

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: '8px' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: serviceColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>OS {apt.nr_os}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
              background: sc.bg, color: sc.text,
            }}>{sc.label}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{apt.servico_descricao}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            {apt.status === 'finalizado' ? minToStr(durMin) : '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {formatHHMM(apt.inicio)}{apt.fim ? ` → ${formatHHMM(apt.fim)}` : ''}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px 32px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {[
              { label: 'Início', value: formatHHMM(apt.inicio) },
              { label: 'Fim', value: apt.fim ? formatHHMM(apt.fim) : '—' },
              { label: 'Tempo produtivo', value: minToStr(durMin) },
              { label: 'Tempo em pausa', value: minToStr(pauseMin) },
            ].map(item => (
              <div key={item.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {apt.observacao_inicial && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
              <span style={{ fontWeight: 600 }}>Obs. inicial:</span> {apt.observacao_inicial}
            </div>
          )}
          {apt.observacao_final && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6B7280' }}>
              <span style={{ fontWeight: 600 }}>Obs. final:</span> {apt.observacao_final}
            </div>
          )}
          {apt.pausas && apt.pausas.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Pausas</div>
              {apt.pausas.map((p, i) => (
                <div key={p.id} style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
                  {i + 1}. {formatHHMM(p.inicio_pausa)}
                  {p.fim_pausa ? ` → ${formatHHMM(p.fim_pausa)}` : ' (em curso)'}
                  {p.motivo ? ` · ${p.motivo}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DashboardTecnico: React.FC<Props> = ({ userId }) => {
  const [apontamentos, setApontamentos] = useState<ApontamentoCS[]>([]);
  const [metricas, setMetricas] = useState<MetricasResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [apts, met] = await Promise.all([
        getApontamentosHoje(userId),
        getMetricasPeriodo(userId, today, today),
      ]);
      setApontamentos(apts);
      setMetricas(met);
    } catch (e: any) {
      setError('Erro ao carregar dados: ' + (e.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  useEffect(() => { load(); }, [load]);

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
        <button onClick={load} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: '1px solid #DC2626', background: 'white', color: '#DC2626', fontSize: '13px', cursor: 'pointer' }}>Tentar novamente</button>
      </div>
    );
  }

  const prodMin = metricas?.minutos_produtivos ?? 0;
  const pauseMin = metricas?.minutos_pausa ?? 0;
  const utilizacao = Math.min(100, Math.round((prodMin / META_DIARIA_MIN) * 100));
  const utilizacaoColor = utilizacao >= 80 ? '#16a34a' : utilizacao >= 50 ? '#d97706' : '#dc2626';

  return (
    <div>
      {/* Metrics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: 'Horas produtivas',
            value: minToStr(prodMin),
            sub: `Meta: ${minToStr(META_DIARIA_MIN)}`,
            icon: <Clock size={20} />, color: '#005198',
          },
          {
            label: 'Utilização do dia',
            value: `${utilizacao}%`,
            sub: utilizacao >= 80 ? 'Ótimo!' : utilizacao >= 50 ? 'Regular' : 'Abaixo da meta',
            icon: <TrendingUp size={20} />, color: utilizacaoColor,
          },
          {
            label: 'OS atendidas',
            value: String(metricas?.qtd_os ?? 0),
            sub: `${metricas?.qtd_apontamentos ?? 0} apontamentos`,
            icon: <CheckCircle size={20} />, color: '#16a34a',
          },
          {
            label: 'Tempo em pausas',
            value: minToStr(pauseMin),
            sub: prodMin > 0 ? `${Math.round((pauseMin / (prodMin + pauseMin)) * 100)}% do total` : '—',
            icon: <BarChart2 size={20} />, color: '#8b5cf6',
          },
        ].map(card => (
          <div key={card.label} style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: card.color, marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Utilization bar */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Progresso do dia</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={load} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}><RefreshCw size={14} /></button>
            <span style={{ fontSize: '13px', color: utilizacaoColor, fontWeight: 700 }}>{utilizacao}% da meta</span>
          </div>
        </div>
        <div style={{ background: '#F3F4F6', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px', width: `${utilizacao}%`,
            background: `linear-gradient(90deg, ${utilizacaoColor}, ${utilizacaoColor}aa)`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>0h</span>
          <span>Meta: {minToStr(META_DIARIA_MIN)}</span>
        </div>
      </div>

      {/* Per-service breakdown */}
      {(metricas?.por_servico?.length ?? 0) > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '14px' }}>Por tipo de serviço</div>
          {metricas!.por_servico.map(s => {
            const pct = prodMin > 0 ? Math.round((s.minutos / prodMin) * 100) : 0;
            const color = SERVICE_COLORS[s.servico_codigo] ?? '#64748b';
            return (
              <div key={s.servico_codigo} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>{s.servico_descricao}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{minToStr(s.minutos)} · {s.qtd} apt.</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '100px', width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Today's apontamentos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            Apontamentos de hoje <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 400 }}>({apontamentos.length})</span>
          </h3>
        </div>
        {apontamentos.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #F3F4F6' }}>
            <Clock size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Nenhum apontamento registrado hoje.</p>
          </div>
        ) : (
          apontamentos.map(apt => <ApontamentoRow key={apt.id} apt={apt} />)
        )}
      </div>
    </div>
  );
};

export default DashboardTecnico;
