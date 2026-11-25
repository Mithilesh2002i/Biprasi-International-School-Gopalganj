import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE=./ is only used for static preview hosting. Normal use: '/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: { port: 5173, open: true },
});