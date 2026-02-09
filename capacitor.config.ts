import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.625e9f2209024c99a696890f601a3230',
  appName: 'share-kitchen-basel',
  webDir: 'dist',
  server: {
    // Hot-reload from Lovable preview during development
    url: 'https://625e9f22-0902-4c99-a696-890f601a3230.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
