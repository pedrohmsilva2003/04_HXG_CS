import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, AlertTriangle, Clock, Coffee, Bell } from 'lucide-react';
import { useHoras } from '../../contexts/HorasContext';

interface Alert {
  id: string;
  type: 'idle' | 'long_activity' | 'end_of_shift' | 'coffee' | 'info';
  title: string;
  message: string;
  autoClose?: number;
}

// Work schedule constants
const WORK_PERIODS = [
  { start: [8, 0], end: [11, 48] },
  { start: [13, 0], end: [18, 0] },
];
const COFFEE_TIMES = [[9, 0], [15, 0]];
const IDLE_THRESHOLD_MIN = 30;
const LONG_ACTIVITY_THRESHOLD_MIN = 4 * 60;
const END_OF_SHIFT_WARN_MIN = 5;

function minutesFromMidnight(h: number, m: number): number {
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function isWorkingHours(): boolean {
  const now = nowMinutes();
  return WORK_PERIODS.some(p =>
    now >= minutesFromMidnight(p.start[0], p.start[1]) &&
    now <= minutesFromMidnight(p.end[0], p.end[1])
  );
}

function minutesToShiftEnd(): number | null {
  const now = nowMinutes();
  for (const p of WORK_PERIODS) {
    const end = minutesFromMidnight(p.end[0], p.end[1]);
    if (now >= minutesFromMidnight(p.start[0], p.start[1]) && now <= end) {
      return end - now;
    }
  }
  return null;
}

const AlertToast: React.FC<{ alert: Alert; onDismiss: (id: string) => void }> = ({ alert, onDismiss }) => {
  useEffect(() => {
    if (alert.autoClose) {
      const t = setTimeout(() => onDismiss(alert.id), alert.autoClose);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const colors = {
    idle: { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', iconBg: '#FEE2E2' },
    long_activity: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', iconBg: '#FEF3C7' },
    end_of_shift: { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', iconBg: '#DBEAFE' },
    coffee: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', iconBg: '#DCFCE7' },
    info: { bg: '#F8FAFC', border: '#CBD5E1', icon: '#64748B', iconBg: '#F1F5F9' },
  };
  const c = colors[alert.type];

  const Icon = alert.type === 'coffee' ? Coffee
    : alert.type === 'end_of_shift' ? Clock
    : alert.type === 'long_activity' ? AlertTriangle
    : alert.type === 'idle' ? Bell
    : AlertTriangle;

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px',
      padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginBottom: '10px',
      maxWidth: '360px', width: '100%', animation: 'slideIn 0.2s ease',
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px', background: c.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={c.icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>
          {alert.title}
        </div>
        <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>
          {alert.message}
        </div>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', padding: '2px', flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

const AlertSystem: React.FC = () => {
  const { apontamentoAtivo, elapsedSeconds } = useHoras();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const dismissedRef = useRef<Set<string>>(new Set());
  const lastActivityCheckRef = useRef<number>(Date.now());

  const addAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const id = `${alert.type}_${Date.now()}`;
    if (dismissedRef.current.has(alert.type)) return;
    setAlerts(prev => {
      if (prev.some(a => a.type === alert.type)) return prev;
      return [...prev, { ...alert, id }];
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert) {
        dismissedRef.current.add(alert.type);
        // Re-enable after 1h for repeating alerts
        setTimeout(() => dismissedRef.current.delete(alert.type), 60 * 60 * 1000);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  // Check every minute
  useEffect(() => {
    const check = () => {
      if (!isWorkingHours()) return;

      // 1. Idle alert — no active apontamento for 30+ min during work hours
      if (!apontamentoAtivo) {
        const idleMin = Math.floor((Date.now() - lastActivityCheckRef.current) / 60000);
        if (idleMin >= IDLE_THRESHOLD_MIN) {
          addAlert({
            type: 'idle',
            title: 'Sem apontamento ativo',
            message: `Você está há ${idleMin} minutos sem registrar atividade. Lembre-se de iniciar um apontamento.`,
          });
        }
      } else {
        lastActivityCheckRef.current = Date.now();
        // 2. Long continuous activity alert
        if (apontamentoAtivo.status === 'em_andamento' && elapsedSeconds >= LONG_ACTIVITY_THRESHOLD_MIN * 60) {
          const hrs = Math.floor(elapsedSeconds / 3600);
          addAlert({
            type: 'long_activity',
            title: 'Atividade contínua longa',
            message: `Você está em atividade contínua há ${hrs}h sem pausa. Considere registrar uma pausa.`,
          });
        }
      }

      // 3. End of shift warning
      const minsToEnd = minutesToShiftEnd();
      if (minsToEnd !== null && minsToEnd <= END_OF_SHIFT_WARN_MIN && minsToEnd > 0) {
        addAlert({
          type: 'end_of_shift',
          title: 'Fim do turno em breve',
          message: `Faltam ${minsToEnd} minuto${minsToEnd > 1 ? 's' : ''} para o fim do turno. Finalize os apontamentos em aberto.`,
          autoClose: 5 * 60 * 1000,
        });
      }

      // 4. Coffee time suggestion (auto-close, non-intrusive)
      const now = nowMinutes();
      for (const [ch, cm] of COFFEE_TIMES) {
        const coffeeMin = minutesFromMidnight(ch, cm);
        if (Math.abs(now - coffeeMin) <= 1) {
          addAlert({
            type: 'coffee',
            title: 'Hora do café ☕',
            message: 'Sugestão de pausa para café. Não esqueça de pausar o apontamento!',
            autoClose: 10 * 60 * 1000,
          });
        }
      }
    };

    check(); // immediate check
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [apontamentoAtivo, elapsedSeconds, addAlert]);

  // Reset idle timer when apontamento status changes
  useEffect(() => {
    if (apontamentoAtivo) {
      lastActivityCheckRef.current = Date.now();
      setAlerts(prev => prev.filter(a => a.type !== 'idle'));
      dismissedRef.current.delete('idle');
    }
  }, [apontamentoAtivo?.id, apontamentoAtivo?.status]);

  if (alerts.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'fixed', top: '108px', right: '24px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        {alerts.map(alert => (
          <AlertToast key={alert.id} alert={alert} onDismiss={dismissAlert} />
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AlertSystem;
