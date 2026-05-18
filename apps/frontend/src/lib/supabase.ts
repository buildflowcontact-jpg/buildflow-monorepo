import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

function getRequiredEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
	const value = import.meta.env[name];

	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required frontend environment variable: ${name}`);
	}

	return value;
}

const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL');
const supabaseKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

try {
	new URL(supabaseUrl);
} catch {
	throw new Error('Invalid frontend environment variable: VITE_SUPABASE_URL must be a valid URL');
}

const globalScope = globalThis as typeof globalThis & {
	__buildflowSupabase?: ReturnType<typeof createClient<Database>>;
};

export const supabase =
	globalScope.__buildflowSupabase ??
	(globalScope.__buildflowSupabase = createClient<Database>(supabaseUrl, supabaseKey));
