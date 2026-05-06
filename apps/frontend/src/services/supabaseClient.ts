// services/supabaseClient.ts
// Point d'entrée canonique du client Supabase pour tous les modules.
// Le client réel est dans lib/supabase.ts (singleton avec globalThis).
export { supabase } from '../lib/supabase';
