
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetail } from './pages/CourseDetail';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEditCourse } from './pages/AdminEditCourse';
import { Cart } from './pages/Cart';
import { Login } from './pages/Login';
import { UpdatePassword } from './pages/UpdatePassword';
import { PaymentSuccess } from './pages/PaymentSuccess'; // IMPORT NUOVO
import { UserProfile, Course, PlatformSettings } from './types';
import { supabase, createCheckoutSession } from './services/supabase';
import { CartProvider } from './contexts/CartContext';
import { initMetaPixel, trackPageView, trackCompleteRegistration } from './services/metaPixel';

// --- TOKEN INTERCEPTOR ---
const TokenInterceptor: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [status, setStatus] = useState<'idle' | 'processing'>('idle');

    useEffect(() => {
        const processToken = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                setStatus('processing');
                try {
                    const tokenPart = hash.substring(hash.indexOf('access_token'));
                    const params = new URLSearchParams(tokenPart);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');
                    const type = params.get('type');
                    
                    if (accessToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '', 
                        });
                        if (error) throw error;
                        
                        // SE ARRIVIAMO DA UN MAGIC LINK (Auto-Login), mandiamo alla dashboard
                        // ma controlliamo se dobbiamo forzare il cambio password
                        if (type === 'recovery' || type === 'invite') {
                             localStorage.setItem('mwa_force_password_update', 'true');
                        } else if (type === 'magiclink') {
                             // È l'auto-login!
                             localStorage.setItem('mwa_auth_redirect', '/dashboard');
                        } else {
                            localStorage.setItem('mwa_auth_redirect', '/dashboard');
                        }
                        window.history.replaceState(null, '', window.location.pathname);
                    }
                } catch (e: any) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
            onFinish();
        };
        processToken();
    }, [onFinish]);

    if (status === 'processing') return <div className="min-h-screen bg-slate-900"></div>;
    return null;
};

