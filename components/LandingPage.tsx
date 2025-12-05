import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, darkMode, toggleTheme }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'signin' | 'signup'>('signin');
  const [demoFocusMode, setDemoFocusMode] = useState(false);

  // Focus Mode Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoFocusMode(prev => !prev);
    }, 4000); // Toggle every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    // Simulate auth delay for "Real" feel
    setTimeout(() => {
      onLogin({
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=f59e0b&color=fff`
      });
      setLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
       onLogin({
        email: 'user@gmail.com',
        name: 'Google User',
        avatar: 'https://ui-avatars.com/api/?name=Google+User&background=DB4437&color=fff'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-neutral-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-500">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-cream-50/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-gold-200/30 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 p-2 rounded-xl text-white shadow-lg shadow-gold-500/20">
                <Icons.Edit3 size={20} className="fill-current" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-gray-900 dark:text-white">Better Writer</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 mr-4">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">How it Works</a>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>

            <Button size="md" onClick={() => setShowAuthModal(true)} className="rounded-full px-6">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-32 px-6 relative flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-gold-200/30 rounded-full blur-[100px] animate-pulse delay-700 dark:bg-gold-500/10" />
            <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-orange-100/40 rounded-full blur-[80px] animate-pulse dark:bg-orange-900/10" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gold-200 dark:border-white/10 text-gold-700 dark:text-gold-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
                <Icons.Sparkles size={14} />
                <span>AI-Powered Editor 2.0</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-900 dark:text-white mb-8 leading-[1.05] tracking-tight">
                Focus on the story,<br/>
                <span className="italic text-gold-600 dark:text-gold-500">we handle the rest.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                An elegant, distraction-free writing environment with an intelligent AI co-author that understands your plot, characters, and style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-gold-500/25 shadow-xl hover:shadow-2xl hover:shadow-gold-500/30 transform hover:-translate-y-1 transition-all" onClick={() => setShowAuthModal(true)}>
                    Start Writing Free
                </Button>
                <button className="h-14 px-8 text-lg text-gray-600 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                    <Icons.PlayCircle size={20} /> Watch Demo
                </button>
            </div>
        </div>

        {/* Animated Mockup with Focus Mode Preview */}
        <div className="mt-20 relative z-10 w-full max-w-5xl mx-auto transform hover:scale-[1.02] transition-transform duration-1000">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden relative">
                
                {/* Mockup Header - Fades in Focus Mode */}
                <div className={`h-8 bg-gray-50 dark:bg-neutral-900 border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-2 transition-opacity duration-700 ease-in-out ${demoFocusMode ? 'opacity-10' : 'opacity-100'}`}>
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>

                <div className="flex h-[400px]">
                    {/* Mockup Sidebar - Fades in Focus Mode */}
                    <div className={`w-48 bg-cream-50 dark:bg-neutral-900 border-r border-gray-100 dark:border-white/5 p-4 flex flex-col gap-3 transition-all duration-700 ease-in-out ${demoFocusMode ? 'opacity-0 -translate-x-10 w-0 p-0 overflow-hidden' : 'opacity-100'}`}>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded mt-4" />
                        <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded ml-4" />
                        <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded ml-4" />
                    </div>

                    {/* Mockup Content */}
                    <div className="flex-1 p-8 md:p-12 bg-white dark:bg-neutral-800 flex flex-col relative transition-all duration-700 ease-in-out">
                        <div className={`max-w-2xl w-full mx-auto transition-all duration-700 ease-in-out flex flex-col ${demoFocusMode ? 'items-center' : 'items-start'}`}>
                            {/* Title */}
                            <div className={`h-8 w-3/4 bg-gray-200 dark:bg-white/10 rounded mb-6 transition-all duration-700 ease-in-out ${demoFocusMode ? 'scale-110 mb-10' : ''}`} />
                            
                            {/* Text Paragraphs */}
                            <div className="space-y-4 w-full">
                                 <div className={`h-4 bg-gray-200 dark:bg-white/5 rounded transition-all duration-700 ease-in-out ${demoFocusMode ? 'opacity-10 w-[60%]' : 'opacity-100 w-full'}`} />
                                 <div className={`h-4 bg-gray-200 dark:bg-white/5 rounded transition-all duration-700 ease-in-out ${demoFocusMode ? 'opacity-10 w-[80%]' : 'opacity-100 w-[95%]'}`} />
                                 
                                 {/* Active Line in Focus Mode - Centered & Highlighted */}
                                 <div className={`h-4 bg-gray-800 dark:bg-white/30 rounded transition-all duration-700 ease-in-out ${demoFocusMode ? 'scale-110 shadow-lg w-[85%] mx-auto' : 'w-[90%]'}`} />
                                 
                                 <div className={`h-4 bg-gray-200 dark:bg-white/5 rounded transition-all duration-700 ease-in-out ${demoFocusMode ? 'opacity-10 w-[70%]' : 'opacity-100 w-[85%]'}`} />
                                 <div className={`h-4 bg-gray-200 dark:bg-white/5 rounded transition-all duration-700 ease-in-out ${demoFocusMode ? 'opacity-10 w-[50%]' : 'opacity-100 w-[88%]'}`} />
                            </div>

                            {/* Focus Mode Label Overlay */}
                            <div className={`absolute bottom-8 left-0 right-0 flex justify-center transition-all duration-700 delay-100 ${demoFocusMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                              <div className="bg-gold-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-gold-500/20">
                                Focus Mode Active
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Feature Grid */}
      <section id="features" className="py-32 bg-white dark:bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[
                    {
                        icon: Icons.Focus,
                        title: "Zen Focus Mode",
                        desc: "Our unique spotlight technology dims everything but the sentence you're currently crafting."
                    },
                    {
                        icon: Icons.Wand2,
                        title: "Context-Aware AI",
                        desc: "Unlike generic chatbots, Better Writer knows your characters, plot points, and tone."
                    },
                    {
                        icon: Icons.FolderOpen,
                        title: "Smart Organization",
                        desc: "Drag, drop, or let AI automatically sort your messy notes into logical chapters."
                    },
                    {
                        icon: Icons.BarChart2,
                        title: "Deep Analytics",
                        desc: "Visualize your pacing, tone consistency, and daily writing habits."
                    },
                    {
                        icon: Icons.BookOpen,
                        title: "Ebook Export",
                        desc: "Generate professional PDF and EPUB files ready for Amazon KDP instantly."
                    },
                    {
                        icon: Icons.Cloud,
                        title: "Secure Cloud",
                        desc: "Your manuscripts are encrypted and synced across all your devices in real-time."
                    }
                ].map((feature, i) => (
                    <div key={i} className="group">
                        <div className="w-14 h-14 bg-cream-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gold-600 dark:text-gold-400 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:bg-gold-500 group-hover:text-white">
                            <feature.icon size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white font-serif">{feature.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream-100 dark:bg-neutral-950 py-20 px-6 border-t border-gold-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-2">
                    <Icons.Edit3 size={24} className="text-gold-600" />
                    <span className="font-serif font-bold text-xl text-gray-900 dark:text-gray-200">Better Writer</span>
                </div>
                <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
                    Built for authors, by authors. The only writing tool you'll ever need.
                </p>
            </div>
            <div className="flex gap-8">
                <a href="#" className="text-gray-500 hover:text-gold-600 transition-colors"><Icons.Github size={24} /></a>
                <a href="#" className="text-gray-500 hover:text-gold-600 transition-colors"><Icons.Twitter size={24} /></a>
                <a href="#" className="text-gray-500 hover:text-gold-600 transition-colors"><Icons.Instagram size={24} /></a>
            </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cream-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                            {authStep === 'signin' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <Icons.X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                placeholder="name@example.com"
                            />
                        </div>
                        
                        {authStep === 'signup' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <Button className="w-full py-4 text-base rounded-xl font-bold shadow-lg shadow-gold-500/20" isLoading={loading}>
                            {authStep === 'signin' ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-neutral-700"></div></div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-neutral-800 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 dark:border-neutral-600 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-gray-700 dark:text-gray-200 font-medium group"
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        {authStep === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setAuthStep(authStep === 'signin' ? 'signup' : 'signin')}
                            className="text-gold-600 hover:text-gold-700 font-bold"
                        >
                            {authStep === 'signin' ? 'Create one' : 'Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};