import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import awsAmplify from 'astro-aws-amplify';

// Check if we are in a build environment (production)
const isProduction = process.env.NODE_ENV === 'production' || process.env.CI === 'true';

export default defineConfig({
  output: 'server',
  // Only use the Amplify adapter during a build
  adapter: isProduction ? awsAmplify() : undefined, 
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: true 
    }
  }
});