// --- APP CONTENT ---
const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const [settings, setSettings] = useState<PlatformSettings>({
      id: 1, logo_height: 64, logo_alignment: 'left', logo_margin_left: 0, 
      home_hero_title: '', home_hero_subtitle: '', meta_pixel_id: '', font_family: 'Inter'
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const firstLoad = useRef(true);

  // Nascondi navbar in queste pagine
  const hideNavbar = ['/login', '/update-password', '/payment-success'].includes(location.pathname);

  // --- REDIRECT LOGIC ---
  useEffect(() => {
      const forceUpdate = localStorage.getItem('mwa_force_password_update');
      if (forceUpdate === 'true') {
          localStorage.removeItem('mwa_force_password_update'); 
          navigate('/update-password', { replace: true });
          return;
      }
      const pendingRedirect = localStorage.getItem('mwa_auth_redirect');
      if (pendingRedirect && user) {
          localStorage.removeItem('mwa_auth_redirect');
          navigate(pendingRedirect, { replace: true });
      }
  }, [navigate, user]);

  // --- FONT & PIXEL ---
  useEffect(() => {
    if (settings.font_family) {
        const linkId = 'dynamic-font-link';
        let link = document.getElementById(linkId) as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; document.head.appendChild(link);
        }
        link.href = `https://fonts.googleapis.com/css2?family=${settings.font_family.replace(/ /g, '+')}:wght@300;400;600;700;900&display=swap`;
        const styleId = 'dynamic-font-style';
        let style = document.getElementById(styleId) as HTMLStyleElement;
        if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style); }
        style.innerHTML = `body, .font-sans { font-family: '${settings.font_family}', sans-serif !important; }`;
    }
  }, [settings.font_family]);

  useEffect(() => { if (settings.meta_pixel_id) initMetaPixel(settings.meta_pixel_id); }, [settings.meta_pixel_id]);
  useEffect(() => { if (!firstLoad.current) trackPageView(); firstLoad.current = false; }, [location]);

  // --- DATA FETCHING ---
  const fetchCourses = async () => {
    try {
      const { data } = await supabase.from('courses').select('*').order('title', { ascending: true });
      if (data) setCourses(data as Course[]);
    } catch (err) {}
  };
  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (err) { }
  };
  const handleUpdateSettings = async (newSettings: PlatformSettings) => {
    setSettings(newSettings); 
    const { error } = await supabase.from('platform_settings').upsert(newSettings);
    if (error) throw error;
  };

  const refreshUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUser(null); setLoading(false); return; }

    try {
        let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profileError && profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase.from('profiles').insert([{ id: session.user.id, full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0], is_admin: false }]).select().single();
            if (!createError) profile = newProfile;
        }
        const { data: purchases } = await supabase.from('purchases').select('course_id').eq('user_id', session.user.id);
        const purchasedCourseIds = purchases ? purchases.map(p => p.course_id) : [];

        setUser({ id: session.user.id, email: session.user.email!, full_name: profile?.full_name || session.user.email!.split('@')[0], is_admin: profile?.is_admin || false, purchased_courses: purchasedCourseIds });
    } catch (error) { console.error("Error loading user data:", error); } finally { setLoading(false); }
  }, []);

  // --- AUTH LISTENER ---
  useEffect(() => {
    let mounted = true;
    fetchCourses(); fetchSettings();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mounted) {
             if(event === 'PASSWORD_RECOVERY') { navigate('/update-password', { replace: true }); return; }
             if (event === 'SIGNED_IN' || session) refreshUserData();
             else { setUser(null); setLoading(false); }
        }
    });
    refreshUserData();
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [refreshUserData, navigate]);

  const handleRegister = async (e: React.FormEvent) => { e.preventDefault(); alert("Per registrarti, acquista un corso. Riceverai le credenziali via email."); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); navigate('/'); };

  const handlePurchase = async (courseId: string) => {
    if (isPurchasing) return;
    let userId = undefined; let userEmail = undefined;
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) { userId = session.user.id; userEmail = session.user.email; }
    try {
        setIsPurchasing(true);
        const response = await createCheckoutSession([courseId], userId, userEmail);
        if (response && response.url) window.location.href = response.url;
        else throw new Error("URL di pagamento non ricevuto");
    } catch (error: any) { alert("Errore pagamento: " + (error.message || "Riprova")); setIsPurchasing(false); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if(!user?.is_admin) return;
    if(confirm("Eliminare?")) { const { error } = await supabase.from('courses').delete().eq('id', courseId); if (error) alert(error.message); else fetchCourses(); }
  };
  const handleSaveCourse = async (courseData: Course) => {
    if(!user?.is_admin) return;
    const { error } = await supabase.from('courses').upsert(courseData).select();
    if (error) alert(error.message); else fetchCourses();
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>;

  return (
    <>
      {!hideNavbar && (
        <Navbar user={user} onLogout={handleLogout} onNavigate={navigate} logoSize={settings.logo_height} logoAlignment={settings.logo_alignment || 'left'} logoMarginLeft={settings.logo_margin_left || 0} />
      )}
      <Routes>
        <Route path="/" element={<Home courses={courses} onCourseSelect={(id) => navigate(`/course/${id}`)} user={user} landingConfig={settings.landing_page_config} />} />
        <Route path="/courses" element={<CoursesPage courses={courses} onCourseSelect={(id) => navigate(`/course/${id}`)} user={user} />} />
        <Route path="/cart" element={<Cart user={user} />} />
        <Route path="/course/:id" element={<CourseWrapper courses={courses} user={user} onPurchase={handlePurchase} isPurchasing={isPurchasing} />} />
        
        {/* NUOVA ROTTA SUCCESS */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        
        <Route path="/dashboard" element={user ? <Dashboard user={user} courses={courses} onRefresh={refreshUserData} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.is_admin ? <AdminDashboard user={user} courses={courses} onDelete={handleDeleteCourse} onRefresh={refreshUserData} currentSettings={settings} onUpdateSettings={handleUpdateSettings} /> : <Navigate to="/" />} />
        <Route path="/admin/course/:id" element={user?.is_admin ? <AdminEditCourse courses={courses} onSave={handleSaveCourse} /> : <Navigate to="/" />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : (
             <div className="min-h-screen pt-32 flex justify-center bg-gray-50 px-4">
                 <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md h-fit text-center">
                     <h2 className="text-2xl font-bold mb-4">Crea Account</h2>
                     <p className="text-gray-500 mb-6">Per registrarti, acquista un corso.</p>
                     <button onClick={() => navigate('/')} className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold">Vedi Corsi</button>
                 </div>
             </div>
        )} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const CourseWrapper: React.FC<{courses: Course[], user: UserProfile | null, onPurchase: (id: string) => void, isPurchasing: boolean}> = ({ courses, user, onPurchase, isPurchasing }) => {
    const navigate = useNavigate(); const { id } = useParams<{ id: string }>(); const course = courses.find(c => c.id === id);
    if (!course) return null;
    const isPurchased = user?.purchased_courses.includes(course.id) || false;
    return <CourseDetail course={course} onPurchase={() => onPurchase(course.id)} isPurchased={isPurchased} onBack={() => navigate('/')} user={user} />
};

const App: React.FC = () => {
  const [tokenProcessed, setTokenProcessed] = useState(false);
  return (
    <CartProvider>
        {!tokenProcessed && <TokenInterceptor onFinish={() => setTokenProcessed(true)} />}
        {tokenProcessed && <Router><AppContent /></Router>}
    </CartProvider>
  );
};

export default App;
