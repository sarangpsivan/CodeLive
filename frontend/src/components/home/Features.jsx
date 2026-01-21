import React from 'react';
import { motion } from "framer-motion";
import { Users, Bot, Terminal, FileText, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

// Removed staggered container variants
// Only individual item fade-in remains (optional, or just plain CSS)

export default function Features() {
    return (
        <section id="features" className="py-24 relative">
            <div className="container mx-auto px-6">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
                        Everything you need <br />
                        <span className="text-gray-500">to build the future.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1: Real-Time Sync */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-white/10 bg-[#1F242A]/40 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Users className="w-24 h-24 text-purple-600/10 group-hover:text-purple-600/20 transition-colors" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-6 text-purple-500 border border-purple-600/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">Real-Time Sync</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Experience a "Google Docs for Code" workflow. Multiple developers editing the same file, cursor awareness, and zero latency conflict resolution.
                        </p>
                    </motion.div>

                    {/* Feature 2: AI Brain */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-purple-600/20 bg-purple-600/5 overflow-hidden"
                    >
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/30 rounded-full blur-[50px]" />
                        <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-6 text-purple-500 border border-purple-600/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">Context-Aware AI Brain</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Our RAG-powered AI indexes all project files to understand your entire codebase. Ask questions, generate boilerplate, and refactor with full context awareness.
                        </p>
                    </motion.div>

                    {/* Feature 3: Team Chat */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-white/10 bg-[#1F242A]/40 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <MessageSquare className="w-24 h-24 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-6 text-cyan-500 border border-cyan-500/20">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">In-Editor Team Chat</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Communicate instantly without leaving your workspace. Contextual threads allow you to discuss specific files and code blocks with your team in real-time.
                        </p>
                    </motion.div>

                    {/* Feature 4: Alert Panel */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-white/10 bg-[#1F242A]/40 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <AlertTriangle className="w-24 h-24 text-orange-500/10 group-hover:text-orange-500/20 transition-colors" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-6 text-orange-500 border border-orange-500/20">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">Review Alert Panel</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Streamline feedback loops. Viewers can raise priority alerts on specific lines, while editors and owners can resolve them in a unified triage dashboard.
                        </p>
                    </motion.div>

                    {/* Feature 5: Integrated Documentation */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-white/10 bg-[#1F242A]/40 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <FileText className="w-24 h-24 text-purple-600/10 group-hover:text-purple-600/20 transition-colors" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-6 text-purple-500 border border-purple-600/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">Integrated Documentation</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Create, edit, and view technical documentation right alongside your code. Keep your project's knowledge base synced and accessible to the whole team.
                        </p>
                    </motion.div>

                    {/* Feature 6: Terminal Preview */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="group relative p-8 rounded-2xl glass-card border border-white/10 bg-[#1F242A]/40 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Terminal className="w-24 h-24 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-6 text-cyan-500 border border-cyan-500/20">
                            <Terminal className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 font-display">Instant Live Preview</h3>
                        <p className="text-gray-400 leading-relaxed">
                            See changes instantly with our terminal-style preview. Hot Module Replacement (HMR) built-in for a seamless feedback loop.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
