import React from 'react';
import { motion } from "framer-motion";

const stats = [
    { value: "12,450+", label: "USERS REGISTERED" },
    { value: "8,320", label: "ACTIVE PROJECTS" },
    { value: "1.2M+", label: "FILES MANAGED" },
    { value: "45M+", label: "LINES OF CODE" },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Stats() {
    return (
        <section id="stats" className="py-24 border-y border-white/5 bg-[#050505]">
            <div className="container mx-auto px-6">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {stats.map((stat, index) => (
                        <motion.div variants={item} key={index} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-xs text-gray-400 font-medium tracking-widest uppercase">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
