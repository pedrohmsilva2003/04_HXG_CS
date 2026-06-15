import React, { useState, useEffect, useRef } from 'react';
import { Play, Search, AlertCircle, Clock, Wrench, CheckCircle } from 'lucide-react';
import { useHoras, formatElapsed } from '../../contexts/HorasContext';
import { buscarOS, pesquisarOS } from '../../services/horasService';
import type { OSAdministrativaCS } from '../../types';

interface Props {
  user: { id: string; name: string; email: string };
}

const IniciarApontamento: React.FC<Props> = ({ user }) => {
  const { apontamentoAtivo, elapsedSeconds, servicos, loading, iniciar, pausar, retomar, finalizar } = useHoras();

  const [nrOs, setNrOs] = useState('');
  const [servicoCodigo, setServicoCodigo] = useState('');
  const [familiaEquip, setFamiliaEquip] = useState('');
  const [observacao, setObservacao] = useState('');
  const [osInfo, setOsInfo] = useState<OSAdministrativaCS | null>(null);
  const [osLoading, setOsLoading] = useState(false);
  const [osSuggestions, setOsSuggestions] = useState<OSAdministrativaCS[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [pausaMotivo, setPausaMotivo] = useState('');
  const [showPausaForm, setShowPausaForm] = useState(false);
  const [showFinalizarForm, setShowFinalizarForm] = useState(false);
  const [finalizarObs, setFinalizarObs] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (nrOs.length >= 2) {
      searchRef.current = setTimeout(async () => {
        const results = await pesquisarOS(nrOs);
        setOsSuggestions(results);
        setShowSuggestions(results.length > 0);
      }, 400);
    } else {
      setOsSuggestions([]);
      setShowSuggestions(false);
    }
  }, [nrOs]);

  const handleSelectOS = async (os: OSAdministrativaCS) => {
    setNrOs(os.nr_os);
    setOsInfo(os);
    setShowSuggestions(false);
    setOsSuggestions([]);
  };

  const handleOSBlur = async () => {
    setTimeout(() => setShowSuggestions(false), 200);
    if (!nrOs.trim() || osInfo?.nr_os === nrOs.trim()) return;
    setOsLoading(true);
    const found = await buscarOS(nrOs.trim());
    setOsInfo(found);
    setOsLoading(false);
  };

  const handleIniciar = async () => {
    setError('');
    if (!nrOs.trim()) { setError('Informe o número da OS.'); return; }
    if (!servicoCodigo) { setError('Selecione o tipo de serviço.'); return; }

    const servico = servicos.find(s => s.codigo === servicoCodigo);
    if (!servico) { setError('Serviço inválido.'); return; }

    try {
      await iniciar({
        nr_os: nrOs.trim(),
        tecnico_id: user.id,
        tecnico_nome: user.name,
        tecnico_email: user.email,
        servico_id: servico.id,
        servico_codigo: servico.codigo,
        servico_descricao: servico.descricao,
        familia_equipamento: familiaEquip || undefined,
        observacao_inicial: observacao || undefined,
        osInfo,
      });
    } catch (e: any) {
      setError(e.message ?? 'Erro ao iniciar apontamento.');
    }
  };

  const handlePausar = async () => {
    await pausar(pausaMotivo || undefined);
    setShowPausaForm(false);
    setPausaMotivo('');
  };

  const handleFinalizar = async () => {
    await finalizar(finalizarObs || undefined);
    setShowFinalizarForm(false);
    setFinalizarObs('');
  };

  // ── Active state ──────────────────────────────────────────

  if (apontamentoAtivo) {
    const isRunning = apontamentoAtivo.status === 'em_andamento';

    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Active timer card */}
        <div style={{
          background: isRunning
            ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'
            : 'linear-gradient(135deg, #1c1300 0%, #3d2700 100%)',
          borderRadius: '20px',
          padding: '32px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          {/* Status pill */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              background: isRunning ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)',
              color: isRunning ? '#86efac' : '#fcd34d',
              border: `1px solid ${isRunning ? 'rgba(22,163,74,0.4)' : 'rgba(217,119,6,0.4)'}`,
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: isRunning ? '#16a34a' : '#d97706',
                animation: isRunning ? 'pulse-dot 2s infinite' : 'none',
              }} />
              {isRunning ? 'Em andamento' : 'Pausado'}
            </span>
          </div>

          {/* Timer */}
          <div style={{
            fontSize: '56px', fontWeight: 800, color: 'white',
            fontFamily: 'monospace', letterSpacing: '-0.03em', lineHeight: 1,
            marginBottom: '16px',
          }}>
            {formatElapsed(elapsedSeconds)}
          </div>

          {/* OS + Service */}
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
            OS {apontamentoAtivo.nr_os}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
            {apontamentoAtivo.servico_descricao}
          </div>
          {apontamentoAtivo.osInfo?.razao_social && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
              {apontamentoAtivo.osInfo.razao_social}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
            Início: {new Date(apontamentoAtivo.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {apontamentoAtivo.pausas.length > 0 && ` · ${apontamentoAtivo.pausas.length} pausa${apontamentoAtivo.pausas.length > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Pause form */}
        {showPausaForm && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '10px' }}>Motivo da pausa</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {['Almoço', 'Café', 'Reunião', 'Deslocamento', 'Outro'].map(m => (
                <button key={m} onClick={() => setPausaMotivo(m)} style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  border: `1.5px solid ${pausaMotivo === m ? '#D97706' : '#D1D5DB'}`,
                  background: pausaMotivo === m ? '#FEF3C7' : 'white',
                  color: pausaMotivo === m ? '#92400E' : '#374151', fontWeight: pausaMotivo === m ? 700 : 400,
                }}>{m}</button>
              ))}
            </div>
            <input
              value={pausaMotivo}
              onChange={e => setPausaMotivo(e.target.value)}
              placeholder="Ou escreva o motivo..."
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowPausaForm(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #D1D5DB', background: 'white', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handlePausar} disabled={loading} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#D97706', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Confirmar Pausa</button>
            </div>
          </div>
        )}

        {/* Finalize form */}
        {showFinalizarForm && (
          <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', marginBottom: '10px' }}>Observações finais</div>
            <textarea
              value={finalizarObs}
              onChange={e => setFinalizarObs(e.target.value)}
              placeholder="Descreva o que foi realizado (opcional)..."
              rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowFinalizarForm(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #D1D5DB', background: 'white', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleFinalizar} disabled={loading} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #005198, #01adff)', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Finalizar</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showPausaForm && !showFinalizarForm && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {isRunning ? (
              <button
                onClick={() => setShowPausaForm(true)}
                disabled={loading}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px',
                  border: '2px solid #F59E0B', background: 'white',
                  color: '#D97706', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <Clock size={18} /> Pausar
              </button>
            ) : (
              <button
                onClick={retomar}
                disabled={loading}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px',
                  border: '2px solid #16A34A', background: 'white',
                  color: '#16A34A', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <Play size={18} /> Retomar
              </button>
            )}
            <button
              onClick={() => setShowFinalizarForm(true)}
              disabled={loading}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                border: 'none', background: 'linear-gradient(135deg, #005198, #01adff)',
                color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <CheckCircle size={18} /> Finalizar
            </button>
          </div>
        )}

        <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  // ── Start form ────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #005198, #01adff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Novo Apontamento</h2>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Registre o início de uma atividade técnica</p>
          </div>
        </div>

        {/* OS field */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Número da OS *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              value={nrOs}
              onChange={e => { setNrOs(e.target.value); setOsInfo(null); }}
              onBlur={handleOSBlur}
              onFocus={() => osSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Ex: 12345"
              style={{
                width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid #D1D5DB',
                borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocusCapture={e => (e.target.style.borderColor = '#005198')}
            />
            {osLoading && (
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #E5E7EB', borderTop: '2px solid #005198', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {!osLoading && <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && osSuggestions.length > 0 && (
            <div ref={suggRef} style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'white', border: '1.5px solid #D1D5DB', borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden',
            }}>
              {osSuggestions.map(os => (
                <div
                  key={os.id}
                  onClick={() => handleSelectOS(os)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#F8FAFF')}
                  onMouseOut={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>OS {os.nr_os}</div>
                  {os.descricao && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>{os.descricao}</div>}
                  {os.razao_social && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{os.razao_social}</div>}
                </div>
              ))}
            </div>
          )}

          {/* OS info badge */}
          {osInfo && (
            <div style={{
              marginTop: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '8px', padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF' }}>OS encontrada</span>
              </div>
              {osInfo.descricao && <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>{osInfo.descricao}</div>}
              {osInfo.razao_social && <div style={{ fontSize: '11px', color: '#6B7280' }}>{osInfo.razao_social}</div>}
              {osInfo.situacao && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Status: {osInfo.situacao}</div>}
            </div>
          )}
          {nrOs.trim().length >= 2 && !osLoading && !osInfo && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#9CA3AF' }}>
              OS não encontrada na base — você ainda pode registrar o apontamento.
            </div>
          )}
        </div>

        {/* Equipment family */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Família do Equipamento <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(para relatório BRM)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {(['NOVA series', 'High End', 'Manual'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFamiliaEquip(familiaEquip === f ? '' : f)}
                style={{
                  padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${familiaEquip === f ? '#83c410' : '#E5E7EB'}`,
                  background: familiaEquip === f ? '#F0FDF4' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: familiaEquip === f ? '#15803D' : '#374151' }}>{f}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Service type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Tipo de Serviço *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {servicos.map(s => (
              <button
                key={s.codigo}
                onClick={() => setServicoCodigo(s.codigo)}
                style={{
                  padding: '12px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${servicoCodigo === s.codigo ? '#005198' : '#E5E7EB'}`,
                  background: servicoCodigo === s.codigo ? '#EFF6FF' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Wrench size={14} color={servicoCodigo === s.codigo ? '#005198' : '#9CA3AF'} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: servicoCodigo === s.codigo ? '#005198' : '#374151' }}>
                    {s.descricao}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>~{s.tempo_estimado_hrs}h est.</div>
              </button>
            ))}
          </div>
        </div>

        {/* Observation */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Observação inicial <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
          </label>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Descreva o problema ou o que será realizado..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB',
              borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
            padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#DC2626',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <button
          onClick={handleIniciar}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: loading ? '#93C5FD' : 'linear-gradient(135deg, #005198 0%, #01adff 100%)',
            color: 'white', fontWeight: 700, fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 14px rgba(1,173,255,0.35)',
          }}
        >
          <Play size={20} /> {loading ? 'Iniciando...' : 'Iniciar Apontamento'}
        </button>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default IniciarApontamento;
