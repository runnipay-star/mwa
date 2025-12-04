
import React from 'react';
import { Course, UserProfile } from '../types';
import { CheckCircle, ArrowRight, PlayCircle, ShieldCheck, Zap, Database, Layout, Smartphone, Target, Cpu, Layers, Users, MousePointerClick, Lock, ShoppingCart, Quote } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
  user?: UserProfile | null;
  heroTitle?: string;
  heroSubtitle?: string;
}

export const Home: React.FC<HomeProps> = ({ courses, onCourseSelect, user, heroTitle, heroSubtitle }) => {
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    addToCart(course);
  };

  const scrollToCourses = () => {
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      
      {/* HERO SECTION - Dark & Authority */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-slate-900 overflow-hidden text-white">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
             <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-brand-400 font-semibold text-xs sm:text-sm mb-8 uppercase tracking-wider shadow-lg">
              <span className="flex h-2 w-2 bg-brand-500 rounded-full animate-pulse"></span>
              Zero Abbonamenti • Zero Crediti AI • Zero Tool a Pagamento
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-tight">
              {heroTitle || 'Costruiamo piattaforme e sistemi digitali'}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 block mt-2">
                {heroSubtitle || 'Senza Software a Pagamento'}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              MWA vi insegna le stesse competenze che usiamo ogni giorno in ufficio per costruire piattaforme reali, landing page, automazioni e campagne pubblicitarie per i nostri clienti.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={scrollToCourses}
                className="bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-500 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] flex items-center justify-center group"
              >
                Scopri i corsi disponibili <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                 onClick={scrollToCourses}
                 className="bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                Inizia da quello che ti serve
              </button>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-400 font-medium">
               <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-brand-500" /> Zero fuffa — solo tutorial pratici</div>
               <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-brand-500" /> Corsi acquistabili singolarmente</div>
               <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-brand-500" /> Entrate, imparate e create subito</div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 1 - Origin Story (Daniel Moise) - REDESIGNED */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 skew-x-12 transform translate-x-20 z-0"></div>
        <div className="absolute bottom-10 left-10 text-slate-100 z-0">
             <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="2" className="text-slate-200 fill-current" />
                    </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#dot-pattern)" />
            </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                
                {/* Image Composition */}
                <div className="w-full lg:w-1/2 relative">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                        <img 
                            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" 
                            alt="Daniel Moise Office" 
                            className="w-full h-[550px] object-cover hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                    </div>

                    {/* Floating Quote Card */}
                    <div className="absolute -bottom-10 -right-4 md:-right-10 w-[90%] md:w-auto md:max-w-md bg-white p-8 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100">
                        <Quote className="h-10 w-10 text-brand-200 mb-4" />
                        <p className="font-bold text-slate-900 text-lg md:text-xl leading-relaxed italic">
                            "Non vi promettiamo guadagni facili, vi diamo competenze reali."
                        </p>
                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                            <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">DM</div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Daniel Moise</p>
                                <p className="text-xs text-slate-500 font-medium">Founder, Moise Web Academy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2 lg:pl-10 mt-12 lg:mt-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-brand-50 text-brand-700 font-bold text-xs uppercase tracking-widest mb-6">
                        <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                        La Nostra Missione
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                        Perché nasce <br/><span className="text-brand-600">Moise Web Academy</span>
                    </h2>

                    <div className="prose prose-lg text-slate-600 mb-8 leading-relaxed">
                        <p>
                            <strong>Siamo Moise Web Academy.</strong> Negli ultimi anni abbiamo costruito piattaforme AI, siti web dinamici, automazioni, landing page e campagne pubblicitarie per decine di progetti reali.
                        </p>
                        <p>
                            Nel mercato della formazione c'è una cosa che ci ha sempre dato fastidio:
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">✕</span>
                            <span className="text-slate-700 font-medium">I corsi che promettono soldi veloci</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">✕</span>
                            <span className="text-slate-700 font-medium">I “guru” che non hanno mai creato nulla</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">✕</span>
                            <span className="text-slate-700 font-medium">Le lezioni che obbligano a comprare tool da 30–100€/mese</span>
                        </div>
                    </div>

                    <div className="pl-6 border-l-4 border-brand-500">
                        <h4 className="font-bold text-xl text-slate-900 mb-2">Noi facciamo l’opposto.</h4>
                        <p className="text-slate-600">
                            In questa Academy vi insegniamo a creare tutto ciò che serve nel digitale usando strumenti <strong>a costo zero</strong>. 
                            Non pagate abbonamenti. Non servono crediti AI. Zero spese nascoste.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* SECTION 2 - Cosa Imparerai (Grid) */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Cosa imparerete con noi</h2>
                <p className="text-lg text-slate-600">Competenze tecniche verticali, divise per obiettivi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Card 1 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                    <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                        <Cpu className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">AI & Sviluppo Low-Code</h3>
                    <ul className="space-y-3 text-slate-600 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Google AI Studio (Zero Costi)</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Database Supabase</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Deploy su Vercel</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Gestione Domini & DNS</li>
                    </ul>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                    <div className="bg-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                        <Layout className="h-7 w-7 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Landing Page & Siti Web</h3>
                    <ul className="space-y-3 text-slate-600 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Elementor (versione base)</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Struttura & Copy</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Template pronti all'uso</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Ottimizzazione Mobile</li>
                    </ul>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                    <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
                        <Zap className="h-7 w-7 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Automazioni a Costo Zero</h3>
                    <ul className="space-y-3 text-slate-600 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Notifiche intelligenti</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Email automatiche</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Webhook Make/N8N</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> API Integration</li>
                    </ul>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                    <div className="bg-pink-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-600 transition-colors">
                        <Target className="h-7 w-7 text-pink-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Pubblicità & Ads</h3>
                    <ul className="space-y-3 text-slate-600 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Meta Ads (FB/IG)</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> TikTok Ads</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Strategie E-commerce</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> Lead Generation</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* SECTION 3 - USP (Perché diverso) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">Perché siamo diversi dagli altri corsi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">TUTTO SENZA SPESE EXTRA</h4>
                        <p className="text-slate-600 leading-relaxed">
                            Ogni corso è pensato per lavorare con AI a costo zero, zero crediti, zero tool premium e zero costi mensili. Il vostro budget serve per il vostro business, non per i software.
                        </p>
                    </div>
                </div>

                <div className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Layers className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Lezioni pratiche, non teoria</h4>
                        <p className="text-slate-600 leading-relaxed">
                            Ogni modulo contiene schermate reali, processi passo-passo, progetti finali da realizzare e template già pronti da scaricare.
                        </p>
                    </div>
                </div>

                <div className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Nessuna fuffa</h4>
                        <p className="text-slate-600 leading-relaxed">
                            Non vi promettiamo guadagni, vi diamo competenze tecniche solide. Punto.
                        </p>
                    </div>
                </div>

                <div className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Database className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Prezzi onesti</h4>
                        <p className="text-slate-600 leading-relaxed">
                            Ogni corso lo pagate singolarmente. Niente abbonamenti. Pagate solo ciò che vi serve davvero per il vostro prossimo step.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* SECTION 4 - I CORSI (Dynamic Grid) */}
      <section id="courses" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">I Corsi Disponibili</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Scegliete il percorso più adatto alle vostre esigenze. Accesso a vita, aggiornamenti inclusi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const isPurchased = user?.purchased_courses.includes(course.id);
              const inCart = isInCart(course.id);

              return (
                <div key={course.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col h-full group hover:border-brand-500 transition-all duration-300">
                  
                  <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => onCourseSelect(course.id)}>
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-400 uppercase tracking-wide border border-slate-700">
                          {course.level}
                      </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 cursor-pointer group-hover:text-brand-400 transition-colors" onClick={() => onCourseSelect(course.id)}>{course.title}</h3>
                    <p className="text-slate-400 mb-6 text-sm line-clamp-3 flex-1 leading-relaxed">{course.description}</p>
                    
                    <div className="space-y-3 mb-8">
                      {course.features.slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-center text-sm text-slate-300">
                              <CheckCircle className="h-4 w-4 text-brand-500 mr-2 flex-shrink-0" />
                              {feat}
                          </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-700 flex items-center justify-between gap-3">
                      <div>
                          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Investimento</span>
                          <span className="text-2xl font-bold text-white">€{course.price}</span>
                      </div>
                      
                      {isPurchased ? (
                        <button 
                            onClick={() => onCourseSelect(course.id)}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex-1 shadow-lg shadow-green-900/20"
                        >
                            Vai al Corso
                        </button>
                      ) : (
                        <div className="flex gap-2">
                           <button 
                              onClick={(e) => {
                                if (inCart) navigate('/cart');
                                else handleAddToCart(e, course);
                              }}
                              className={`p-3 rounded-lg font-semibold transition-colors border ${inCart ? 'bg-brand-900 border-brand-500 text-brand-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-brand-500 hover:text-white'}`}
                              title={inCart ? "Vai al carrello" : "Aggiungi al carrello"}
                           >
                              <ShoppingCart className="h-5 w-5" />
                           </button>
                           <button 
                              onClick={() => onCourseSelect(course.id)}
                              className="bg-white text-slate-900 px-4 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                          >
                              Dettagli
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 - A CHI È DEDICATA (Badges) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">A chi è dedicata l’Academy</h2>
            
            <div className="flex flex-wrap justify-center gap-4">
                {[
                    "Freelance che vogliono skills digitali",
                    "Chi vuole iniziare un business low-budget",
                    "Creator che vogliono automatizzare",
                    "Chi vuole offrire servizi B2B",
                    "Chi vuole creare SaaS senza codice",
                    "Chi lancia prodotti fisici"
                ].map((item, idx) => (
                    <div key={idx} className="bg-white px-6 py-4 rounded-full shadow-sm border border-slate-200 text-slate-700 font-medium flex items-center hover:scale-105 transition-transform cursor-default">
                        <Users className="h-5 w-5 mr-3 text-brand-600" />
                        {item}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* SECTION 6 - COME FUNZIONA (Steps) */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">Come funziona</h2>
            
            <div className="space-y-4">
                {[
                    "Scegliete il corso che vi serve",
                    "Lo acquistate singolarmente",
                    "Accedete subito alla piattaforma",
                    "Lezioni video passo-passo",
                    "Template scaricabili",
                    "Aggiornamenti inclusi"
                ].map((step, i) => (
                    <div key={i} className="flex items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold mr-4 shrink-0">
                            {i + 1}
                        </div>
                        <span className="text-slate-700 font-medium text-lg">{step}</span>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-slate-500 font-medium">
                    Niente abbonamenti, niente costi nascosti. Solo ciò che vi serve davvero.
                </p>
            </div>
        </div>
      </section>

      {/* SECTION 7 - CTA FINALE */}
      <section className="py-24 bg-brand-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-12 -mt-12 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-20 rounded-full -ml-12 -mb-12 blur-3xl"></div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Iniziate a costruire qualcosa di reale.
              </h2>
              <p className="text-xl md:text-2xl text-brand-100 mb-10 font-medium">
                  Usate l’AI a costo zero, create progetti veri e portate le vostre competenze al livello successivo.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={scrollToCourses}
                    className="bg-white text-brand-600 px-10 py-5 rounded-xl font-bold text-xl hover:bg-slate-100 transition-all shadow-xl shadow-brand-800/20"
                  >
                      Guarda tutti i corsi
                  </button>
                  <button 
                    onClick={scrollToCourses}
                    className="bg-brand-700 text-white border border-brand-500 px-10 py-5 rounded-xl font-bold text-xl hover:bg-brand-800 transition-all"
                  >
                      Scegli il primo corso
                  </button>
              </div>
          </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">MWA</span>
                <span>Moise Web Academy</span>
            </div>
            <p>&copy; 2024 MOISE WEB ACADEMY. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
};
