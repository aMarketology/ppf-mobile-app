import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { user_id, tokens } = pi.metadata;

    if (!user_id || !tokens) {
      console.error('Missing metadata on PaymentIntent:', pi.id);
      return new Response('Missing metadata', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Call the add_tokens RPC to credit tokens + record purchase
    const { error } = await supabase.rpc('add_tokens', {
      p_user_id:           user_id,
      p_amount:            Number(tokens),
      p_stripe_payment_id: pi.id,
    });

    if (error) {
      console.error('add_tokens RPC failed:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`✅ Credited ${tokens} tokens to user ${user_id} (PI: ${pi.id})`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
