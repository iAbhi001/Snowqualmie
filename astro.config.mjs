import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import awsAmplify from 'astro-aws-amplify'; // 1. Use the Amplify adapter

export default defineConfig({
  output: 'server', 
  adapter: awsAmplify(), // 2. Swapped node() for awsAmplify()
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});