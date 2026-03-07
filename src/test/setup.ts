import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Seed data is loaded at runtime via fetch; mock so tests don't hit the network
vi.mock('../utils/seedData', () => ({ fetchSeedRecipes: vi.fn(() => Promise.resolve([])) }));

// Ensure Supabase env vars exist for tests (e.g. integration tests using MSW)
if (typeof process !== 'undefined') {
  process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
}
