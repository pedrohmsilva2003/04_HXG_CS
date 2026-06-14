import React from 'react';
import ReactDOM from 'react-dom/client';
import { LogOut } from 'lucide-react';
import './index.css';
import type { User } from './types';
import { autoBackupService } from './services/autoBackupService';

const PortalHeader: React.FC<{ user: User; onLogout: () => void; onShowProfile: () => void }> = ({ user, onLogout, onShowProfile }) => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="https://leica-geosystems.com/-/media/images/hexagon_logo/hexagon_logo_balck_svg.ashx?sc_lang=en"
            alt="Hexagon"
            style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ height: '48px', width: '1px', background: '#D1D5DB' }} />
          <img
            src="https://leica-geosystems.com/-/media/images/leicageosystems/logos%20and%20icons/icons/leica_geosystems_logo.ashx?sc_lang=en"
            alt="Leica"
            style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1F2937' }}>{user.name}</div>
              <div style={{ fontSize: '10px', color: '#6B7280', textAlign: 'right', marginTop: '2px' }}>{roleLabel}</div>
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
              padding: '10px',
              borderRadius: '10px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FFF5F5'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'transparent'; }}
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
    const runBackup = async () => {
      if (!autoBackupService.shouldExecuteBackup()) {
        console.log('[CS] ⏭️ Backup já verificado recentemente');
        return;
      }
      console.log('[CS] ⏰ Aguardando 5 segundos antes de verificar backup...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('[CS] 🔄 Verificando necessidade de backup automático...');
      const result = await autoBackupService.executeAutoBackup();
      if (result.success && result.backupCreated) {
        console.log('[CS] ✅ Backup automático criado:', result.message);
      } else if (result.success && !result.backupCreated) {
        console.log('[CS] ℹ️ Backup não necessário:', result.message);
      } else {
        console.error('[CS] ❌ Erro no backup automático:', result.message);
      }
      autoBackupService.markBackupChecked();
    };
    runBackup();
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
      />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px', width: '100%', flex: 1 }}>
        <section style={{ background: 'white', borderRadius: '20px', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)', padding: '40px', minHeight: '320px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            Centro de Serviço
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
