/**
 * Create Payment Intent Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Stripe Checkout integration
 */

import Stripe from "https://esm.sh/stripe@18.5.0";
import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError,
  withTimeout
} from '../_shared/utils.ts'

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  const origin = req.headers.get('Origin');
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // PRODUCTION SECURITY: Validate origin
  const originError = checkOrigin(req, requestId);
  if (originError) return originError;

  try {
    // SECURITY: Require authentication
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }
    const user = auth.user!;

    const { amount, mealId, mealTitle, chefName } = await req.json();

    // Validate minimum amount (CHF 7.00 = 700 cents)
    if (!amount || amount < 700) {
      return jsonError("Minimum amount is CHF 7.00", 400, requestId, undefined, origin);
    }

    // Initialize Stripe with environment safety guard
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      safeLog(requestId, 'error', 'STRIPE_SECRET_KEY not configured');
      return jsonError("Payment system not configured", 500, requestId, undefined, origin);
    }

    // Detect Stripe mode from key prefix
    const stripeMode = stripeKey.startsWith("sk_live_") ? "live" : "test";
    const requestOrigin = req.headers.get("origin") || "";
    const isProductionOrigin = requestOrigin.includes("neighbors-kitchen.ch") || 
                                requestOrigin.includes("share-kitchen-basel.lovable.app");

    // SECURITY: Warn if test key is used on production origin
    if (stripeMode === "test" && isProductionOrigin) {
      safeLog(requestId, 'warn', 'TEST Stripe key used on PRODUCTION origin', {
        origin: requestOrigin,
        mode: stripeMode
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate fees
    const serviceFee = 200; // CHF 2.00 = 200 cents
    const totalAmount = amount + serviceFee;

    safeLog(requestId, 'info', 'Creating payment session', { 
      userId: user.id, 
      mealId, 
      amount,
      stripeMode
    });

    // Create Checkout Session with dynamic pricing
    const session = await withTimeout(
      stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: user.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "chf",
              product_data: {
                name: mealTitle || "Nachbarschafts-Gericht",
                description: `Beitrag an ${chefName || "deinen Nachbarn"}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "chf",
              product_data: {
                name: "Servicegebühr",
                description: "Plattform-Betrieb & Sicherheit",
              },
              unit_amount: serviceFee,
            },
            quantity: 1,
          },
        ],
        metadata: {
          meal_id: mealId || "",
          user_id: user.id,
          user_email: user.email || "",
          chef_contribution: amount.toString(),
          service_fee: serviceFee.toString(),
        },
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment/${mealId}`,
      }),
      25_000,
      requestId
    );

    safeLog(requestId, 'info', 'Payment session created', { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, requestId, stripeMode }),
      { headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    safeLog(requestId, 'error', 'Payment error', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
