import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickcombo.rider',
  appName: 'QuickCombo Rider',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://quickcombo-rider.vercel.app'
  }
};

export default config;
