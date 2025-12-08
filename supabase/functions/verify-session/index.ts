
import Stripe from 'npm:stripe@14.25.0'
import { createClient } from 'npm:@supabase/supabase-js@2.42.0'

declare const Deno: any;

console.log("Verify Session Function Loaded v1");

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) throw new Error("Session ID mancante");

    // 1. Configurazione Stripe & Supabase Admin
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) throw new Error("Configurazione server mancante");

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Verifica sessione Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
        throw new Error("Il pagamento non risulta completato.");
    }

    const customerEmail = session.customer_details?.email || session.customer_email;
    if (!customerEmail) throw new Error("Email non trovata nella sessione Stripe.");

    console.log(`✅ Pagamento verificato per: ${customerEmail}`);

    // 3. Trova o Crea Utente su Supabase (Silenziosamente)
    // Nota: Il webhook potrebbe averlo già creato, ma noi dobbiamo essere sicuri al 100%
    // per poter generare il token di accesso ORA.
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find((u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase());

    if (!user) {
        // Se l'utente non esiste ancora (es. race condition col webhook), lo creiamo al volo
        console.log("Utente non trovato, creazione immediata...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: { full_name: session.customer_details?.name || 'Studente' }
        });
        if (createError) throw createError;
        user = newUser.user;
    }

    // 4. MAGIA: Genera un Magic Link e estrai i token per il login automatico
    // Usiamo generateLink type 'magiclink'. Questo ritorna un URL con i token hash.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: customerEmail,
        options: {
            redirectTo: 'http://localhost:3000' // Dummy URL, ci servono solo i parametri
        }
    });

    if (linkError || !linkData.properties?.action_link) {
        console.error("Errore generazione link:", linkError);
        throw new Error("Impossibile generare token di accesso.");
    }

    // 5. Estrai access_token e refresh_token dall'URL generato
    // L'URL è tipo: .../verify?token=...&type=magiclink&redirect_to=...#access_token=...&refresh_token=...
    // Ma generateLink spesso ritorna l'hash nei query params se non è un redirect browser.
    // L'oggetto linkData ha 'hashed_token', ma noi vogliamo fornire accesso immediato.
    // Metodo alternativo più pulito per ottenere sessione immediata: NON esiste un metodo admin "createSession".
    // Quindi dobbiamo fare un trick: Parsare l'URL di action_link.
    
    // NOTA: generateLink restituisce un link che l'utente deve CLICCARE.
    // Ma noi vogliamo i token SUBITO. 
    // TRUCCO: Usiamo `otp` type 'recovery' se magiclink non espone i token direttamente?
    // No, Supabase Admin non espone raw token per sicurezza.
    
    // ALTERNATIVA MIGLIORE: Non possiamo loggarlo server-side e passare i token al client in modo sicuro senza esporli.
    // MA, essendo una chiamata POST sicura dal nostro frontend che ha il session_id (che agisce da secret key temporanea),
    // possiamo fidarci.
    
    // Se generateLink non ci da il token raw, usiamo signUserIn? No, non esiste in Admin.
    // Usiamo signInWithOtp? No, manda mail.
    
    // Soluzione: Poiché non possiamo generare un Access Token raw lato server facilmente senza password,
    // Restituiamo il `action_link` al frontend. Il frontend farà un redirect automatico (o fetch) a quel link.
    // Quel link verificherà il token e imposterà la sessione.
    
    // Attendiamo... generateLink ritorna: { user, action_link, email_otp, hashed_token, verification_type }
    // L'action_link contiene il token che verifica l'utente.
    
    return new Response(
      JSON.stringify({ 
          success: true, 
          action_link: linkData.properties.action_link 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, 
      }
    )

  } catch (error: any) {
    console.error("❌ Error verifying session:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, 
      }
    )
  }
})
