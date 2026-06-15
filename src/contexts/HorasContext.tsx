import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ApontamentoAtivo, ServicoCS, OSAdministrativaCS } from '../types';
import {
  getServicos,
  criarApontamento,
  pausarApontamento,
  retomarApontamento,
  finalizarApontamento,
  type CriarApontamentoInput,
} from '../services/horasService';

const STORAGE_KEY = 'cs_horas_active';

// ── Helpers ───────────────────────────────────────────────────

export function calcularElapsedSeconds(apt: ApontamentoAtivo): number {
  const inicio = new Date(apt.inicio).getTime();
  let completedPauseMs = 0;
  let activePauseStart = 0;

  for (const p of apt.pausas) {
    const pStart = new Date(p.inicio_pausa).getTime();
    if (p.fim_pausa) {
      completedPauseMs += new Date(p.fim_pausa).getTime() - pStart;
    } else {
      activePauseStart = pStart;
    }
  }

  if (apt.status === 'pausado' && activePauseStart > 0) {
    return Math.max(0, Math.floor((activePauseStart - inicio - completedPauseMs) / 1000));
  }

  return Math.max(0, Math.floor((Date.now() - inicio - completedPauseMs) / 1000));
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadFromStorage(): ApontamentoAtivo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApontamentoAtivo;
  } catch {
    return null;
  }
}

function saveToStorage(apt: ApontamentoAtivo | null): void {
  if (apt) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apt));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ── Context ───────────────────────────────────────────────────

interface HorasContextValue {
  apontamentoAtivo: ApontamentoAtivo | null;
  elapsedSeconds: number;
  servicos: ServicoCS[];
  loading: boolean;
  iniciar: (input: Omit<CriarApontamentoInput, never> & { osInfo?: OSAdministrativaCS | null }) => Promise<void>;
  pausar: (motivo?: string) => Promise<void>;
  retomar: () => Promise<void>;
  finalizar: (observacao_final?: string) => Promise<void>;
  recarregarServicos: () => Promise<void>;
}

const HorasContext = createContext<HorasContextValue | null>(null);

export function useHoras(): HorasContextValue {
  const ctx = useContext(HorasContext);
  if (!ctx) throw new Error('useHoras must be used inside HorasProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  user: { id: string; name: string; email: string };
}

export const HorasProvider: React.FC<Props> = ({ children, user }) => {
  const [apontamentoAtivo, setApontamentoAtivo] = useState<ApontamentoAtivo | null>(loadFromStorage);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [servicos, setServicos] = useState<ServicoCS[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load servicos on mount
  useEffect(() => {
    getServicos()
      .then(setServicos)
      .catch(e => console.error('[HorasContext] Erro ao carregar serviços:', e));
  }, []);

  // Sync localStorage when apontamento changes
  useEffect(() => {
    saveToStorage(apontamentoAtivo);
  }, [apontamentoAtivo]);

  // Timer tick
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (apontamentoAtivo) {
      const tick = () => setElapsedSeconds(calcularElapsedSeconds(apontamentoAtivo));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [apontamentoAtivo]);

  const currentUser = { id: user.id, nome: user.name, email: user.email };

  const iniciar = useCallback(async (input: CriarApontamentoInput & { osInfo?: OSAdministrativaCS | null }) => {
    if (apontamentoAtivo) throw new Error('Já existe um apontamento em andamento.');
    setLoading(true);
    try {
      const { osInfo, ...rest } = input;
      const created = await criarApontamento(rest);
      const novo: ApontamentoAtivo = {
        id: created.id,
        nr_os: created.nr_os,
        servico_id: created.servico_id,
        servico_codigo: created.servico_codigo,
        servico_descricao: created.servico_descricao,
        familia_equipamento: created.familia_equipamento,
        tecnico_id: created.tecnico_id,
        tecnico_nome: created.tecnico_nome,
        tecnico_email: created.tecnico_email,
        inicio: created.inicio,
        pausas: [],
        status: 'em_andamento',
        observacao_inicial: created.observacao_inicial,
        osInfo: osInfo ?? null,
      };
      setApontamentoAtivo(novo);
    } finally {
      setLoading(false);
    }
  }, [apontamentoAtivo]);

  const pausar = useCallback(async (motivo?: string) => {
    if (!apontamentoAtivo || apontamentoAtivo.status !== 'em_andamento') return;
    setLoading(true);
    try {
      const pausa = await pausarApontamento(apontamentoAtivo.id, motivo, currentUser);
      setApontamentoAtivo(prev => prev ? {
        ...prev,
        status: 'pausado',
        pausas: [...prev.pausas, { id: pausa.id, inicio_pausa: pausa.inicio_pausa, motivo }],
      } : null);
    } finally {
      setLoading(false);
    }
  }, [apontamentoAtivo]);

  const retomar = useCallback(async () => {
    if (!apontamentoAtivo || apontamentoAtivo.status !== 'pausado') return;
    const pausaAberta = [...apontamentoAtivo.pausas].reverse().find(p => !p.fim_pausa);
    if (!pausaAberta?.id) return;
    setLoading(true);
    try {
      const fim = new Date().toISOString();
      await retomarApontamento(apontamentoAtivo.id, pausaAberta.id, currentUser);
      setApontamentoAtivo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'em_andamento',
          pausas: prev.pausas.map(p =>
            p.id === pausaAberta.id ? { ...p, fim_pausa: fim } : p
          ),
        };
      });
    } finally {
      setLoading(false);
    }
  }, [apontamentoAtivo]);

  const finalizar = useCallback(async (observacao_final?: string) => {
    if (!apontamentoAtivo) return;
    setLoading(true);
    try {
      await finalizarApontamento(apontamentoAtivo, observacao_final, currentUser);
      setApontamentoAtivo(null);
    } finally {
      setLoading(false);
    }
  }, [apontamentoAtivo]);

  const recarregarServicos = useCallback(async () => {
    const data = await getServicos();
    setServicos(data);
  }, []);

  return (
    <HorasContext.Provider value={{
      apontamentoAtivo,
      elapsedSeconds,
      servicos,
      loading,
      iniciar,
      pausar,
      retomar,
      finalizar,
      recarregarServicos,
    }}>
      {children}
    </HorasContext.Provider>
  );
};
