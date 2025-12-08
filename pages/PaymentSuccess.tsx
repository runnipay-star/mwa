
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { trackPurchase, trackLead } from '../services/metaPixel';

export const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const totalAmount = searchParams.get('total');
    
    const navigate = useNavigate();
    const { clearCart } = useCart();
    
    // Usiamo un ref per gestire il montaggio immediato, ma sessionStorage per la persistenza vera
    const processingRef = useRef(false);
    
    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        // --- SISTEMA ANTI-DUPLICAZIONE EVENTI PIXEL ---
        // Usiamo sessionStorage per ricordare che QUESTO specifico ordine (sessionId) è già stato tracciato.
        // Questo risolve il problema dei doppi eventi (gialli) e dei refresh di pagina.
        const storageKey = `mwa_pixel_tracked_${sessionId}`;
        const alreadyTracked = sessionStorage.getItem(storageKey);

        if (!alreadyTracked && !processingRef.current) {
            processingRef.current = true; // Blocco locale per React Strict Mode
            
            // 1. Pulisce il carrello (solo se è un nuovo successo)
            clearCart();
            
            // 2. Traccia gli eventi sul Pixel
            const value = totalAmount ? parseFloat(totalAmount) : 0;

            setTimeout(() => {
                // Segna come tracciato PRIMA di inviare, per sicurezza
                sessionStorage.setItem(storageKey, 'true');

                // Evento Purchase (Priorità Alta)
                if (value > 0) {
                    console.log(`💰 Tracking Purchase (Unique): €${value} (Session: ${sessionId})`);
                    trackPurchase(value, sessionId);
                } else {
                    console.log(`💰 Tracking Purchase (Fallback Unique): €0 (Session: ${sessionId})`);
                    trackPurchase(0, sessionId);
                }

                // Evento Lead
                trackLead();
                
            }, 750); // Leggero ritardo aumentato per assicurare il caricamento completo del Pixel
        } else {
            console.log("ℹ️ Pixel events already tracked for this session. Skipping.");
            // Pulisce comunque il carrello per sicurezza UX
            clearCart();
        }

    }, [sessionId, totalAmount, clearCart, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden px-4 font-sans">
             {/* Background Effects */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600 rounded-full blur-[140px] opacity-20 animate-pulse"></div>

             <div className="relative z-10 text-center max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
                
                {/* Icona Animata */}
                <div className="mb-8 relative inline-block">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl relative z-10">
                         <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-black mb-4 tracking-tight">Grazie dell'acquisto!</h1>
                
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                    Il pagamento è stato confermato con successo. <br/>Benvenuto a bordo.
                </p>

                {/* Box Istruzioni */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-8 text-left shadow-inner">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-brand-500/20 p-2 rounded-xl text-brand-400">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Controlla la tua Email</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Le tue <strong>credenziali di accesso</strong> sono state inviate all'indirizzo email usato per il pagamento.
                            </p>
                            <p className="text-amber-400 text-xs mt-2 font-semibold">
                                ⚠️ Importante: Controlla anche nella cartella SPAM o Posta Indesiderata se non trovi l'email nella posta in arrivo.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                        <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
                            <Star className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Accesso Immediato</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Usa email e password ricevute per accedere alla dashboard e iniziare a studiare.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Totale Pagato (Opzionale, visivo per l'utente) */}
                {totalAmount && (
                    <div className="flex justify-center items-center gap-2 mb-8 text-slate-400 text-sm uppercase tracking-widest font-bold">
                        <ShoppingBag className="h-4 w-4"/> Totale Pagato: <span className="text-white">€{totalAmount}</span>
                    </div>
                )}

                <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-brand-50 hover:text-brand-700 transition-all flex items-center justify-center group shadow-lg shadow-white/10"
                >
                    Vai al Login <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             
             <p className="mt-8 text-slate-500 text-sm text-center">
                 Hai bisogno di aiuto? Scrivici a <a href="mailto:info.moisewebaccademy@gmail.com" className="text-brand-400 hover:underline">info.moisewebaccademy@gmail.com</a> o contattaci su WhatsApp.
             </p>
        </div>
    );
};
