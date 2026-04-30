// Polyfill import.meta.env pour Jest
(globalThis as any).importMetaEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  // Ajoute ici d'autres variables mockées si besoin
};
