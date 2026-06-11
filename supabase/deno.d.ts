/**
 * TypeScript declarations for Deno globals used in Supabase Edge Functions.
 * This file provides IDE support for the Deno runtime environment.
 */

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }

  const env: Env;
}
