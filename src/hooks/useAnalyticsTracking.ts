import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

// Detect device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Detect if running as PWA
const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export function useAnalyticsTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPageRef = useRef<string>(window.location.pathname);
  const isMobile = useIsMobile();

  // Track analytics event
  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {},
    pagePath?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_data: eventData,
        page_path: pagePath || window.location.pathname,
        session_id: sessionIdRef.current
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  // Start a new session
  const startSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          device_type: getDeviceType(),
          is_pwa: isPWA(),
          last_page: window.location.pathname
        })
        .select('id')
        .single();

      if (error) throw error;
      sessionIdRef.current = data.id;

      // Track session start event
      await trackEvent('session_start', {
        device_type: getDeviceType(),
        is_pwa: isPWA()
      });

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(updateHeartbeat, 30000); // Every 30 seconds

    } catch (error) {
      console.error('Error starting session:', error);
    }
  }, [trackEvent]);

  // Update heartbeat
  const updateHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          last_heartbeat: new Date().toISOString(),
          last_page: window.location.pathname
        })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }, []);

  // End session
  const endSession = useCallback(async (exitPage?: string) => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          exit_page: exitPage || window.location.pathname
        })
        .eq('id', sessionIdRef.current);

      // Track session end event
      await trackEvent('session_end', {
        exit_page: exitPage || window.location.pathname
      });

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      sessionIdRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [trackEvent]);

  // Track page exit
  const trackPageExit = useCallback(async (exitPage: string) => {
    await trackEvent('page_exit', {
      from_page: exitPage,
      session_duration_estimate: Date.now()
    }, exitPage);
  }, [trackEvent]);

  // Track PWA installation
  const trackPWAInstall = useCallback(async () => {
    await trackEvent('pwa_install', {
      device_type: getDeviceType()
    });
  }, [trackEvent]);

  // Initialize tracking on mount
  useEffect(() => {
    let mounted = true;

    const initializeTracking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) {
        await startSession();
      }
    };

    initializeTracking();

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPageExit(window.location.pathname);
      }
    };

    // Track before unload
    const handleBeforeUnload = () => {
      const exitPage = window.location.pathname;
      // Use sendBeacon for reliable tracking on page close
      const payload = JSON.stringify({
        user_id: null, // Will be set server-side if possible
        event_type: 'page_exit',
        event_data: { from_page: exitPage, reason: 'beforeunload' },
        page_path: exitPage,
        session_id: sessionIdRef.current
      });
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`,
        new Blob([payload], { type: 'application/json' })
      );
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        startSession();
      } else if (event === 'SIGNED_OUT') {
        endSession('logout');
      }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [startSession, endSession, trackPageExit]);

  // Track page changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPageRef.current) {
      // Track that user left the previous page
      trackEvent('page_view', {
        from_page: lastPageRef.current,
        to_page: currentPath
      });
      lastPageRef.current = currentPath;
    }
  }, [window.location.pathname, trackEvent]);

  return {
    trackEvent,
    trackPWAInstall,
    trackPageExit,
    sessionId: sessionIdRef.current
  };
}
