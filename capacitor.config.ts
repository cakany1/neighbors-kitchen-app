import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for Neighbors Kitchen Basel
 * 
 * PRODUCTION BUILD: Comment out the entire `server` block before building
 * for App Store / Google Play to use bundled assets instead of dev server.
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.625e9f2209024c99a696890f601a3230',
  appName: 'Neighbors Kitchen',
  webDir: 'dist',
  
  // DEV ONLY: Remove/comment this block for production builds
  server: {
    url: 'https://625e9f22-0902-4c99-a696-890f601a3230.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#F77B1C'
    }
  },
  
  ios: {
    contentInset: 'automatic',
    scheme: 'Neighbors Kitchen'
  },
  
  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF'
  }
};

export default config;
