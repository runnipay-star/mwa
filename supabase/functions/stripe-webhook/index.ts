
// FIX DEFINITIVO: Versioni bloccate (senza ^) per stabilità
import Stripe from 'npm:stripe@14.25.0'
import { createClient } from 'npm:@supabase/supabase-js@2.42.0'

declare const Deno: any;

console.log("Stripe Webhook Handler Loaded (NPM - Async Fix)");

// Fix: Cast Deno to any to avoid TS errors
Deno.serve(async (req: Request) => {
  // 1. LOG INGRESSO
  console.log(`➡️ WEBHOOK HIT: ${req.method} su ${req.url}`);

  // 2. GESTIONE CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
      return new Response('ok', { 
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
          } 
      })
  }

  // 3. CHECK METODO PERMISSIVO
  if (req.method !== 'POST') {
      return new Response(`Webhook online. Send POST requests here.`, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
      });
  }

  try {
    // 4. RECUPERA IL BODY RAW
    const signature = req.headers.get('Stripe-Signature');
    const body = await req.text(); 

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');

    if (!stripeKey || !endpointSecret) {
        console.error("❌ ERRORE: Configurazione Stripe mancante su Supabase Secrets.");
        return new Response("Server Configuration Error", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })

    let event

    try {
      // FIX CRITICO: Usa constructEventAsync per Deno/Edge Runtime
      event = await stripe.webhooks.constructEventAsync(body, signature!, endpointSecret)
    } catch (err: any) {
      console.error(`❌ Webhook Signature Error: ${err.message}`)
      return new Response(`Webhook Signature Error: ${err.message}`, { status: 400 })
    }

    console.log(`✅ Evento Stripe Verificato: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      
      // Support old single course metadata AND new multi-course metadata
      const singleCourseId = session.metadata?.course_id;
      const multiCourseIds = session.metadata?.course_ids;

      console.log(`💳 Processando acquisto... User: ${userId}`);

      if (userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

        let coursesToInsert: string[] = [];

        if (multiCourseIds) {
            coursesToInsert = multiCourseIds.split(','); // Convert CSV string to array
        } else if (singleCourseId) {
            coursesToInsert = [singleCourseId];
        }

        if (coursesToInsert.length > 0) {
            console.log(`📦 Inserimento di ${coursesToInsert.length} corsi: ${coursesToInsert.join(', ')}`);
            
            // Map to db rows
            const rows = coursesToInsert.map(cId => ({
                user_id: userId,
                course_id: cId.trim(),
                stripe_payment_id: session.id
            }));

            const { error } = await supabaseAdmin
              .from('purchases')
              .insert(rows);

            if (error) {
                console.error('❌ Errore Insert Supabase:', JSON.stringify(error))
            } else {
                console.log("🎉 Acquisti salvati con successo!")
            }
        } else {
            console.error("⚠️ Nessun ID corso trovato nei metadati.");
        }

      } else {
          console.error("⚠️ User ID mancante nei metadati");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (err: any) {
    console.error(`❌ Server Error Globale: ${err.message}`)
    return new Response(`Server Error: ${err.message}`, { status: 200 })
  }
})
