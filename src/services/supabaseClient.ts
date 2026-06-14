import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (window as any).VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://nkohoaygnnpvmjattzit.supabase.co';
const supabaseAnonKey = (window as any).VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rb2hvYXlnbm5wdm1qYXR0eml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTczODQsImV4cCI6MjA4MDczMzM4NH0.Rgdw60nC8FkNjSdC4DAQMK4PR8C-bySxxJ5lYEipuJk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  },
});
