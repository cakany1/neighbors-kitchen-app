/**
 * Verify Payment Edge Function
 * 
 * Checks a Stripe Checkout Session status after redirect.
 * Returns payment status without exposing Stripe internals.
 */

import Stripe from "https://esm.sh/stripe@18.5.0";
import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError
} from '../_shared/utils.ts'

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  const origin = req.headers.get('Origin');
  
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const originError = checkOrigin(req, requestId);
  if (originError) return originError;

  try {
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return jsonError("Missing sessionId", 400, requestId, undefined, origin);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonError("Payment system not configured", 500, requestId, undefined, origin);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    safeLog(requestId, 'info', 'Payment verification', {
      sessionId: session.id,
      status: session.payment_status,
      mode: session.livemode ? 'live' : 'test',
    });

    return new Response(
      JSON.stringify({
        verified: session.payment_status === 'paid',
        paymentStatus: session.payment_status,
        mealId: session.metadata?.meal_id || null,
        stripeMode: session.livemode ? 'live' : 'test',
        requestId,
      }),
      { headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    safeLog(requestId, 'error', 'Verify payment error', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
