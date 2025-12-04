
// FIX DEFINITIVO: Versioni bloccate (senza ^) per stabilità
import Stripe from 'npm:stripe@14.25.0'
import { createClient } from 'npm:@supabase/supabase-js@2.42.0'

declare const Deno: any;

console.log("Create Checkout Function Initialized (NPM - Auto Fetch)");

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

    const { course_ids, user_id, email } = body;

    // Validate input: must be array and not empty
    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
        throw new Error("ID corsi mancanti o formato non valido.");
    }
    
    // 2. CONFIGURAZIONE CLIENT SUPABASE
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Variabili SUPABASE mancanti lato server (SUPABASE_URL o SERVICE_ROLE).");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. RECUPERA CORSI DAL DB
    const { data: courses, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('*')
        .in('id', course_ids);

    if (courseError || !courses || courses.length === 0) {
        throw new Error("Corsi non trovati nel DB.");
    }

    // 4. CHECK FEDELTÀ UTENTE
    // Controlliamo se l'utente ha acquisti precedenti (NON includendo quelli che sta facendo ora, ovviamente)
    let isLoyalCustomer = false;
    try {
        const { count, error: purchaseError } = await supabaseAdmin
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);

        if (!purchaseError && count !== null && count > 0) {
            isLoyalCustomer = true;
            console.log(`✅ Utente Fedele rilevato (${count} acquisti passati).`);
        }
    } catch (err) {
        console.error("Errore controllo storico acquisti:", err);
    }

    // 5. PREPARA LINE ITEMS PER STRIPE
    // Calcoliamo il prezzo per ogni corso (Standard vs Loyalty)
    const line_items = courses.map((course: any) => {
        let finalPrice = course.price;
        let pricingTier = 'Standard';

        // Se l'utente è fedele E il corso ha un prezzo scontato valido
        if (isLoyalCustomer && course.discounted_price && course.discounted_price > 0 && course.discounted_price < course.price) {
            finalPrice = course.discounted_price;
            pricingTier = 'Loyalty';
        }

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
                unit_amount: Math.round(finalPrice * 100), // Centesimi
            },
            quantity: 1,
        };
    });

    // 6. CONFIGURAZIONE STRIPE
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY non configurata nei Secrets.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })

    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // Metadata limit: 500 chars. Join IDs with comma.
    const metadataIds = course_ids.join(',');

    // 7. CREA SESSIONE
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${origin}/#/dashboard`,
      cancel_url: `${origin}/#/cart`,
      customer_email: email,
      client_reference_id: user_id,
      metadata: {
        course_ids: metadataIds, // Store comma-separated IDs
        type: 'multi_course_purchase'
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error: any) {
    const errorMsg = error.message || "Errore sconosciuto nel backend";
    console.error("Errore Function:", errorMsg);
    
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, 
      },
    )
  }
})
