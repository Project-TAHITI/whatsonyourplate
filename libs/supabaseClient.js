import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const globalKey = '__supabase__';
const _supabase = globalThis[globalKey] || createClient(supabaseUrl, supabaseAnonKey);
if (!globalThis[globalKey]) globalThis[globalKey] = _supabase;

export const supabase = _supabase;
