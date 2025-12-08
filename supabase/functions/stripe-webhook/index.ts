
// FIX DEFINITIVO: Versioni bloccate (senza ^) per stabilità
import Stripe from 'npm:stripe@14.25.0'
import { createClient } from 'npm:@supabase/supabase-js@2.42.0'

declare const Deno: any;

console.log("Stripe Webhook Handler Loaded v21 (Domain Fix)");

// ==============================================================================
// 🔗 CONFIGURAZIONE LINK EMAIL
// Modifica questa variabile con il link dove vuoi che l'utente atterri.
// ==============================================================================

const SITE_URL = "https://www.mwacademy.eu"; 

// ==============================================================================

Deno.serve(async (req: Request) => {
  // Gestione CORS per test locali
  if (req.method === 'OPTIONS') {
      return new Response('ok', { 
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
          } 
      })
  }

  if (req.method !== 'POST') {
      return new Response(`Webhook online. Send POST requests here.`, { status: 200 });
  }

  try {
    const signature = req.headers.get('Stripe-Signature');
    const body = await req.text(); 

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');
    const resendApiKey = Deno.env.get('RESEND_API_KEY')?.trim(); 
    
    if (!stripeKey || !endpointSecret) {
        console.error("❌ ERRORE: Configurazione Stripe mancante su Supabase Secrets.");
        return new Response("Server Configuration Error", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', typescript: true });

    let event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature!, endpointSecret)
    } catch (err: any) {
      console.error(`❌ Webhook Signature Error: ${err.message}`)
      return new Response(`Webhook Signature Error: ${err.message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      let userId = session.client_reference_id
      const guestEmail = session.customer_details?.email;
      const guestName = session.customer_details?.name || 'Studente';

      console.log(`💳 Processando acquisto... Email: ${guestEmail}`);

      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

      // --- 1. LOGICA CREAZIONE UTENTE ---
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find((u: any) => u.email?.toLowerCase() === guestEmail.toLowerCase());

      let passwordGenerated = null;

      if (existingUser) {
           console.log(`ℹ️ Utente già esistente (ID: ${existingUser.id}). Salto creazione e invio password.`);
           userId = existingUser.id;
      } else {
          console.log(`📧 Creazione NUOVO account per: ${guestEmail}`);
          
          // Genera Password
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          passwordGenerated = `Mwa${randomNum}!`;
          
          console.log(`🔐 Password Generata (Log): ${passwordGenerated}`);

          // Crea Utente
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: guestEmail,
              password: passwordGenerated,
              email_confirm: true,
              user_metadata: { full_name: guestName }
          });

          if (createError) {
              console.error("❌ Errore creazione utente:", createError.message);
          } else if (newUser && newUser.user) {
              userId = newUser.user.id;
          }
      }

      // --- 2. INVIO EMAIL (SOLO SE NUOVO UTENTE) ---
      if (passwordGenerated && resendApiKey) {
          await sendCredentialsEmail(resendApiKey, guestEmail, passwordGenerated, guestName);
      } else if (!passwordGenerated) {
          console.log("🔕 Mail credenziali NON inviata: L'utente esisteva già.");
      } else if (!resendApiKey) {
          console.log("⚠️ RESEND_API_KEY mancante. Mail non inviata.");
      }

      // --- 3. REGISTRAZIONE ACQUISTO NEL DB ---
      if (userId) {
        const singleCourseId = session.metadata?.course_id;
        const multiCourseIds = session.metadata?.course_ids;

        let coursesToInsert: string[] = [];
        if (multiCourseIds) {
            coursesToInsert = multiCourseIds.split(',');
        } else if (singleCourseId) {
            coursesToInsert = [singleCourseId];
        }

        if (coursesToInsert.length > 0) {
            const rows = coursesToInsert.map(cId => ({
                user_id: userId,
                course_id: cId.trim(),
                stripe_payment_id: session.id
            }));

            await supabaseAdmin.from('profiles').upsert({ id: userId, email: guestEmail, full_name: guestName, is_admin: false }, { onConflict: 'id' });
            await supabaseAdmin.from('purchases').insert(rows);
            console.log("🎉 Acquisti salvati nel DB!");
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" }, status: 200 })

  } catch (err: any) {
    console.error(`❌ Server Error: ${err.message}`)
    return new Response(`Server Error: ${err.message}`, { status: 200 })
  }
})

// --- FUNZIONE EMAIL ---
async function sendCredentialsEmail(apiKey: string, toEmail: string, password: string, name: string) {
    console.log(`📧 Tentativo invio Resend a: ${toEmail}`);
    
    // IMPORTANTE: Dato che hai verificato il dominio mwacademy.eu, DEVI inviare da questo dominio.
    // Non puoi inviare da gmail usando Resend.
    const sender = 'Moise Web Academy <info@mwacademy.eu>'; 

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: sender,
                to: [toEmail], 
                subject: 'Benvenuto in MWA - Ecco le tue credenziali',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #2563eb;">Benvenuto in MWA!</h1>
                        <p>Ciao ${name}, grazie per il tuo acquisto.</p>
                        <p>Il tuo account è stato creato. Ecco le tue credenziali provvisorie per accedere alla piattaforma:</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e5e7eb;">
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${toEmail}</p>
                            <p style="margin: 5px 0; font-size: 18px;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd;">${password}</code></p>
                        </div>

                        <p>Puoi accedere subito cliccando qui sotto:</p>
                        
                        <!-- BOTTONE CON LINK DINAMICO -->
                        <a href="${SITE_URL}/#/login" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accedi Ora</a>
                        
                        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
                        <p style="font-size: 12px; color: #888;">Ti consigliamo di cambiare la password dopo il primo accesso.</p>
                    </div>
                `
            })
        });

        const responseData = await res.json();

        if (!res.ok) {
            console.error("❌ ERRORE RISPOSTA RESEND:", JSON.stringify(responseData));
        } else {
            console.log("✅ EMAIL INVIATA CON SUCCESSO! ID:", responseData.id);
        }
    } catch (e) {
        console.error("❌ Errore Network fetch:", e);
    }
}
