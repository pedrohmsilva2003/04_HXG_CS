import React, { useState } from 'react';
import { Play, BarChart2, ClipboardList, Users, FileText, TrendingUp } from 'lucide-react';
import IniciarApontamento from '../components/horas/IniciarApontamento';
import DashboardTecnico from '../components/horas/DashboardTecnico';
import DashboardGerencial from '../components/horas/DashboardGerencial';
import RelatoriosHoras from '../components/horas/RelatoriosHoras';
import RelatoriosBRM from '../components/horas/RelatoriosBRM';
import { useHoras } from '../contexts/HorasContext';
import type { User } from '../types';

interface Props {
  user: User;
}

type Tab = 'apontamento' | 'dashboard' | 'gerencial' | 'relatorios' | 'brm';

const HorasPage: React.FC<Props> = ({ user }) => {
  const { apontamentoAtivo } = useHoras();
  const isManager = user.role === 'manager';
  const [activeTab, setActiveTab] = useState<Tab>('apontamento');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; managerOnly?: boolean }[] = [
    { id: 'apontamento', label: apontamentoAtivo ? 'Em andamento' : 'Novo Apontamento', icon: <Play size={16} /> },
    { id: 'dashboard', label: 'Meu Painel', icon: <BarChart2 size={16} /> },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText size={16} /> },
    { id: 'gerencial', label: 'Gerencial', icon: <Users size={16} />, managerOnly: true },
    { id: 'brm', label: 'BRM', icon: <TrendingUp size={16} />, managerOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.managerOnly || isManager);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #005198 0%, #01adff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ClipboardList size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              Controle de Horas Técnicas
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Registro e acompanhamento de atividades de campo · Centro de Serviço
            </p>
          </div>
        </div>
      </div>

      {/* Active apontamento banner (if on other tabs) */}
      {apontamentoAtivo && activeTab !== 'apontamento' && (
        <div
          onClick={() => setActiveTab('apontamento')}
          style={{
            background: apontamentoAtivo.status === 'em_andamento'
              ? 'linear-gradient(135deg, #052e16, #14532d)'
              : 'linear-gradient(135deg, #431407, #7c2d12)',
            borderRadius: '12px', padding: '12px 18px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: apontamentoAtivo.status === 'em_andamento' ? '#4ade80' : '#fbbf24',
            flexShrink: 0, animation: apontamentoAtivo.status === 'em_andamento' ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
              OS {apontamentoAtivo.nr_os} · {apontamentoAtivo.servico_descricao}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginLeft: '10px' }}>
              {apontamentoAtivo.status === 'em_andamento' ? 'Em andamento' : 'Pausado'} — clique para gerenciar
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px',
        background: '#F1F5F9', borderRadius: '12px', padding: '4px',
        width: 'fit-content',
      }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: '9px', border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#005198' : '#64748B',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px', cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
              position: 'relative',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'apontamento' && apontamentoAtivo && (
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: apontamentoAtivo.status === 'em_andamento' ? '#16a34a' : '#d97706',
                animation: 'pulse-dot 2s infinite',
                position: 'absolute', top: '7px', right: '7px',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'apontamento' && (
          <IniciarApontamento user={user} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTecnico userId={user.id} />
        )}
        {activeTab === 'relatorios' && (
          <RelatoriosHoras isManager={isManager} userId={user.id} />
        )}
        {activeTab === 'gerencial' && isManager && (
          <DashboardGerencial />
        )}
        {activeTab === 'brm' && isManager && (
          <RelatoriosBRM />
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
};

export default HorasPage;
