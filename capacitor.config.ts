import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for Neighbors Kitchen Basel
 * 
 * VERSION STRATEGY:
 * - Update appVersion when releasing to app stores
 * - iOS: CFBundleShortVersionString (1.0.0 format)
 * - Android: versionCode (increments with each build)
 * 
 * PRODUCTION BUILD: Comment out the entire `server` block before building
 * for App Store / Google Play to use bundled assets instead of dev server.
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.625e9f2209024c99a696890f601a3230',
  appName: 'Neighbors Kitchen',
  appVersion: '1.1.0',
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
    scheme: 'neighbors-kitchen',
    // Universal Links - add your domain to Associated Domains in Xcode
    // Format: applinks:share-kitchen-basel.lovable.app
  },
  
  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
    // App Links are configured via intent-filters in AndroidManifest.xml
    // after running: npx cap add android
  }
};

export default config;
