import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const TOKEN_PACKAGES: Record<string, { tokens: number; price: number; label: string }> = {
  starter:  { tokens: 10,  price: 1000, label: 'Starter Pack (10 tokens)' },
  pro:      { tokens: 50,  price: 4500, label: 'Pro Pack (50 tokens)' },
  business: { tokens: 120, price: 9900, label: 'Business Pack (120 tokens)' },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the caller via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { packageId } = await req.json();
    const pkg = TOKEN_PACKAGES[packageId];
    if (!pkg) {
      return new Response(JSON.stringify({ error: `Unknown package: ${packageId}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id:    user.id,
        package_id: packageId,
        tokens:     String(pkg.tokens),
      },
      description: pkg.label,
    });

    return new Response(
      JSON.stringify({
        clientSecret:     paymentIntent.client_secret,
        paymentIntentId:  paymentIntent.id,
        amount:           pkg.price,
        tokens:           pkg.tokens,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('purchase-tokens error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
