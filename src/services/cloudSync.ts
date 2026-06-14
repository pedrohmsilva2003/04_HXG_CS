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
  
  const url = import.meta.env.VITE_SUPABASE_URL || (window as any).VITE_SUPABASE_URL || (globalThis as any).VITE_SUPABASE_URL || 'https://nkohoaygnnpvmjattzit.supabase.co';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).VITE_SUPABASE_ANON_KEY || (globalThis as any).VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rb2hvYXlnbm5wdm1qYXR0eml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTczODQsImV4cCI6MjA4MDczMzM4NH0.Rgdw60nC8FkNjSdC4DAQMK4PR8C-bySxxJ5lYEipuJk';

  if (!url || !key) {
    console.warn('[Supabase] Configuração ausente: URL ou KEY não encontrada');
    return null;
  }

  try { localStorage.removeItem(`sb-${new URL(url).hostname.split('.')[0]}-auth-token`); } catch { /* noop */ }

  supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    },
  });
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
