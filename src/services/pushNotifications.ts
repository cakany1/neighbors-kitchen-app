/**
 * Push Notification Service for Capacitor (iOS + Android)
 * Uses Firebase Cloud Messaging for both platforms
 */

import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Environment detection
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('preview')) {
    return 'development';
  }
  if (hostname.includes('staging')) {
    return 'staging';
  }
  return 'production';
};

// Get device ID (for multi-device support)
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Get platform
const getPlatform = (): 'ios' | 'android' | 'web' => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
};

/**
 * Check if push notifications are supported
 */
export const isPushSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Request push notification permissions
 */
export const requestPushPermissions = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.log('[Push] Not supported on this platform');
    return false;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('[Push] Permission not granted');
      return false;
    }

    console.log('[Push] Permission granted');
    return true;
  } catch (error) {
    console.error('[Push] Error requesting permissions:', error);
    return false;
  }
};

/**
 * Register device token with the server
 */
export const registerPushToken = async (token: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[Push] No authenticated user, skipping token registration');
      return false;
    }

    const platform = getPlatform();
    const deviceId = getDeviceId();
    const environment = getEnvironment();

    console.log('[Push] Registering token:', { platform, deviceId, environment, tokenPreview: token.substring(0, 20) + '...' });

    // Upsert token (update if exists, insert if new)
    const { error } = await supabase
      .from('device_push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform,
        device_id: deviceId,
        environment,
        is_active: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });

    if (error) {
      console.error('[Push] Error registering token:', error);
      return false;
    }

    console.log('[Push] Token registered successfully');
    return true;
  } catch (error) {
    console.error('[Push] Error in registerPushToken:', error);
    return false;
  }
};

/**
 * Unregister device token (on logout or token refresh)
 */
export const unregisterPushToken = async (token?: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (token) {
      // Deactivate specific token
      await supabase
        .from('device_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', token);
    } else {
      // Deactivate all tokens for this device
      const deviceId = getDeviceId();
      await supabase
        .from('device_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('device_id', deviceId);
    }

    console.log('[Push] Token(s) unregistered');
  } catch (error) {
    console.error('[Push] Error unregistering token:', error);
  }
};

/**
 * Handle incoming notification when app is in foreground
 */
export type NotificationHandler = (notification: PushNotificationSchema) => void;

/**
 * Handle notification action (user tapped on notification)
 */
export type ActionHandler = (notification: ActionPerformed) => void;

let currentToken: string | null = null;

/**
 * Initialize push notifications
 * Call this once when the app starts (after user is authenticated)
 */
export const initPushNotifications = async (
  onNotification?: NotificationHandler,
  onAction?: ActionHandler
): Promise<string | null> => {
  if (!isPushSupported()) {
    console.log('[Push] Not a native platform, skipping initialization');
    return null;
  }

  // Check and request permissions
  const hasPermission = await requestPushPermissions();
  if (!hasPermission) {
    return null;
  }

  // Register with FCM/APNs
  await PushNotifications.register();

  // Listen for token registration
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('[Push] Received token:', token.value.substring(0, 20) + '...');
    currentToken = token.value;
    await registerPushToken(token.value);
  });

  // Listen for registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] Registration error:', error);
  });

  // Listen for incoming notifications (foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notification received:', notification);
    onNotification?.(notification);
  });

  // Listen for notification actions (user tapped)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Action performed:', action);
    onAction?.(action);
  });

  return currentToken;
};

/**
 * Cleanup push notification listeners
 */
export const cleanupPushNotifications = async (): Promise<void> => {
  if (!isPushSupported()) return;
  
  await PushNotifications.removeAllListeners();
  if (currentToken) {
    await unregisterPushToken(currentToken);
    currentToken = null;
  }
};

/**
 * Get current token (if registered)
 */
export const getCurrentToken = (): string | null => currentToken;

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  
  const status = await PushNotifications.checkPermissions();
  return status.receive === 'granted';
};
