/**
 * Environment Detection Utility
 * 
 * Detects STAGING vs PRODUCTION based on hostname patterns.
 * Used for visual indicators and conditional behavior.
 * 
 * IMPORTANT: This does NOT control database connections.
 * Each Lovable project has its own Supabase project automatically.
 * 
 * Staging Project: Should be a remix with "-staging" in the subdomain
 * Production Project: Main project without "-staging"
 */

export type AppEnvironment = 'production' | 'staging' | 'development';

export interface EnvironmentInfo {
  environment: AppEnvironment;
  label: string;
  color: string;
  bgColor: string;
  supabaseProjectId: string | null;
  hostname: string;
  isPreview: boolean;
}

/**
 * Detect the current environment based on hostname patterns
 */
export function detectEnvironment(): EnvironmentInfo {
  const hostname = window.location.hostname;
  
  // Extract Supabase project ID from environment variable (if available)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseProjectId = supabaseUrl 
    ? supabaseUrl.replace('https://', '').split('.')[0] 
    : null;
  
  // Lovable preview domains
  const isLovablePreview = hostname.includes('.lovable.app') ||
                           hostname.includes('-preview--');
  
  // Staging detection patterns
  const isStagingDomain = 
    hostname.includes('staging') ||           // staging.domain.com or domain-staging.lovable.app
    hostname.includes('-stg') ||              // domain-stg.lovable.app
    hostname.includes('test.') ||             // test.domain.com
    hostname.includes('-test') ||             // domain-test.lovable.app
    hostname === 'localhost';                 // Local development treated as staging
  
  // Production domain patterns (custom domains without staging indicators)
  const isProductionDomain = 
    hostname === 'share-kitchen-basel.lovable.app' ||
    hostname === 'neighbors-kitchen.ch' ||
    hostname.endsWith('.neighbors-kitchen.ch');
  
  // Determine environment
  let environment: AppEnvironment;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    environment = 'development';
  } else if (isStagingDomain && !isProductionDomain) {
    environment = 'staging';
  } else {
    environment = 'production';
  }
  
  // Environment display info
  const envInfo: Record<AppEnvironment, { label: string; color: string; bgColor: string }> = {
    production: {
      label: '🔴 PRODUCTION',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    staging: {
      label: '🟡 STAGING',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    development: {
      label: '🔵 DEVELOPMENT',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  };
  
  return {
    environment,
    ...envInfo[environment],
    supabaseProjectId,
    hostname,
    isPreview: isLovablePreview,
  };
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return detectEnvironment().environment === 'production';
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  return detectEnvironment().environment === 'staging';
}

/**
 * Check if current environment is development (localhost)
 */
export function isDevelopment(): boolean {
  return detectEnvironment().environment === 'development';
}

/**
 * Get environment-specific configuration key suffix
 * Useful for selecting the right secrets/keys per environment
 */
export function getEnvKeySuffix(): 'LIVE' | 'TEST' {
  return isProduction() ? 'LIVE' : 'TEST';
}
