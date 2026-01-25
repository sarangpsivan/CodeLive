import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { Terminal, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Trap browser back button to redirect to Home
    React.useEffect(() => {
        window.history.pushState(null, '', window.location.pathname);
        const onPopState = () => navigate('/');
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [navigate]);

    // State for inputs
    const [password, setPassword] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Email state
    const [email, setEmail] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullName = e.target.fullName.value;
        const emailInput = e.target.email.value;
        const passwordInput = e.target.password.value;
        const password2Input = e.target.password2.value;

        if (passwordInput !== password2Input) {
            alert('Passwords do not match!');
            return;
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(passwordInput)) {
            alert('Please meet all password requirements.');
            return;
        }

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        try {
            await axios.post(`${apiBaseUrl}/api/register/`, {
                email: emailInput,
                password: passwordInput,
                first_name: firstName,
                last_name: lastName || ""
            });
            navigate('/login');
        } catch (error) {
            console.error('Registration failed!', error);
            alert('Registration failed. This email may already be taken.');
        }
    };

    // Password validation checks
    const checks = [
        { label: "8+ characters", valid: password.length >= 8 },
        { label: "1 uppercase", valid: /[A-Z]/.test(password) },
        { label: "1 lowercase", valid: /[a-z]/.test(password) },
        { label: "1 number", valid: /\d/.test(password) },
        { label: "1 symbol", valid: /[@$!%*?&]/.test(password) },
    ];

    const allValid = checks.every(c => c.valid);

    // Email validation checks
    const emailChecks = [
        { label: "Valid format (user@domain.com)", valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) },
        { label: "No spaces", valid: !/\s/.test(email) && email.length > 0 }
    ];

    const emailValid = emailChecks.every(c => c.valid);

    return (
        <div className="h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))]/30 font-sans flex items-center justify-center relative overflow-hidden p-6">
            {/* Background Grid & Pattern */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.2] pointer-events-none"></div>




            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl h-[700px] flex rounded-3xl overflow-hidden glass-card shadow-2xl relative z-10"
            >
                {/* Left Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative bg-[hsl(var(--background))]/50 backdrop-blur-xl overflow-y-auto scrollbar-hide">

                    <div className="max-w-sm mx-auto w-full mt-10 md:mt-0">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold font-display mb-2">Create Account</h1>
                            <p className="text-gray-400 text-sm">Join CodeLive to build faster.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 ml-1">Full Name</label>
                                <input type="text" name="fullName" placeholder="Enter your full name" className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm" required />
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setIsEmailFocused(true)}
                                    onBlur={() => { if (email.length === 0) setIsEmailFocused(false) }}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm"
                                    required
                                />

                                {/* Floating Email Rules Popup */}
                                <AnimatePresence>
                                    {(isEmailFocused || email.length > 0) && !emailValid && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full left-0 mb-3 w-full bg-[#1F242A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20"
                                        >
                                            <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-[#1F242A] border-b border-r border-white/10 rotate-45"></div>
                                            <div className="text-xs font-semibold text-gray-300 mb-2">Email Requirements</div>
                                            <div className="space-y-1.5">
                                                {emailChecks.map((check, i) => (
                                                    <div key={i} className={`flex items-center text-[11px] transition-colors ${check.valid ? 'text-green-400' : 'text-gray-500'}`}>
                                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center mr-2 border ${check.valid ? 'bg-green-500/10 border-green-500/50' : 'border-gray-600 bg-transparent'}`}>
                                                            {check.valid && <Check className="w-2 h-2" />}
                                                        </div>
                                                        {check.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-medium text-gray-400 ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    // Blur handler to potentially close tooltip if empty, but keeping it simple for now
                                    onBlur={() => { if (password.length === 0) setIsPasswordFocused(false) }}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm"
                                    required
                                />

                                {/* Floating Password Rules Popup */}
                                <AnimatePresence>
                                    {(isPasswordFocused || password.length > 0) && !allValid && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute bottom-full left-0 mb-3 w-full bg-[#1F242A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20"
                                        >
                                            <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-[#1F242A] border-b border-r border-white/10 rotate-45"></div>
                                            <div className="text-xs font-semibold text-gray-300 mb-2">Password Requirements</div>
                                            <div className="space-y-1.5">
                                                {checks.map((check, i) => (
                                                    <div key={i} className={`flex items-center text-[11px] transition-colors ${check.valid ? 'text-green-400' : 'text-gray-500'}`}>
                                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center mr-2 border ${check.valid ? 'bg-green-500/10 border-green-500/50' : 'border-gray-600 bg-transparent'}`}>
                                                            {check.valid && <Check className="w-2 h-2" />}
                                                        </div>
                                                        {check.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 ml-1">Confirm Password</label>
                                <input type="password" name="password2" placeholder="Confirm your password" className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]/50 focus:ring-1 focus:ring-[hsl(var(--primary))]/50 transition-all text-white placeholder-gray-600 text-sm" required />
                            </div>
                            <button type="submit" className="w-full py-3.5 font-semibold text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-xl transition-all shadow-lg hover:shadow-[hsl(var(--primary))]/20 hover:-translate-y-0.5 mt-2">
                                Create Account
                            </button>
                        </form>

                        <div className="flex items-center my-6">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="px-3 text-[10px] text-gray-600 uppercase tracking-widest">Or with</span>
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
                            Already have an account? <Link to="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Art */}
                <div className="hidden md:flex w-1/2 bg-[hsl(var(--primary))]/5 relative overflow-hidden items-center justify-center p-8">
                    {/* Abstract Art Elements */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[hsl(var(--primary))]/20 via-transparent to-[hsl(var(--accent))]/10 pointer-events-none" />
                    <div className="absolute top-20 right-20 w-80 h-80 bg-[hsl(var(--accent))]/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[hsl(var(--primary))]/30 rounded-full blur-[80px]" />

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
                        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent))]/20 flex items-center justify-center mx-auto mb-6 text-[hsl(var(--accent))]">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold font-display mb-3">Start Building</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Everything you need to go from idea to deployment in record time. No setup required.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;