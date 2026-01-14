import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import awsAmplify from 'astro-aws-amplify'; 

export default defineConfig({
  output: 'server',
  adapter: awsAmplify(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // THIS IS THE KEY: It bundles 'dotenv' and 'react' directly 
      // into the server file so the 500 error disappears.
      noExternal: true 
    }
  }
});