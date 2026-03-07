import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    isolate: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/**/__tests__/**',
        'src/main.tsx',
      ],
    },
  },
});
