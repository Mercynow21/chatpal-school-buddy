import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-CHECKOUT] Starting checkout function - v3");
    
    // Debug environment variables
    const allEnvVars = Deno.env.toObject();
    const envKeys = Object.keys(allEnvVars);
    console.log("[CREATE-CHECKOUT] Total env vars:", envKeys.length);
    console.log("[CREATE-CHECKOUT] Env keys containing 'STRIPE':", envKeys.filter(k => k.includes('STRIPE')));
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[CREATE-CHECKOUT] STRIPE_SECRET_KEY exists:", !!stripeKey);
    console.log("[CREATE-CHECKOUT] STRIPE_SECRET_KEY length:", stripeKey?.length || 0);
    console.log("[CREATE-CHECKOUT] STRIPE_SECRET_KEY starts with sk_:", stripeKey?.startsWith('sk_') || false);
    
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      console.error("[CREATE-CHECKOUT] Invalid or missing Stripe key");
      return new Response(
        JSON.stringify({ 
          error: "Stripe configuration error. Please check your secret key setup.",
          debug: {
            hasKey: !!stripeKey,
            keyLength: stripeKey?.length || 0,
            validFormat: stripeKey?.startsWith('sk_') || false
          }
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("[CREATE-CHECKOUT] Auth error:", authError);
      throw new Error("Authentication failed");
    }

    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    console.log("[CREATE-CHECKOUT] User authenticated:", user.email);

    console.log("[CREATE-CHECKOUT] Initializing Stripe with key length:", stripeKey.length);
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16" 
    });

    console.log("[CREATE-CHECKOUT] Looking up customer for:", user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
    } else {
      console.log("[CREATE-CHECKOUT] No existing customer found");
    }

    console.log("[CREATE-CHECKOUT] Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "GraceGuide Premium" },
            unit_amount: 999, // $9.99 in cents
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/`,
      cancel_url: `${req.headers.get("origin")}/`,
    });

    console.log("[CREATE-CHECKOUT] Session created successfully:", session.id);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      details: error.toString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});