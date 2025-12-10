import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

interface LandingPageProps {
    onStart: () => void;
    darkMode: boolean;
    toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, darkMode, toggleTheme }) => {
    const [demoFocusMode, setDemoFocusMode] = useState(false);

    // Focus Mode Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setDemoFocusMode(prev => !prev);
        }, 4000); // Toggle every 4 seconds
        return () => clearInterval(interval);
    }, []);

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

                        <Button size="md" onClick={onStart} className="rounded-2xl px-6">
                            Start Writing
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
                        <span>Free, forever.</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-900 dark:text-white mb-8 leading-[1.05] tracking-tight">
                        Focus on the story,<br />
                        <span className="italic text-gold-600 dark:text-gold-500">we handle the rest.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                        An elegant, distraction-free writing environment.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-gold-500/25 shadow-xl hover:shadow-2xl hover:shadow-gold-500/30 transform hover:-translate-y-1 transition-all" onClick={onStart}>
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

            {/* How it Works Section */}
            <section id="how-it-works" className="py-32 bg-cream-50 dark:bg-neutral-900 border-t border-gold-200/50 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">How it Works</h2>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">From messy thoughts to polished manuscript in three simple steps.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="text-9xl font-serif font-bold text-gold-100 dark:text-white/5 absolute -top-10 -left-6 z-0 select-none transition-colors group-hover:text-gold-200 dark:group-hover:text-white/10">1</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-gold-600 transition-colors">Write Distraction Free</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Enter our Zen Mode. The interface fades away, leaving only you and your words so you can focus on the flow.</p>
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="text-9xl font-serif font-bold text-gold-100 dark:text-white/5 absolute -top-10 -left-6 z-0 select-none transition-colors group-hover:text-gold-200 dark:group-hover:text-white/10">2</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-gold-600 transition-colors">Intuitive Organization</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Keep your work structured with our flexible file system. Drag, drop, and nest folders to match your thought process.</p>
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="text-9xl font-serif font-bold text-gold-100 dark:text-white/5 absolute -top-10 -left-6 z-0 select-none transition-colors group-hover:text-gold-200 dark:group-hover:text-white/10">3</div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-gold-600 transition-colors">Export & Publish</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Download your work as a perfectly formatted PDF, EPUB, or DOCX ready for Amazon KDP or agents.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About & Pricing Section */}
            <section id="about" className="py-32 bg-white dark:bg-black/20 border-t border-gold-200/50 dark:border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">

                    <div className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Icons.Heart size={14} />
                            <span>Open Source</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-8">Better Tools for Everyone</h2>
                        <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                            BetterWriter is made by the <span className="text-gold-600 dark:text-gold-500 font-bold">BetterThings Org</span>.
                            We provide free open source tools for everyone, that will be free forever, without paywalls.
                        </p>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            We sustain the business only from donations from users like you who believe in our mission.
                        </p>
                    </div>

                    <div className="bg-cream-50 dark:bg-neutral-900 rounded-3xl p-12 border border-gold-200 dark:border-white/10 shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">Support Our Mission</h3>
                        <div className="text-5xl font-bold text-gold-600 dark:text-gold-500 mb-6 font-serif">$0 <span className="text-lg text-gray-400 font-sans font-normal">/ month</span></div>

                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Enjoy all features including AI tools, cloud sync, and export formats completely free.
                        </p>

                        <div className="flex justify-center">
                            <Button size="lg" className="h-14 px-12 text-lg rounded-2xl shadow-gold-500/25 shadow-xl hover:shadow-2xl hover:shadow-gold-500/30 transition-all">
                                Donate Now
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Secure payment via Stripe. Tax deductible.</p>
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
        </div >
    );
};