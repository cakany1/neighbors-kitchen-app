import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Callback Handler
 * This page handles the redirect from Google OAuth via Lovable Cloud.
 * It waits for the auth session to be established, then redirects to /feed.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The Lovable Cloud auth library handles the token exchange automatically
    // We just need to wait a moment and then redirect to the feed
    const timer = setTimeout(() => {
      navigate('/feed', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Anmeldung wird abgeschlossen...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
