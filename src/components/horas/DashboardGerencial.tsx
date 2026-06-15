import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, TrendingUp, BarChart2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getApontamentos, getTecnicos, getMetricasPeriodo, type MetricasResumo } from '../../services/horasService';
import type { ApontamentoCS } from '../../types';

interface TecnicoMetrica {
  id: string;
  nome: string;
  email: string;
  metricas: MetricasResumo;
  ativo: boolean;
}

const META_DIARIA_MIN = 8 * 60 + 48;

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

const DashboardGerencial: React.FC = () => {
  const [tecnicos, setTecnicos] = useState<TecnicoMetrica[]>([]);
  const [aptsHoje, setAptsHoje] = useState<ApontamentoCS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'atividades'>('overview');

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tecList, apts] = await Promise.all([
        getTecnicos(),
        getApontamentos({ data_inicio: today, data_fim: today }),
      ]);

      const metricasList = await Promise.all(
        tecList.map(async t => {
          const met = await getMetricasPeriodo(t.id, today, today);
          const ativo = apts.some(a => a.tecnico_id === t.id && a.status !== 'finalizado');
          return { id: t.id, nome: t.nome, email: t.email, metricas: met, ativo };
        })
      );

      setTecnicos(metricasList.sort((a, b) => b.metricas.minutos_produtivos - a.metricas.minutos_produtivos));
      setAptsHoje(apts);
    } catch (e: any) {
      setError('Erro ao carregar dados gerenciais: ' + (e.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [today]);

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

  const totalProd = tecnicos.reduce((s, t) => s + t.metricas.minutos_produtivos, 0);
  const totalOS = tecnicos.reduce((s, t) => s + t.metricas.qtd_os, 0);
  const ativos = tecnicos.filter(t => t.ativo).length;
  const emAndamento = aptsHoje.filter(a => a.status !== 'finalizado').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Visão Gerencial</h2>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Técnicos ativos', value: `${ativos} / ${tecnicos.length}`, icon: <Users size={18} />, color: '#005198' },
          { label: 'Apontamentos abertos', value: String(emAndamento), icon: <Clock size={18} />, color: '#d97706' },
          { label: 'OS atendidas hoje', value: String(totalOS), icon: <CheckCircle size={18} />, color: '#16a34a' },
          { label: 'Total produtivo hoje', value: minToStr(totalProd), icon: <TrendingUp size={18} />, color: '#8b5cf6' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'white', borderRadius: '14px', padding: '18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

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
            {tab === 'overview' ? 'Por Técnico' : 'Todas as Atividades'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tecnicos.map(t => {
                const util = Math.min(100, Math.round((t.metricas.minutos_produtivos / META_DIARIA_MIN) * 100));
                const utilColor = util >= 80 ? '#16a34a' : util >= 50 ? '#d97706' : '#dc2626';
                return (
                  <div key={t.id} style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: t.ativo ? 'linear-gradient(135deg, #005198, #01adff)' : '#E5E7EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 700, color: t.ativo ? 'white' : '#9CA3AF',
                        flexShrink: 0,
                      }}>
                        {t.nome.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{t.nome}</span>
                          {t.ativo && (
                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, background: '#DCFCE7', color: '#16A34A' }}>
                              Ativo
                            </span>
                          )}
                        </div>
                        <div style={{ background: '#F3F4F6', borderRadius: '100px', height: '8px', overflow: 'hidden', marginBottom: '4px' }}>
                          <div style={{ height: '100%', borderRadius: '100px', width: `${util}%`, background: `linear-gradient(90deg, ${utilColor}, ${utilColor}bb)`, transition: 'width 0.6s' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6B7280' }}>
                          <span>{minToStr(t.metricas.minutos_produtivos)} produtivos</span>
                          <span>{t.metricas.qtd_os} OS</span>
                          <span>{t.metricas.qtd_apontamentos} apt.</span>
                          <span style={{ color: utilColor, fontWeight: 600 }}>{util}% meta</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    {['Técnico', 'OS', 'Serviço', 'Início', 'Tempo', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aptsHoje.map((apt, i) => {
                    const durMin = apt.tempo_produtivo_minutos;
                    const statusColors = {
                      finalizado: '#16A34A',
                      em_andamento: '#2563EB',
                      pausado: '#D97706',
                    };
                    return (
                      <tr key={apt.id} style={{ borderBottom: i < aptsHoje.length - 1 ? '1px solid #F3F4F6' : 'none', background: 'white' }}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>{apt.tecnico_nome}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{apt.nr_os}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{apt.servico_descricao}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{formatHHMM(apt.inicio)}</td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151' }}>
                          {durMin != null ? minToStr(durMin) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                            color: statusColors[apt.status] ?? '#6B7280',
                            background: `${statusColors[apt.status] ?? '#6B7280'}18`,
                          }}>
                            {apt.status === 'em_andamento' ? 'Em andamento' : apt.status === 'pausado' ? 'Pausado' : 'Finalizado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardGerencial;
