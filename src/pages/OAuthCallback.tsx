import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * OAuth Callback Handler
 * This page handles the redirect from Google OAuth.
 * It processes the auth tokens from the URL and establishes the session.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params (OAuth errors)
        const urlParams = new URLSearchParams(location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          return;
        }

        // Check for tokens in hash (Supabase OAuth returns tokens in hash)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          // Set the session manually from hash params
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
            setStatus('success');
            // Small delay to ensure session is fully established
            setTimeout(() => {
              navigate('/feed', { replace: true });
            }, 500);
            return;
          }
        }

        // If no tokens in hash, check if we already have a session
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('Get session error:', getSessionError);
          setError(getSessionError.message);
          setStatus('error');
          return;
        }

        if (session) {
          setStatus('success');
          navigate('/feed', { replace: true });
          return;
        }

        // No session and no tokens - something went wrong
        // Wait a bit and try again (tokens might still be processing)
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setStatus('success');
            navigate('/feed', { replace: true });
          } else {
            setError('Authentifizierung fehlgeschlagen. Bitte versuche es erneut.');
            setStatus('error');
          }
        }, 2000);

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
