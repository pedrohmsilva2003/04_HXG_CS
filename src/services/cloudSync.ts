/**
 * Serviço simplificado de acesso direto ao Supabase
 * 
 * IMPORTANTE: Este serviço NÃO faz sincronização automática.
 * - Localhost: Usado apenas para desenvolvimento/testes
 * - Produção: Acessa o Supabase diretamente
 * - Sem localStorage, sem sync, sem espelhamento
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

/**
 * Obtém uma instância do cliente Supabase (singleton)
 */
export const getSupabase = (): SupabaseClient | null => {
  if (supabase) return supabase;
  
  const url = import.meta.env.VITE_SUPABASE_URL || (window as any).VITE_SUPABASE_URL || (globalThis as any).VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).VITE_SUPABASE_ANON_KEY || (globalThis as any).VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('[Supabase] Configuração ausente: URL ou KEY não encontrada');
    return null;
  }
  
  supabase = createClient(url, key);
  console.log('[Supabase] Cliente inicializado');
  return supabase;
};

/**
 * Verifica se o Supabase está configurado
 */
export const isSupabaseEnabled = (): boolean => {
  return getSupabase() !== null;
};

// Mantém compatibilidade com código legado (será removido no futuro)
export const cloudSync = {
  isEnabled: isSupabaseEnabled,
  pullUsers: async () => null, // Deprecated
  pushUsers: async () => {}, // Deprecated
  pullHistory: async () => null, // Deprecated
  pushHistory: async () => {}, // Deprecated
};
