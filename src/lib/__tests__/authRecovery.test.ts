import { describe, it, expect } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { isPasswordRecoverySession } from '../authRecovery';

function jwtWithPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `e30.${b64}.x`;
}

function sessionWithAccessToken(access_token: string): Session {
  return { access_token } as Session;
}

describe('isPasswordRecoverySession', () => {
  it('returns false for null', () => {
    expect(isPasswordRecoverySession(null)).toBe(false);
  });

  it('returns true when amr is string array containing recovery', () => {
    const token = jwtWithPayload({ amr: ['recovery'] });
    expect(isPasswordRecoverySession(sessionWithAccessToken(token))).toBe(true);
  });

  it('returns true when amr contains object with method recovery', () => {
    const token = jwtWithPayload({
      amr: [{ method: 'recovery', timestamp: 1700000000 }],
    });
    expect(isPasswordRecoverySession(sessionWithAccessToken(token))).toBe(true);
  });

  it('returns false when amr has only password', () => {
    const token = jwtWithPayload({ amr: ['password'] });
    expect(isPasswordRecoverySession(sessionWithAccessToken(token))).toBe(false);
  });

  it('returns false when amr is missing', () => {
    const token = jwtWithPayload({ sub: 'user-1' });
    expect(isPasswordRecoverySession(sessionWithAccessToken(token))).toBe(false);
  });

  it('returns false for malformed token', () => {
    expect(isPasswordRecoverySession(sessionWithAccessToken('not-a-jwt'))).toBe(false);
  });

  it('returns false for invalid payload json', () => {
    const badPayload = btoa('not-json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(isPasswordRecoverySession(sessionWithAccessToken(`e30.${badPayload}.x`))).toBe(false);
  });
});
