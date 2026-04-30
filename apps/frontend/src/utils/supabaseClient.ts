import { createClient } from '@supabase/supabase-js';



// Support Vite (import.meta.env), Jest (process.env), et fallback globalThis
let supabaseUrl: string | undefined;
let supabaseKey: string | undefined;
if (typeof import.meta !== 'undefined' && import.meta.env) {
	supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} else if (typeof process !== 'undefined' && process.env) {
	supabaseUrl = process.env.VITE_SUPABASE_URL;
	supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
} else if (typeof globalThis !== 'undefined' && (globalThis as any).importMetaEnv) {
	supabaseUrl = (globalThis as any).importMetaEnv.VITE_SUPABASE_URL;
	supabaseKey = (globalThis as any).importMetaEnv.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Supabase env variables manquantes');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
