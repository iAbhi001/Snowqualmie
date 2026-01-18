import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import awsAmplify from 'astro-aws-amplify';

// Detect if we are building for production (on Amplify)
const isProduction = process.env.NODE_ENV === 'production' || process.env.CI === 'true';

export default defineConfig({
  output: 'server',
  // 🚀 Use the adapter ONLY in production
  adapter: isProduction ? awsAmplify() : undefined, 
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Keep this as true for production, but it sometimes causes issues in dev
      noExternal: isProduction ? true : [] 
    }
  }
});