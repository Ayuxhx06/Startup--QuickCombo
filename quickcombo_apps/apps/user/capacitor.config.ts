import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickcombo.app',
  appName: 'QuickCombo',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://quickcombo.vercel.app'
  }
};

export default config;
