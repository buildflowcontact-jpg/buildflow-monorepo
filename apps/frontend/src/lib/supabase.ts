import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const globalScope = globalThis as typeof globalThis & {
	__buildflowSupabase?: ReturnType<typeof createClient<Database>>;
};

export const supabase =
	globalScope.__buildflowSupabase ??
	(globalScope.__buildflowSupabase = createClient<Database>(supabaseUrl, supabaseKey));
