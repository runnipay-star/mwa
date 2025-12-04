
import React, { useState, useEffect } from 'react';
import { Course, UserProfile, PlatformSettings } from '../types';
import { Plus, Edit2, Trash2, Search, DollarSign, BookOpen, Clock, Eye, Lock, Unlock, Loader, Settings, Image, LayoutTemplate, Activity, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  courses: Course[];
  user: UserProfile;
  onDelete: (id: string) => void;
  onRefresh: () => Promise<void>;
  currentSettings: PlatformSettings;
  onUpdateSettings: (newSettings: PlatformSettings) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ courses, user, onDelete, onRefresh, currentSettings, onUpdateSettings }) => {
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Local state for settings form
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(currentSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync props to state if props change externally
  useEffect(() => {
    setLocalSettings(currentSettings);
  }, [currentSettings]);

  // Funzione per assegnare/rimuovere corso all'admin corrente (per test)
  const toggleUnlockForMe = async (courseId: string) => {
    setProcessingId(courseId);
    
    try {
        const hasCourse = user.purchased_courses.includes(courseId);
        
        if (hasCourse) {
            // Rimuovi accesso
            const { error } = await supabase
                .from('purchases')
                .delete()
                .eq('user_id', user.id)
                .eq('course_id', courseId);
            
            if (error) throw error;
        } else {
            // Aggiungi accesso (Gratis)
            const { error } = await supabase
                .from('purchases')
                .insert({
                    user_id: user.id,
                    course_id: courseId,
                    stripe_payment_id: 'admin_manual_grant'
                });
            
            if (error) throw error;
        }

        // Aggiorna i dati globali
        await onRefresh();
        
    } catch (err: any) {
        alert("Errore operazione: " + err.message + "\n\nAssicurati di aver eseguito l'SQL per permettere agli admin di modificare la tabella purchases.");
    } finally {
        setProcessingId(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
        await onUpdateSettings(localSettings);
        alert("Impostazioni salvate con successo!"); 
    } catch (error: any) {
        console.error("Settings Save Error:", error);
        
        if (error.message?.includes('row-level security')) {
             alert(
                 "ERRORE PERMESSI DATABASE (RLS)\n\n" +
                 "Il database ha bloccato il salvataggio perché manca il permesso di INSERIMENTO per gli admin.\n\n" +
                 "SOLUZIONE: Vai nel SQL Editor di Supabase ed esegui questo comando:\n\n" +
                 "create policy \"Admins insert settings\" on platform_settings for insert with check ( auth.uid() in (select id from profiles where is_admin = true) );"
             );
        } else {
             alert("Errore salvataggio impostazioni: " + error.message);
        }
    } finally {
        setIsSavingSettings(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestione Piattaforma</h1>
                <p className="text-gray-500 mt-1">Gestisci i tuoi corsi, prezzi e contenuti da qui.</p>
            </div>
            <button 
                onClick={() => navigate('/admin/course/new')}
                className="bg-brand-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center"
            >
                <Plus className="h-5 w-5 mr-2" /> Crea Nuovo Corso
            </button>
        </div>

        {/* --- SETTINGS PANEL GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Visual Config */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-brand-600" /> Aspetto & Branding
                </h2>
                
                <div className="space-y-6 flex-1">
                    {/* Logo Slider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                            <span>Grandezza Logo (Pixel)</span>
                            <span className="font-bold text-brand-600">{localSettings.logo_height}px</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <Image className="h-4 w-4 text-gray-400" />
                            <input 
                                type="range" 
                                min="30" 
                                max="300" 
                                value={localSettings.logo_height} 
                                onChange={(e) => setLocalSettings({...localSettings, logo_height: Number(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            />
                            <Image className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                             <Activity className="h-4 w-4 mr-2 text-blue-600" /> Meta Pixel ID
                        </label>
                        <input 
                            type="text" 
                            value={localSettings.meta_pixel_id || ''}
                            onChange={(e) => setLocalSettings({...localSettings, meta_pixel_id: e.target.value})}
                            placeholder="Es. 123456789012345"
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">Inserisci l'ID numerico per tracciare automaticamente gli eventi.</p>
                    </div>
                </div>
            </div>

            {/* Landing Page Content */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <LayoutTemplate className="h-5 w-5 mr-2 text-brand-600" /> Contenuto Home Page
                </h2>
                
                <div className="space-y-4 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Principale (Hero)</label>
                        <textarea 
                            rows={2}
                            value={localSettings.home_hero_title || ''}
                            onChange={(e) => setLocalSettings({...localSettings, home_hero_title: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Costruiamo piattaforme..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo Evidenziato</label>
                        <input 
                            type="text" 
                            value={localSettings.home_hero_subtitle || ''}
                            onChange={(e) => setLocalSettings({...localSettings, home_hero_subtitle: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Senza Software a Pagamento"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center"
                    >
                        {isSavingSettings ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                        {isSavingSettings ? 'Salvataggio...' : 'Salva Modifiche Globali'}
                    </button>
                </div>
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                    <BookOpen className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Totale Corsi</p>
                    <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                    <DollarSign className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Valore Catalogo</p>
                    <p className="text-2xl font-bold text-gray-900">€{courses.reduce((acc, c) => acc + c.price, 0).toFixed(2)}</p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Ore Totali</p>
                    <p className="text-2xl font-bold text-gray-900">100+</p>
                </div>
            </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">Elenco Corsi</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cerca corso..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Corso</th>
                            <th className="px-6 py-4">Prezzo</th>
                            <th className="px-6 py-4">Stato Accesso (Test)</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {courses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Nessun corso presente. Clicca su "Crea Nuovo Corso" per iniziare.
                                </td>
                            </tr>
                        ) : (
                            courses.map((course) => {
                                const hasAccess = user.purchased_courses.includes(course.id);
                                const isLoading = processingId === course.id;

                                return (
                                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img 
                                                    src={course.image} 
                                                    alt="" 
                                                    className="h-10 w-10 rounded-lg object-cover mr-4 border border-gray-200"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900">{course.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{course.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            €{course.price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleUnlockForMe(course.id)}
                                                disabled={isLoading}
                                                className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                                                    hasAccess 
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            >
                                                {isLoading ? (
                                                    <Loader className="h-3 w-3 animate-spin mr-1" />
                                                ) : hasAccess ? (
                                                    <Unlock className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Lock className="h-3 w-3 mr-1" />
                                                )}
                                                {isLoading ? 'Attendi...' : hasAccess ? 'Sbloccato (Admin)' : 'Bloccato'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => navigate(`/course/${course.id}`)}
                                                className="inline-flex items-center p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors"
                                                title="Anteprima Pubblica"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/admin/course/${course.id}`)}
                                                className="inline-flex items-center p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-600 transition-colors"
                                                title="Modifica Corso"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(course.id)}
                                                className="inline-flex items-center p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:text-red-600 hover:border-red-600 transition-colors"
                                                title="Elimina"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
                Mostrando {courses.length} corsi
            </div>
        </div>
      </div>
    </div>
  );
};
