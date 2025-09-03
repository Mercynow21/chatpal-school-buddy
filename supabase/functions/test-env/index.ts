import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const allEnvVars = Deno.env.toObject();
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    return new Response(JSON.stringify({
      message: "Environment test",
      hasStripeKey: !!stripeKey,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 8) || "none",
      totalEnvVars: Object.keys(allEnvVars).length,
      envKeysWithStripe: Object.keys(allEnvVars).filter(k => k.includes('STRIPE'))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});