import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, ShieldCheck, Loader2, QrCode, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface TwoFactorSettingsProps {
  userId: string;
}

export const TwoFactorSettings = ({ userId }: TwoFactorSettingsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  
  // Enrollment state
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);

  // Check current MFA status
  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        
        const verifiedFactor = data.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          setIsEnabled(true);
          setFactorId(verifiedFactor.id);
        } else {
          setIsEnabled(false);
          setFactorId(null);
        }
      } catch (error) {
        console.error('Error checking MFA status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [userId]);

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Neighbors Kitchen',
      });
      
      if (error) throw error;
      
      setQrCodeSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setPendingFactorId(data.id);
      setShowEnrollment(true);
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      toast.error(error.message || t('profile.2fa_enrollment_failed'));
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6 || !pendingFactorId) return;
    
    setVerifying(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: pendingFactorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: pendingFactorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      
      if (verifyError) throw verifyError;
      
      setIsEnabled(true);
      setFactorId(pendingFactorId);
      setShowEnrollment(false);
      setQrCodeSvg(null);
      setSecret(null);
      setVerifyCode('');
      setPendingFactorId(null);
      toast.success(t('profile.2fa_enabled_success'));
    } catch (error: any) {
      console.error('MFA verification error:', error);
      toast.error(error.message || t('profile.2fa_verification_failed'));
    } finally {
      setVerifying(false);
    }
  };

  const disableMfa = async () => {
    if (!factorId) return;
    
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      
      if (error) throw error;
      
      setIsEnabled(false);
      setFactorId(null);
      toast.success(t('profile.2fa_disabled_success'));
    } catch (error: any) {
      console.error('MFA unenroll error:', error);
      toast.error(error.message || t('profile.2fa_disable_failed'));
    } finally {
      setUnenrolling(false);
    }
  };

  const cancelEnrollment = () => {
    setShowEnrollment(false);
    setQrCodeSvg(null);
    setSecret(null);
    setVerifyCode('');
    setPendingFactorId(null);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          {t('profile.2fa_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          // 2FA is enabled
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {t('profile.2fa_enabled')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.2fa_enabled_desc')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={disableMfa}
              disabled={unenrolling}
            >
              {unenrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('profile.2fa_disable')
              )}
            </Button>
          </div>
        ) : showEnrollment ? (
          // Enrollment flow
          <div className="space-y-4">
            <Alert>
              <QrCode className="w-4 h-4" />
              <AlertDescription>
                {t('profile.2fa_scan_qr')}
              </AlertDescription>
            </Alert>
            
            {qrCodeSvg && (
              <div 
                className="flex justify-center p-4 bg-white rounded-lg"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(qrCodeSvg, { 
                    USE_PROFILES: { svg: true, svgFilters: true } 
                  }) 
                }}
              />
            )}
            
            {secret && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('profile.2fa_manual_entry')}
                </p>
                <code className="text-sm font-mono break-all">{secret}</code>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                {t('profile.2fa_enter_code')}
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verifyCode}
                  onChange={setVerifyCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelEnrollment}
              >
                {t('profile.unblock_cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={verifyEnrollment}
                disabled={verifyCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('profile.2fa_verify')
                )}
              </Button>
            </div>
          </div>
        ) : (
          // 2FA not enabled - show enable button
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('profile.2fa_description')}
            </p>
            <Button
              className="w-full"
              onClick={startEnrollment}
              disabled={enrolling}
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {t('profile.2fa_enable')}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
