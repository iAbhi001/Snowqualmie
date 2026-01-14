import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import awsAmplify from 'astro-aws-amplify'; // 1. Use the correct adapter

export default defineConfig({
  output: 'server', 
  adapter: awsAmplify(), // 2. Swapped to Amplify adapter
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // 3. Keep this to ensure React is bundled correctly on the server
      noExternal: ['react', 'react-dom', 'lucide-react', '@astrojs/react']
    }
  }
});