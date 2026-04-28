import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, MessageSquare, ShieldCheck, LogIn, LogOut, User, Bot, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import SumerAI from './SumerAI';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we clear any existing auth promises to avoid assertion errors
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setLoginError('تم حظر النافذة المنبثقة. يرجى السماح بالبث المنبثق في متصفحك أو فتح الموقع في نافذة جديدة.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setLoginError('هناك طلب تسجيل دخول قيد المعالجة بالفعل.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setLoginError('تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية.');
      } else {
        setLoginError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {!isHome && (
              <button
                id="back-button"
                onClick={() => navigate(-1)}
                className="group flex items-center justify-center rounded-full p-2 transition-colors hover:bg-white/5"
                aria-label="Back"
              >
                <ChevronRight className="h-6 w-6 text-slate-400 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <div 
              id="brand" 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none tracking-tight sm:text-xl text-white">
                  نتائجنا <span className="font-mono text-xs font-medium text-slate-500">Nataijna</span>
                </h1>
                <p className="text-[10px] text-slate-500 sm:text-xs">نظام إدارة النتائج التعليمية</p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-6">
            <button
              id="nav-home"
              onClick={() => navigate('/')}
              className={cn(
                "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors sm:text-sm",
                isHome ? "text-blue-400" : "text-slate-500 hover:text-white"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
            <button
              id="nav-sumer"
              onClick={() => {
                navigate('/sumer');
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors sm:text-sm",
                location.pathname === '/sumer' ? "text-purple-400" : "text-slate-500 hover:text-white"
              )}
            >
              <Bot className="h-5 w-5" />
              <span className="hidden sm:inline">سومر AI</span>
            </button>

            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-1 p-2 text-xs font-medium text-slate-500 hover:text-red-400 transition-colors sm:text-sm"
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
                <div className="hidden items-center gap-2 rounded-full bg-white/5 pl-3 pr-1 py-1 border border-white/5 sm:flex">
                  <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">{user.displayName?.split(' ')[0]}</span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900/50 text-blue-400 border border-blue-500/20">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center gap-2 rounded-xl bg-blue-600/10 px-4 py-2 text-xs font-bold text-blue-400 transition-all hover:bg-blue-600/20 border border-blue-600/20 sm:text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  <span>{isLoggingIn ? 'جاري الدخول...' : 'دخول'}</span>
                </button>
                
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute top-full mt-4 flex w-64 -translate-x-1/2 left-1/2 flex-col gap-3 rounded-2xl border border-red-500/30 bg-slate-900 p-4 shadow-2xl z-[100]"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                        <p className="text-xs font-bold leading-relaxed text-red-200">
                          {loginError}
                        </p>
                      </div>
                      <button 
                        onClick={() => setLoginError(null)}
                        className="rounded-lg bg-red-500/10 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        فهمت
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "mx-auto w-full transition-all duration-300",
        location.pathname === '/sumer' 
          ? "max-w-none px-0 py-0 h-[calc(100vh-4rem)]" 
          : "max-w-7xl px-4 py-8 sm:px-6"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global AI Assistant */}
      {location.pathname !== '/sumer' && <SumerAI />}
 
      {/* Footer */}
      {location.pathname !== '/sumer' && (
        <footer className="mt-auto border-t border-white/5 bg-slate-900 py-10">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
            <p className="text-sm text-slate-500 font-medium">
              © {new Date().getFullYear()} نتائجنا - المنصة التعليمية المتطورة
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-slate-600">
              <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5">STORAGE: 13B GB</span>
              <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5">CLOUD SECURED</span>
              <span className="h-1 w-1 rounded-full bg-slate-800"></span>
              <span className="text-purple-500/60 uppercase">AI Sumer Enterprise ready</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
