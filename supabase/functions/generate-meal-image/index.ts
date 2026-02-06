/**
 * Generate Meal Image Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Uses Lovable AI for image generation
 * - Uploads to Supabase storage
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError,
  getAdminClient,
  getAnonClient
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
    // Authentication check
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }
    const userId = auth.user!.id;

    const { prompt, mealId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get anon client for user-scoped operations
    const anonClient = getAnonClient(req.headers.get('Authorization')!);

    // Verify that the user owns the meal they're trying to update
    if (mealId) {
      const { data: mealData, error: mealError } = await anonClient
        .from('meals')
        .select('chef_id')
        .eq('id', mealId)
        .single();

      if (mealError || !mealData || mealData.chef_id !== userId) {
        return jsonError('You can only generate images for your own meals', 403, requestId, undefined, origin);
      }
    }

    safeLog(requestId, 'info', 'Generating image', { userId, mealId });

    // Generate image using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      safeLog(requestId, 'error', 'AI gateway error', { status: response.status, error: errorText });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    safeLog(requestId, 'info', 'Image generated successfully');

    // Convert base64 to blob
    const base64Data = imageUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Supabase storage using admin client
    const adminClient = getAdminClient();
    const fileName = `meal-${mealId}-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('gallery')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      safeLog(requestId, 'error', 'Upload error', { error: uploadError.message });
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('gallery')
      .getPublicUrl(fileName);

    safeLog(requestId, 'info', 'Image uploaded', { publicUrl });

    // Update meal with new image URL
    if (mealId) {
      const { error: updateError } = await adminClient
        .from('meals')
        .update({ image_url: publicUrl })
        .eq('id', mealId);

      if (updateError) {
        safeLog(requestId, 'error', 'Update error', { error: updateError.message });
        throw updateError;
      }

      safeLog(requestId, 'info', 'Meal updated with new image URL');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        message: "Image generated and uploaded successfully",
        requestId
      }),
      { 
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    safeLog(requestId, 'error', 'Error in generate-meal-image', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
