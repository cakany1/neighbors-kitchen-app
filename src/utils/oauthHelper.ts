import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

/**
 * Detect if the current hostname is a custom domain (not Lovable infrastructure).
 * On custom domains, the /~oauth/initiate endpoint does NOT exist,
 * so we must use the direct Supabase OAuth flow instead.
 */
export function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    !hostname.includes('lovable.app') &&
    !hostname.includes('lovableproject.com') &&
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1'
  );
}

/**
 * Allowed OAuth provider hostnames for URL validation.
 */
const ALLOWED_OAUTH_HOSTS = [
  'accounts.google.com',
  'appleid.apple.com',
];

/**
 * Initiate Google OAuth sign-in.
 * - On Lovable preview domains: uses the Lovable auth-bridge (/~oauth/initiate)
 * - On custom domains: uses direct Supabase OAuth with skipBrowserRedirect
 */
export async function signInWithGoogle(): Promise<{ error?: Error }> {
  if (isCustomDomain()) {
    // Custom domain: bypass Lovable auth-bridge, use Supabase directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error };
    }

    if (data?.url) {
      // Security: validate the OAuth redirect URL before navigating
      try {
        const oauthUrl = new URL(data.url);
        if (!ALLOWED_OAUTH_HOSTS.some((host) => oauthUrl.hostname === host)) {
          return { error: new Error('Invalid OAuth redirect URL') };
        }
      } catch {
        return { error: new Error('Malformed OAuth URL') };
      }

      window.location.href = data.url;
    }

    return {};
  } else {
    // Lovable preview domain: use the auth-bridge
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/~oauth/callback`,
    });

    return { error: error || undefined };
  }
}
