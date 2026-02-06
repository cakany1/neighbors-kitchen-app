/**
 * Stripe Webhook Edge Function
 * Version: 2.0.0 - Live Ready
 * 
 * SECURITY FEATURES:
 * - Cryptographic signature verification (HMAC-SHA256)
 * - Environment-aware secrets (TEST vs LIVE)
 * - Idempotency: duplicate events are ignored
 * - Live/Test mode strict separation
 * - No secrets in logs
 * 
 * Note: Webhooks come from Stripe servers, not browsers - no CORS needed
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

// Safe logger - never log secrets
const logStep = (step: string, details?: Record<string, unknown>) => {
  // Mask sensitive fields
  const safeDetails = details ? { ...details } : undefined;
  if (safeDetails) {
    const sensitiveKeys = ['secret', 'key', 'token', 'password', 'iban'];
    for (const key of Object.keys(safeDetails)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        safeDetails[key] = '***MASKED***';
      }
    }
  }
  const safeStr = safeDetails ? JSON.stringify(safeDetails) : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${safeStr ? ` - ${safeStr}` : ''}`);
};

/**
 * Determines Stripe mode from the event
 */
function determineStripeMode(event: Stripe.Event): 'test' | 'live' {
  return event.livemode ? 'live' : 'test';
}

/**
 * Get the correct webhook secret based on mode
 * LIVE mode requires STRIPE_WEBHOOK_SECRET_LIVE
 * TEST mode uses STRIPE_WEBHOOK_SECRET_TEST or fallback
 */
function getWebhookSecret(mode: 'test' | 'live' | null): string | null {
  if (mode === 'live') {
    const liveSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');
    if (liveSecret) return liveSecret;
    // CRITICAL: Do NOT fall back for LIVE mode - require explicit secret
    logStep('ERROR: STRIPE_WEBHOOK_SECRET_LIVE not configured for LIVE mode');
    return null;
  }
  
  if (mode === 'test') {
    const testSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
    if (testSecret) return testSecret;
  }
  
  // Fall back to generic secret for backwards compatibility (TEST only)
  return Deno.env.get('STRIPE_WEBHOOK_SECRET') || null;
}

