import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { motion } from "framer-motion";
import Features from '../components/home/Features';
import Stats from '../components/home/Stats';
import Workflow from '../components/home/Workflow';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))]/30 font-sans">
            {/* Background Grid & Pattern */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.2] pointer-events-none"></div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[hsl(var(--background))]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-[hsl(var(--primary))]" />
                        <span className="font-bold text-xl tracking-tight">CodeLive</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
                        <a href="#workflow" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
                        <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">Stats</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium hover:text-[hsl(var(--primary))] transition-colors hidden sm:block">
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover-elevate border border-[hsl(var(--primary))]/50 min-h-9 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white font-medium shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Hero Background Orbs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[hsl(var(--primary))]/20 rounded-full blur-[100px]"></div>
                        <div className="absolute top-40 right-1/4 w-96 h-96 bg-[hsl(var(--accent))]/10 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-medium mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--primary))] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--primary))]"></span>
                                </span>
                                v1.0 is now live
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                                Code Together. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                                    Build Faster.
                                </span>{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]">
                                    Ship Smarter.
                                </span>
                            </h1>

                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                                The AI-driven collaborative IDE that turns your project into a living workspace. Built for teams who ship at the speed of thought.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover-elevate border border-white/10 min-h-10 rounded-md h-12 px-8 text-base bg-white text-black hover:bg-gray-100 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    Get Started for Free
                                </Link>
                                <Link to="/login" className="px-8 py-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800 transition-all font-semibold">
                                    Sign In
                                </Link>
                            </div>

                            {/* Hero Image */}
                            <div className="flex justify-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="relative rounded-lg border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden max-w-5xl mx-auto"
                                >
                                    {/* Window Title Bar */}
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#161b22]">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                        </div>
                                        <div className="ml-4 text-xs text-gray-400 font-mono">codelive-workspace</div>
                                    </div>

                                    {/* Image Content */}
                                    <img
                                        src="/hero-dashboard.png"
                                        alt="CodeLive Dashboard"
                                        className="w-full h-auto block"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid - Now using component */}
                <Features />

                {/* Stats Section */}
                <Stats />

                {/* Workflow Section */}
                <Workflow />

            </main>

            {/* Footer Branding */}
            <footer className="border-t border-white/5 py-12 bg-black relative z-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <Terminal size={20} className="text-[hsl(var(--primary))]" />
                            <span className="font-bold text-white tracking-widest uppercase">Codelive</span>
                        </div>

                        <div className="flex gap-8 text-sm text-gray-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="hover:text-white transition-colors">GitHub</a>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 text-sm text-gray-600">
                        © 2026 CodeLive Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;