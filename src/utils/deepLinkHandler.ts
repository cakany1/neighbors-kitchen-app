/**
 * Deep Link Handler for Capacitor Mobile Apps
 * Handles authentication flows (email verification, password reset, OAuth)
 */

import { App, URLOpenListenerEvent } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

// Production domain for auth redirects
const PRODUCTION_DOMAIN = 'https://share-kitchen-basel.lovable.app';
const CUSTOM_DOMAIN = 'https://www.neighbors-kitchen.ch';

/**
 * Get the appropriate redirect URL based on environment
 */
export const getAuthRedirectUrl = (): string => {
  // In native app, use the production domain for redirects
  // The deep link handler will intercept these URLs
  if (typeof window !== 'undefined' && window.location) {
    const isNativeApp = !window.location.hostname.includes('.');
    if (isNativeApp) {
      return PRODUCTION_DOMAIN;
    }
    return window.location.origin;
  }
  return PRODUCTION_DOMAIN;
};

/**
 * Parse auth tokens from URL hash or query params
 */
const parseAuthParams = (url: string): { accessToken?: string; refreshToken?: string; type?: string; error?: string } => {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash.substring(1);
    const query = urlObj.search.substring(1);
    
    const params = new URLSearchParams(hash || query);
    
    return {
      accessToken: params.get('access_token') || undefined,
      refreshToken: params.get('refresh_token') || undefined,
      type: params.get('type') || undefined,
      error: params.get('error') || params.get('error_description') || undefined,
    };
  } catch {
    return {};
  }
};

/**
 * Handle deep link URL and route to appropriate screen
 */
export const handleDeepLink = async (url: string): Promise<{ route: string; handled: boolean }> => {
  console.log('[DeepLink] Handling URL:', url);
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const authParams = parseAuthParams(url);
    
    // Handle email verification
    if (path.includes('/verify-email') || authParams.type === 'signup' || authParams.type === 'email') {
      if (authParams.accessToken && authParams.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: authParams.accessToken,
          refresh_token: authParams.refreshToken,
        });
        
        if (error) {
          console.error('[DeepLink] Error setting session:', error);
          return { route: '/verify-email?error=invalid_token', handled: true };
        }
        
        console.log('[DeepLink] Email verified successfully');
        return { route: '/feed', handled: true };
      }
      return { route: '/verify-email', handled: true };
    }
    
    // Handle password reset
    if (path.includes('/login') && (authParams.type === 'recovery' || urlObj.searchParams.has('type'))) {
      if (authParams.accessToken && authParams.refreshToken) {
        await supabase.auth.setSession({
          access_token: authParams.accessToken,
          refresh_token: authParams.refreshToken,
        });
        return { route: '/login?mode=reset', handled: true };
      }
      return { route: '/login', handled: true };
    }
    
    // Handle OAuth callback
    if (path.includes('/auth/callback') || path.includes('/oauth')) {
      if (authParams.accessToken && authParams.refreshToken) {
        await supabase.auth.setSession({
          access_token: authParams.accessToken,
          refresh_token: authParams.refreshToken,
        });
        return { route: '/feed', handled: true };
      }
      if (authParams.error) {
        console.error('[DeepLink] OAuth error:', authParams.error);
        return { route: `/login?error=${encodeURIComponent(authParams.error)}`, handled: true };
      }
    }
    
    // Handle meal detail links
    if (path.includes('/meal/')) {
      return { route: path, handled: true };
    }
    
    // Handle profile links
    if (path.includes('/chef/')) {
      return { route: path, handled: true };
    }
    
    return { route: '/', handled: false };
  } catch (error) {
    console.error('[DeepLink] Error handling deep link:', error);
    return { route: '/', handled: false };
  }
};

/**
 * Initialize deep link listener for Capacitor
 * Call this in App.tsx or main.tsx
 */
export const initDeepLinkListener = (navigate: (path: string) => void): (() => void) => {
  // Handle app opened via deep link
  const handleAppUrlOpen = async (event: URLOpenListenerEvent) => {
    console.log('[DeepLink] App opened with URL:', event.url);
    const result = await handleDeepLink(event.url);
    if (result.handled) {
      navigate(result.route);
    }
  };
  
  // Add listener
  App.addListener('appUrlOpen', handleAppUrlOpen);
  
  // Check if app was launched with a URL
  App.getLaunchUrl().then(async (launchUrl) => {
    if (launchUrl?.url) {
      console.log('[DeepLink] App launched with URL:', launchUrl.url);
      const result = await handleDeepLink(launchUrl.url);
      if (result.handled) {
        navigate(result.route);
      }
    }
  });
  
  // Return cleanup function
  return () => {
    App.removeAllListeners();
  };
};

/**
 * Build auth URL with proper redirect for mobile
 */
export const buildAuthRedirectUrl = (path: string = ''): string => {
  const baseUrl = getAuthRedirectUrl();
  return `${baseUrl}${path}`;
};
