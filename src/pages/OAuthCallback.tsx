import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * OAuth Callback Handler
 * This page handles the redirect from Google OAuth.
 * 
 * Handles multiple OAuth flows:
 * 1. Lovable Preview domains: Tokens come via auth-bridge
 * 2. Custom domains (BYOK): Tokens in URL hash OR code exchange
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const fullUrl = window.location.href;
        console.log('OAuth Callback - Full URL:', fullUrl);
        console.log('Search params:', location.search);
        console.log('Hash:', location.hash);

        // Check for error in URL params (OAuth errors)
        const urlParams = new URLSearchParams(location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error from provider:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setStatus('error');
          return;
        }

        // Method 1: Check for tokens in hash fragment (common for implicit flow)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log('Found tokens in hash, setting session...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message);
            setStatus('error');
            return;
          }

          if (data.session) {
            console.log('Session established successfully from hash tokens');
            setStatus('success');
            // Clear the URL and redirect
            window.history.replaceState(null, '', '/');
            setTimeout(() => navigate('/feed', { replace: true }), 300);
            return;
          }
        }

        // Method 2: Check for authorization code (PKCE flow)
        const code = urlParams.get('code');
        if (code) {
          console.log('Found authorization code, exchanging for session...');
          // Supabase client automatically handles code exchange when it detects code in URL
          // We just need to wait for the session
          
          // Give Supabase time to process the code
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Code exchange error:', sessionError);
            setError(sessionError.message);
            setStatus('error');
            return;
          }
          
          if (session) {
            console.log('Session established from code exchange');
            setStatus('success');
            setTimeout(() => navigate('/feed', { replace: true }), 300);
            return;
          }
        }

        // Method 3: Check if we already have a session (maybe callback already processed)
        console.log('No tokens or code found, checking for existing session...');
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('Get session error:', getSessionError);
          setError(getSessionError.message);
          setStatus('error');
          return;
        }

        if (session) {
          console.log('Existing session found');
          setStatus('success');
          navigate('/feed', { replace: true });
          return;
        }

        // Method 4: Wait for auth state change (Supabase may still be processing)
        console.log('No session yet, listening for auth state change...');
        
        let resolved = false;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, !!session);
          if (session && !resolved) {
            resolved = true;
            subscription.unsubscribe();
            setStatus('success');
            navigate('/feed', { replace: true });
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (!resolved) {
            subscription.unsubscribe();
            console.log('Auth callback timeout - no session established');
            setError('Authentifizierung fehlgeschlagen. Die Sitzung konnte nicht erstellt werden.');
            setStatus('error');
          }
        }, 5000);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Anmeldung fehlgeschlagen</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/login')} className="w-full">
              Zurück zum Login
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          {status === 'success' ? 'Anmeldung erfolgreich! Weiterleitung...' : 'Anmeldung wird verarbeitet...'}
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
