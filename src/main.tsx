import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogOut, Users, Bell } from 'lucide-react';
import './index.css';
import type { User } from './types';
import { autoBackupService } from './services/autoBackupService';

const PortalHeader: React.FC<{ user: User; onLogout: () => void; onShowProfile: () => void; onOpenApprovals: () => void; pendingApprovalsCount?: number; showManagerActions?: boolean; }> = ({ user, onLogout, onShowProfile, onOpenApprovals, pendingApprovalsCount = 0, showManagerActions = true }) => {
  const roleLabel = user.role === 'manager' ? 'Gestor' : 'Colaborador';

  return (
    <header style={{
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #005198',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 16px',
        height: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          cursor: 'pointer',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            gap: '16px',
          }}>
            <img
              src="https://leica-geosystems.com/-/media/images/hexagon_logo/hexagon_logo_balck_svg.ashx?sc_lang=en"
              alt="Hexagon"
              style={{
                height: '60px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <div style={{
              height: '48px',
              width: '1px',
              background: '#D1D5DB',
            }} />
            <img
              src="https://leica-geosystems.com/-/media/images/leicageosystems/logos%20and%20icons/icons/leica_geosystems_logo.ashx?sc_lang=en"
              alt="Leica"
              style={{
                height: '60px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user.role === 'manager' && showManagerActions && (
            <>
              <button
                onClick={() => {}}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = '#005198';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Gerenciar Usuários"
              >
                <Users size={22} />
              </button>
              <button
                onClick={onOpenApprovals}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = '#005198';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Aprovações Pendentes"
              >
                <Bell size={22} />
                {pendingApprovalsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '20px',
                    background: '#EF4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </>
          )}
          <div style={{ textAlign: 'right' }}>
            <button
              style={{
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F3F4F6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={onShowProfile}
              title="Ver Perfil"
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1F2937' }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '2px',
              }}>
                {roleLabel}
              </div>
            </button>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#EF4444',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '10px 10px',
              borderRadius: '10px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#DC2626';
              e.currentTarget.style.background = '#FFF5F5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Sair"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    if (!autoBackupService.shouldExecuteBackup()) return;
    autoBackupService.executeAutoBackup().then(result => {
      if (result.backupCreated) console.log('[CS] Backup automático criado:', result.message);
      autoBackupService.markBackupChecked();
    });
  }, []);

  const currentUser: User = {
    id: '1',
    email: 'dev@hexagon.com',
    name: 'Usuário Dev',
    role: 'manager',
    password: '',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <PortalHeader
        user={currentUser}
        onLogout={() => {}}
        onShowProfile={() => {}}
        onOpenApprovals={() => {}}
        pendingApprovalsCount={0}
        showManagerActions={false}
      />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px', width: '100%', flex: 1 }}>
        <section style={{ background: 'white', borderRadius: '20px', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)', padding: '40px', minHeight: '320px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            Controle de Horas Técnicas
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.75, color: '#4B5563' }}>
            Em desenvolvimento
          </p>
        </section>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
