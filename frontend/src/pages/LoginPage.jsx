import React, { useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const [isLoading, setIsLoading] = React.useState(false);

    // Trap browser back button to redirect to Home
    useEffect(() => {
        window.history.pushState(null, '', window.location.pathname);
        const onPopState = () => navigate('/');
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const username = e.target.email.value;
        const password = e.target.password.value;
        try {
            await loginUser(username, password);
        } catch (error) {
            console.error("Login caught error", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))]/30 font-sans flex items-center justify-center relative overflow-hidden p-6">
            {/* Background Grid & Pattern */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.2] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl h-[600px] flex rounded-3xl overflow-hidden glass-card shadow-2xl relative z-10"
            >
                {/* Left Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative bg-[hsl(var(--background))]/50 backdrop-blur-xl">

                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold font-display mb-2">Hello Again!</h1>
                            <p className="text-gray-400 text-sm">Welcome back you've been missed!</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm"
                                    required
                                />
                                {/* Recovery link removed as per request */}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 font-semibold text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-xl transition-all shadow-lg hover:shadow-[hsl(var(--primary))]/20 hover:-translate-y-0.5 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="flex items-center my-6">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="px-3 text-[10px] text-gray-600 uppercase tracking-widest">Or continue with</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <a href={`${apiBaseUrl}/accounts/google/login/`} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors tooltip" title="Google">
                                <FaGoogle className="text-xl" />
                            </a>
                            <a href={`${apiBaseUrl}/accounts/github/login/`} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors tooltip" title="GitHub">
                                <FaGithub className="text-xl" />
                            </a>
                        </div>

                        <p className="text-xs text-center text-gray-500 mt-8">
                            Don't have an account? <Link to="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">Sign up</Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Art */}
                <div className="hidden md:flex w-1/2 bg-[hsl(var(--primary))]/5 relative overflow-hidden items-center justify-center p-8">
                    {/* Abstract Art Elements */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[hsl(var(--primary))]/20 via-transparent to-[hsl(var(--accent))]/10 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-[hsl(var(--primary))]/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[hsl(var(--accent))]/20 rounded-full blur-[80px]" />

                    {/* Improved Animation: Floating instead of tilting */}
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10 p-8 glass-card rounded-2xl border border-white/10 max-w-sm text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--primary))]/20 flex items-center justify-center mx-auto mb-6 text-[hsl(var(--primary))]">
                            <Terminal className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold font-display mb-3">Code Together</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Join thousands of developers building the future with real-time collaboration and AI assistance.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;