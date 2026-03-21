import type { Session } from '@supabase/supabase-js';

/** Supabase recovery sessions include `amr` with method `recovery` (PKCE path emits SIGNED_IN, not PASSWORD_RECOVERY). */
function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function amrIncludesRecovery(amr: unknown): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    if (entry === 'recovery') return true;
    if (typeof entry === 'object' && entry !== null && 'method' in entry) {
      return (entry as { method?: string }).method === 'recovery';
    }
    return false;
  });
}

export function isPasswordRecoverySession(session: Session | null): boolean {
  if (!session?.access_token) return false;
  const payload = decodeJwtPayload(session.access_token);
  if (!payload) return false;
  return amrIncludesRecovery(payload.amr);
}
