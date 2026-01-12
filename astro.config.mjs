import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node'; // 1. Import node adapter

export default defineConfig({
  output: 'server', // 2. Change from default 'static' to 'server'
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});