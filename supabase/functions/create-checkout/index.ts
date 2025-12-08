
// FIX DEFINITIVO: Versioni bloccate (senza ^) per stabilità
import Stripe from 'npm:stripe@14.25.0'
import { createClient } from 'npm:@supabase/supabase-js@2.42.0'

declare const Deno: any;

console.log("Create Checkout Function Loaded v5 (Pixel Tracking Support)");

// Fix: Cast Deno to any to avoid TS errors
Deno.serve(async (req: Request) => {
  // Headers CORS per permettere chiamate da qualsiasi frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // 1. Gestione Preflight CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parsing sicuro del body
    let body;
    try {
        body = await req.json()
    } catch (e) {
        throw new Error("Body della richiesta non valido o vuoto.")
    }

    console.log("📥 Payload ricevuto:", JSON.stringify(body));

    const { course_ids, course_id, user_id, email } = body;

    // --- NORMALIZZAZIONE INPUT (Array vs Singolo) ---
    let finalIds: string[] = [];
    
    if (course_ids && Array.isArray(course_ids) && course_ids.length > 0) {
        finalIds = course_ids;
    } else if (course_id) {
        finalIds = [course_id];
    }

    if (finalIds.length === 0) {
        console.error("❌ Nessun ID corso trovato nel payload");
        throw new Error("ID corsi mancanti.");
    }
    
    // 2. CONFIGURAZIONE CLIENT SUPABASE
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Variabili SUPABASE mancanti lato server.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. RECUPERA CORSI DAL DB
    const { data: courses, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('*')
        .in('id', finalIds);

    if (courseError || !courses || courses.length === 0) {
        throw new Error(`Corsi non trovati nel DB (IDs: ${finalIds.join(', ')}).`);
    }

    // 4. CHECK FEDELTÀ UTENTE
    let isLoyalCustomer = false;
    const isValidUser = user_id && typeof user_id === 'string' && user_id.trim().length > 0;

    if (isValidUser) {
        try {
            const { count } = await supabaseAdmin
                .from('purchases')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user_id);

            if (count !== null && count > 0) isLoyalCustomer = true;
        } catch (err) {
            console.error("Errore controllo storico acquisti:", err);
        }
    }

    // 5. PREPARA LINE ITEMS & CALCOLA TOTALE
    let totalAmountCents = 0;

    const line_items = courses.map((course: any) => {
        let finalPrice = course.price;
        let pricingTier = 'Standard';

        if (isLoyalCustomer && course.discounted_price && course.discounted_price > 0 && course.discounted_price < course.price) {
            finalPrice = course.discounted_price;
            pricingTier = 'Loyalty';
        }
        
        // Calcolo totale per Pixel Tracking
        totalAmountCents += Math.round(finalPrice * 100);

        return {
            price_data: {
                currency: 'eur',
                product_data: {
                  name: course.title,
                  description: course.description ? course.description.substring(0, 100) : 'Corso Online',
                  images: course.image ? [course.image] : [],
                  metadata: {
                      course_id: course.id,
                      pricing_tier: pricingTier
                  }
                },
                unit_amount: Math.round(finalPrice * 100),
            },
            quantity: 1,
        };
    });

    const totalAmountEur = (totalAmountCents / 100).toFixed(2);

    // 6. CONFIGURAZIONE STRIPE
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY non configurata.");

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })

    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const metadataIds = finalIds.join(',');

    // 7. CONFIGURAZIONE SESSIONE
    // Passiamo il totale nell'URL di successo per il Pixel
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}&total=${totalAmountEur}`, 
      cancel_url: `${origin}/#/cart`,
      metadata: {
        course_ids: metadataIds,
        type: 'multi_course_purchase'
      },
    };

    if (isValidUser) {
        sessionConfig.client_reference_id = user_id;
    }

    if (email && typeof email === 'string' && email.trim().length > 0) {
        sessionConfig.customer_email = email;
    } else {
        sessionConfig.customer_creation = 'if_required'; 
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error("❌ Errore Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, 
      },
    )
  }
})
