
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forza il logout se l'utente arriva qui per errore, ma mantiene la sessione se è un recupero
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se non c'è sessione, rimanda al login (il link era scaduto o non valido)
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      
      if (error) throw error;

      alert("Password aggiornata con successo! Ora verrai reindirizzato alla Dashboard.");
      navigate('/dashboard');
    } catch (error: any) {
      alert("Errore aggiornamento password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex justify-center items-center overflow-hidden bg-slate-900 relative">
        {/* Background Image (stesso stile del Login) */}
        <div 
            className="absolute inset-0 z-0"
            style={{
                background: `url('https://res.cloudinary.com/dhj0ztos6/image/upload/v1764867375/mwa_trasparente_thl6fk.png') no-repeat center center fixed`,
                backgroundSize: 'cover',
                opacity: 0.3
            }}
        ></div>
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/20 rounded-[20px] p-10 w-[350px] shadow-[0_0_40px_rgba(0,255,224,0.2)]">
            <h2 className="text-center text-white mb-2 font-semibold text-2xl tracking-wide">Imposta Password</h2>
            <p className="text-center text-gray-400 text-sm mb-6">Inserisci la tua nuova password per completare l'attivazione dell'account.</p>
            
            <form onSubmit={handleUpdatePassword}>
                <div className="mb-5 relative">
                    <input 
                        type="password" 
                        required 
                        minLength={6}
                        placeholder="Nuova Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 pl-4 rounded-[10px] bg-white/10 border border-white/20 text-white text-sm outline-none transition-all duration-300 focus:border-[#00ffe0] focus:shadow-[0_0_8px_#00ffe0aa] placeholder-gray-300"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full p-3 bg-[#00ffe0] text-black font-semibold rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-[#00c6b5] hover:shadow-[0_0_15px_#00ffe0aa] mb-5 disabled:opacity-50"
                >
                    {loading ? 'Salvataggio...' : 'Salva e Accedi'}
                </button>
            </form>
        </div>
    </div>
  );
};
