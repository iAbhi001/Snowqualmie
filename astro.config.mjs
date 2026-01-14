import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // ⬇️ ADD THIS SECTION ⬇️
    ssr: {
      // This forces Vite to bundle these packages into the server build
      noExternal: ['react', 'react-dom', 'lucide-react', '@astrojs/react']
    }
  }
});