serve(async (req) => {
  // Only POST method allowed for webhooks
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    logStep('Webhook received');

    // Get required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      logStep('ERROR: Missing STRIPE_SECRET_KEY');
      return new Response('Server configuration error', { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep('ERROR: Missing Supabase configuration');
      return new Response('Server configuration error', { status: 500 });
    }

    // CRITICAL: Get the Stripe signature header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logStep('ERROR: Missing stripe-signature header - invalid_signature');
      return new Response('Missing signature', { status: 400 });
    }

    // Get the raw request body for signature verification
    const body = await req.text();
    logStep('Received body', { length: body.length });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Create Supabase admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Preliminary parse to determine mode (before signature verification)
    let preliminaryEvent: Stripe.Event | null = null;
    let stripeMode: 'test' | 'live' = 'test';
    
    try {
      preliminaryEvent = JSON.parse(body) as Stripe.Event;
      stripeMode = preliminaryEvent.livemode ? 'live' : 'test';
      logStep('Detected Stripe mode', { mode: stripeMode, livemode: preliminaryEvent.livemode });
    } catch {
      logStep('WARN: Could not parse preliminary event, defaulting to test mode');
    }

    // Get the appropriate webhook secret for this mode
    const webhookSecret = getWebhookSecret(stripeMode);
    
    if (!webhookSecret) {
      logStep('ERROR: No webhook secret configured', { mode: stripeMode });
      
      // Record the failed event
      await supabase.from('stripe_webhook_events').insert({
        event_id: preliminaryEvent?.id || `unknown_${Date.now()}`,
        event_type: preliminaryEvent?.type || 'unknown',
        stripe_mode: stripeMode,
        success: false,
        error_message: `No webhook secret configured for ${stripeMode} mode`,
        payload_summary: { attempted_mode: stripeMode, error: 'missing_secret' }
      }).onConflict('event_id').ignore();
      
      return new Response(`Server configuration error: No secret for ${stripeMode} mode`, { status: 500 });
    }

    // CRITICAL: Verify webhook signature using constructEventAsync
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      
      stripeMode = determineStripeMode(event);
      logStep('Signature verification PASSED', { 
        eventType: event.type, 
        eventId: event.id,
        mode: stripeMode,
        livemode: event.livemode
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep('ERROR: Signature verification FAILED - invalid_signature', { attemptedMode: stripeMode });
      
      // Record the failed verification attempt (idempotent)
      await supabase.from('stripe_webhook_events').insert({
        event_id: preliminaryEvent?.id || `invalid_${Date.now()}`,
        event_type: preliminaryEvent?.type || 'unknown',
        stripe_mode: stripeMode,
        success: false,
        error_message: `Signature verification failed: invalid_signature`,
        payload_summary: { error: 'invalid_signature' }
      }).onConflict('event_id').ignore();
      
      return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    // ===== IDEMPOTENCY CHECK =====
    // Check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('id, success')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      logStep('DUPLICATE: Event already processed, ignoring', { 
        eventId: event.id, 
        previousSuccess: existingEvent.success 
      });
      // Return 200 OK for duplicates - Stripe expects success
      return new Response(JSON.stringify({ 
        received: true, 
        type: event.type,
        mode: stripeMode,
        duplicate: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the successful webhook receipt
    const payloadSummary: Record<string, unknown> = {
      event_type: event.type,
      livemode: event.livemode,
    };

    // Handle different event types
    let processingError: string | null = null;
    let bookingId: string | null = null;
    
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          payloadSummary.session_id = session.id;
          payloadSummary.payment_status = session.payment_status;
          payloadSummary.customer_id = session.customer;
          
          logStep('Processing checkout.session.completed', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            mode: stripeMode,
          });

          // Only process if payment was successful
          if (session.payment_status !== 'paid') {
            logStep('Payment not completed, skipping', { status: session.payment_status });
            payloadSummary.skipped = true;
            payloadSummary.skip_reason = 'Payment not completed';
            break;
          }

          // Extract metadata
          const mealId = session.metadata?.meal_id;
          const userId = session.metadata?.user_id;
          const chefContribution = session.metadata?.chef_contribution;

          if (!mealId || !userId) {
            logStep('WARNING: Missing metadata in session', { mealId: !!mealId, userId: !!userId });
            payloadSummary.warning = 'Missing metadata';
            break;
          }

          // Find the booking and update payment status
          const { data: booking, error: findError } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('meal_id', mealId)
            .eq('guest_id', userId)
            .in('status', ['pending', 'confirmed'])
            .single();

          if (findError || !booking) {
            logStep('WARNING: Booking not found', { mealId, userId, error: findError?.message });
            payloadSummary.warning = 'booking_not_found';
            payloadSummary.meal_id = mealId;
            payloadSummary.user_id = userId;
            break;
          }

          bookingId = booking.id;

          // CRITICAL: In LIVE mode, mark as pending payout
          // In TEST mode, mark as test_mode (never goes to real payout)
          const payoutStatus = stripeMode === 'live' ? 'pending' : 'test_mode';

          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              payment_amount: chefContribution ? parseInt(chefContribution) : session.amount_total,
              payout_status: payoutStatus,
              status: 'confirmed', // Ensure confirmed after payment
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            logStep('ERROR: Failed to update booking', { bookingId: booking.id, error: updateError.message });
            processingError = `Failed to update booking: ${updateError.message}`;
            payloadSummary.error = processingError;
          } else {
            logStep('SUCCESS: Booking payment recorded', { 
              bookingId: booking.id, 
              amount: chefContribution,
              mode: stripeMode,
              payoutStatus
            });
            payloadSummary.booking_id = booking.id;
            payloadSummary.amount = chefContribution;
            payloadSummary.payout_status = payoutStatus;
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logStep('Payment intent succeeded', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            mode: stripeMode,
          });
          payloadSummary.payment_intent_id = paymentIntent.id;
          payloadSummary.amount = paymentIntent.amount;
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logStep('Payment intent failed', {
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
            mode: stripeMode,
          });
          payloadSummary.payment_intent_id = paymentIntent.id;
          payloadSummary.failure_reason = paymentIntent.last_payment_error?.message;
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          logStep('Charge refunded', {
            chargeId: charge.id,
            amount: charge.amount_refunded,
            mode: stripeMode,
          });
          payloadSummary.charge_id = charge.id;
          payloadSummary.amount_refunded = charge.amount_refunded;
          break;
        }

        default:
          logStep('Unhandled event type', { type: event.type, mode: stripeMode });
          payloadSummary.unhandled = true;
      }
    } catch (processingErr) {
      processingError = processingErr instanceof Error ? processingErr.message : 'Unknown processing error';
      logStep('ERROR: Event processing failed', { error: processingError });
      payloadSummary.processing_error = processingError;
    }

    // Record the webhook event (with idempotency via unique constraint)
    const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      stripe_mode: stripeMode,
      success: !processingError,
      error_message: processingError,
      payload_summary: {
        ...payloadSummary,
        ...(bookingId && { booking_id: bookingId })
      }
    });

    if (insertError) {
      // If insert fails due to duplicate, that's fine (idempotency)
      if (insertError.code === '23505') {
        logStep('IDEMPOTENCY: Duplicate event insert ignored', { eventId: event.id });
      } else {
        logStep('WARN: Failed to record webhook event', { error: insertError.message });
      }
    }

    // Update the current Stripe mode in admin_settings
    await supabase
      .from('admin_settings')
      .upsert({
        setting_key: 'stripe_mode',
        setting_value: JSON.stringify(stripeMode),
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ 
      received: true, 
      type: event.type,
      mode: stripeMode,
      success: !processingError
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR: Unexpected error', { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
