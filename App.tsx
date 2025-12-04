
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CourseDetail } from './pages/CourseDetail';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEditCourse } from './pages/AdminEditCourse';
import { Cart } from './pages/Cart';
import { UserProfile, Course, PlatformSettings } from './types';
import { supabase, createCheckoutSession } from './services/supabase';
import { CartProvider } from './contexts/CartContext';
import { initMetaPixel, trackPageView, trackCompleteRegistration } from './services/metaPixel';

// Helper to handle authentication, state and Pixel tracking
const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Platform Settings State (Full object now)
  const [settings, setSettings] = useState<PlatformSettings>({
      id: 1,
      logo_height: 64,
      home_hero_title: 'Costruiamo piattaforme e sistemi digitali',
      home_hero_subtitle: 'Senza Software a Pagamento',
      meta_pixel_id: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- PIXEL TRACKING: PAGE VIEW ---
  useEffect(() => {
    trackPageView();
  }, [location]);

  // --- PIXEL INIT ---
  useEffect(() => {
      if (settings.meta_pixel_id) {
          initMetaPixel(settings.meta_pixel_id);
      }
  }, [settings.meta_pixel_id]);

  // --- 1. FETCH COURSES FROM DB ---
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        console.error('Error fetching courses:', JSON.stringify(error, null, 2));
      } else if (data) {
        setCourses(data as Course[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching courses:', err);
    }
  };

  // --- 2. FETCH PLATFORM SETTINGS ---
  const fetchSettings = async () => {
    try {
      // Assuming we have a 'platform_settings' table with id=1
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*') // Select all fields
        .eq('id', 1)
        .single();
      
      if (data) {
        // Merge with defaults to ensure safety
        setSettings(prev => ({
            ...prev,
            ...data
        }));
      } else if (error && error.code !== 'PGRST116') {
        // Only log real errors, not "Row not found" (PGRST116) which just means we use default
        console.log("Settings fetch info:", error.message);
      }
    } catch (err) {
      // Silent fail, use defaults
    }
  };
  
  // --- 3. SAVE SETTINGS (For Admin) ---
  const handleUpdateSettings = async (newSettings: PlatformSettings) => {
    setSettings(newSettings); // Optimistic update
    
    // Save to DB
    const { error } = await supabase
        .from('platform_settings')
        .upsert(newSettings);
        
    if (error) throw error;
  };

  // --- 4. REFRESH USER DATA (Profile & Purchases) ---
  const refreshUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
        // A. Get/Create Profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ 
                    id: session.user.id, 
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    is_admin: false 
                }])
                .select()
                .single();
            
            if (!createError) {
                profile = newProfile;
            }
        }

        // B. Get Purchases (Join logic manually)
        const { data: purchases } = await supabase
          .from('purchases')
          .select('course_id')
          .eq('user_id', session.user.id);

        const purchasedCourseIds = purchases ? purchases.map(p => p.course_id) : [];

        setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || session.user.email!.split('@')[0],
            is_admin: profile?.is_admin || false,
            purchased_courses: purchasedCourseIds
        });

    } catch (error) {
        console.error("Error loading user data:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  // --- 5. INIT EFFECT ---
  useEffect(() => {
    let mounted = true;

    // Load initial data
    fetchCourses();
    fetchSettings();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
             if (session) {
                 refreshUserData();
             } else {
                 setUser(null);
                 setLoading(false);
             }
        }
    });

    // Initial check
    refreshUserData();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUserData]);

  // --- HANDLERS ---

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement).value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, 
          },
        },
      });

      if (error) throw error;
      
      // Track Registration Event
      trackCompleteRegistration();

      alert("Registrazione avvenuta! Se hai confermato l'email, effettua il login.");
    } catch (error: any) {
      alert("Errore registrazione: " + error.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Errore login: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handlePurchase = async (courseId: string) => {
    if (isPurchasing) return;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
        alert("Devi accedere per acquistare un corso!");
        navigate('/login');
        return;
    }
    
    const currentUser = session.user;
    
    try {
        setIsPurchasing(true);
        // Passa un array con un singolo ID per mantenere compatibilità
        const response = await createCheckoutSession([courseId], currentUser.id, currentUser.email || '');
        if (response && response.url) {
            window.location.href = response.url;
        } else {
            throw new Error("URL di pagamento non ricevuto");
        }
    } catch (error: any) {
        console.error(error);
        alert("Errore durante l'inizializzazione del pagamento: " + (error.message || "Riprova più tardi"));
        setIsPurchasing(false);
    }
  };

  // --- ADMIN FUNCTIONS ---

  const handleDeleteCourse = async (courseId: string) => {
    if(!user?.is_admin) return;

    if(confirm("Sei sicuro di voler eliminare questo corso dal Database? L'operazione è irreversibile.")) {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);

        if (error) {
            alert("Errore eliminazione: " + error.message);
        } else {
            fetchCourses();
        }
    }
  };

  const handleSaveCourse = async (courseData: Course) => {
    if(!user?.is_admin) return;

    const { error } = await supabase
        .from('courses')
        .upsert(courseData)
        .select();

    if (error) {
        alert("Errore salvataggio: " + error.message);
    } else {
        fetchCourses();
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Caricamento MWA...</p>
        </div>
      );
  }

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={navigate} 
        logoSize={settings.logo_height}
      />
      
      <Routes>
        <Route path="/" element={
            <Home 
                courses={courses} 
                onCourseSelect={(id) => navigate(`/course/${id}`)}
                user={user}
                heroTitle={settings.home_hero_title}
                heroSubtitle={settings.home_hero_subtitle}
            />
        } />
        
        <Route path="/cart" element={
            <Cart user={user} />
        } />

        <Route path="/course/:id" element={
            <CourseWrapper 
                courses={courses} 
                user={user} 
                onPurchase={handlePurchase}
                isPurchasing={isPurchasing}
            />
        } />

        <Route path="/dashboard" element={
            user ? (
                <Dashboard 
                    user={user} 
                    courses={courses}
                    onRefresh={refreshUserData}
                />
            ) : <Navigate to="/login" />
        } />

        {/* ADMIN DASHBOARD */}
        <Route path="/admin" element={
            user?.is_admin ? (
                <AdminDashboard 
                    user={user}
                    courses={courses}
                    onDelete={handleDeleteCourse}
                    onRefresh={refreshUserData}
                    currentSettings={settings}
                    onUpdateSettings={handleUpdateSettings}
                />
            ) : <Navigate to="/" />
        } />
        
        {/* NUOVA ROTTA: EDITING CORSO */}
        <Route path="/admin/course/:id" element={
            user?.is_admin ? (
                <AdminEditCourse 
                    courses={courses}
                    onSave={handleSaveCourse}
                />
            ) : <Navigate to="/" />
        } />
        
        {/* Auth Routes */}
        <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : (
                <div className="min-h-screen pt-32 flex justify-center bg-gray-50 px-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md h-fit">
                        <h2 className="text-2xl font-bold mb-6 text-center">Accedi</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="tu@email.com" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" name="password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="******" />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors">Accedi</button>
                        </form>
                        <p className="mt-4 text-center text-sm text-gray-500">Non hai un account? <span onClick={() => navigate('/register')} className="text-brand-600 cursor-pointer font-bold hover:underline">Registrati</span></p>
                    </div>
                </div>
            )
        } />

        <Route path="/register" element={
             user ? <Navigate to="/dashboard" /> : (
                 <div className="min-h-screen pt-32 flex justify-center bg-gray-50 px-4">
                 <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md h-fit">
                     <h2 className="text-2xl font-bold mb-6 text-center">Crea Account</h2>
                     <form onSubmit={handleRegister}>
                         <div className="mb-4">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                             <input type="text" name="fullName" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Mario Rossi" />
                         </div>
                         <div className="mb-4">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                             <input type="email" name="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="tu@email.com" />
                         </div>
                         <div className="mb-6">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                             <input type="password" name="password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="******" minLength={6} />
                         </div>
                         <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors">Registrati Gratuitamente</button>
                     </form>
                     <p className="mt-4 text-center text-sm text-gray-500">Hai già un account? <span onClick={() => navigate('/login')} className="text-brand-600 cursor-pointer font-bold hover:underline">Accedi</span></p>
                 </div>
             </div>
             )
        } />
      </Routes>
    </>
  );
};

const CourseWrapper: React.FC<{courses: Course[], user: UserProfile | null, onPurchase: (id: string) => void, isPurchasing: boolean}> = ({ courses, user, onPurchase, isPurchasing }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); 
    
    const course = courses.find(c => c.id === id);

    if (!course && courses.length > 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="text-6xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Corso non trovato</h2>
                <p className="text-gray-500 mb-6">Il corso che cerchi potrebbe essere stato rimosso.</p>
                <button onClick={() => navigate('/')} className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    Torna alla Home
                </button>
            </div>
        );
    } else if (!course) {
        return null;
    }

    const isPurchased = user?.purchased_courses.includes(course.id) || false;

    return <CourseDetail 
        course={course} 
        onPurchase={() => onPurchase(course.id)} 
        isPurchased={isPurchased} 
        onBack={() => navigate('/')}
        user={user}
    />
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
};

export default App;
