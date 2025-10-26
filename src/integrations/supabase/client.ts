// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Netlify usa estos nombres específicos de variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
