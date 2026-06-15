import React, { useState } from 'react';
import { Timer, Pause, Play, CheckSquare, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useHoras, formatElapsed } from '../../contexts/HorasContext';

interface PausaModalProps {
  onConfirm: (motivo?: string) => void;
  onCancel: () => void;
}

const PausaModal: React.FC<PausaModalProps> = ({ onConfirm, onCancel }) => {
  const [motivo, setMotivo] = useState('');
  const motivos = ['Almoço', 'Café', 'Reunião', 'Deslocamento', 'Outro'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px', width: '340px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
          Pausar Apontamento
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Selecione ou informe o motivo da pausa:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {motivos.map(m => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: `1.5px solid ${motivo === m ? '#005198' : '#D1D5DB'}`,
                background: motivo === m ? '#EFF6FF' : 'white',
                color: motivo === m ? '#005198' : '#374151',
                fontWeight: motivo === m ? 700 : 400,
              }}
            >{m}</button>
          ))}
        </div>
        <input
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Ou escreva aqui..."
          style={{
            width: '100%', padding: '8px 12px', border: '1.5px solid #D1D5DB',
            borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            marginBottom: '20px',
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
              background: 'white', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={() => onConfirm(motivo || undefined)}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >Pausar</button>
        </div>
      </div>
    </div>
  );
};

interface FinalizarModalProps {
  onConfirm: (obs?: string) => void;
  onCancel: () => void;
}

const FinalizarModal: React.FC<FinalizarModalProps> = ({ onConfirm, onCancel }) => {
  const [obs, setObs] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px', width: '380px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <CheckSquare size={22} color="#16a34a" />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>Finalizar Apontamento</h3>
        </div>
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Observações finais (opcional)..."
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB',
            borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', marginBottom: '20px', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
              background: 'white', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={() => onConfirm(obs || undefined)}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #005198, #01adff)',
              color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >Finalizar</button>
        </div>
      </div>
    </div>
  );
};

const FloatingTimer: React.FC = () => {
  const { apontamentoAtivo, elapsedSeconds, loading, pausar, retomar, finalizar } = useHoras();
  const [minimized, setMinimized] = useState(false);
  const [showPausaModal, setShowPausaModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);

  if (!apontamentoAtivo) return null;

  const isRunning = apontamentoAtivo.status === 'em_andamento';
  const pausas = apontamentoAtivo.pausas.length;

  const statusColor = isRunning ? '#16a34a' : '#d97706';
  const statusLabel = isRunning ? 'Em andamento' : 'Pausado';
  const cardBg = isRunning
    ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'
    : 'linear-gradient(135deg, #1c1300 0%, #3d2700 100%)';

  return (
    <>
      {showPausaModal && (
        <PausaModal
          onConfirm={async (motivo) => { setShowPausaModal(false); await pausar(motivo); }}
          onCancel={() => setShowPausaModal(false)}
        />
      )}
      {showFinalizarModal && (
        <FinalizarModal
          onConfirm={async (obs) => { setShowFinalizarModal(false); await finalizar(obs); }}
          onCancel={() => setShowFinalizarModal(false)}
        />
      )}

      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000,
        background: cardBg,
        borderRadius: '16px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px ${statusColor}40`,
        width: minimized ? '200px' : '280px',
        overflow: 'hidden',
        transition: 'width 0.25s ease, box-shadow 0.25s ease',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: minimized ? 'none' : `1px solid rgba(255,255,255,0.1)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: statusColor,
              boxShadow: isRunning ? `0 0 6px ${statusColor}` : 'none',
              animation: isRunning ? 'pulse-dot 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '11px', color: statusColor, fontWeight: 700, letterSpacing: '0.05em' }}>
              {statusLabel}
            </span>
          </div>
          <button
            onClick={() => setMinimized(m => !m)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}
            title={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Body */}
        {!minimized && (
          <div style={{ padding: '14px' }}>
            {/* Timer */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{
                fontSize: '32px', fontWeight: 800, color: 'white',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                fontFamily: 'monospace',
              }}>
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>

            {/* Info */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
              padding: '8px 10px', marginBottom: '12px',
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>OS · Serviço</div>
              <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>
                {apontamentoAtivo.nr_os}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                {apontamentoAtivo.servico_descricao}
              </div>
              {pausas > 0 && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {pausas} {pausas === 1 ? 'pausa' : 'pausas'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {isRunning ? (
                <button
                  onClick={() => setShowPausaModal(true)}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: 'rgba(245,158,11,0.2)', color: '#f59e0b',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <Pause size={13} /> Pausar
                </button>
              ) : (
                <button
                  onClick={retomar}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: 'rgba(22,163,74,0.2)', color: '#86efac',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <Play size={13} /> Retomar
                </button>
              )}
              <button
                onClick={() => setShowFinalizarModal(true)}
                disabled={loading}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: 'rgba(1,173,255,0.2)', color: '#7dd3fc',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <CheckSquare size={13} /> Finalizar
              </button>
            </div>
          </div>
        )}

        {/* Minimized: show timer inline */}
        {minimized && (
          <div style={{
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {apontamentoAtivo.nr_os}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default FloatingTimer;
