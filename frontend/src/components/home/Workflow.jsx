import React from 'react';
import { UserPlus, FolderTree, Code } from 'lucide-react';
import { motion } from "framer-motion";

const steps = [
    {
        step: "01",
        title: "Authenticate",
        description: "Securely log in via GitHub or Email. Your identity keys your workspace access.",
        icon: UserPlus,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        blobColor: "bg-blue-500/20"
    },
    {
        step: "02",
        title: "Organize",
        description: "Create folders and files in a robust hierarchy. Drag, drop, and structure your app.",
        icon: FolderTree,
        color: "text-purple-500",
        bgColor: "bg-purple-600/10", // Using purple-600 to match primary theme
        borderColor: "border-purple-600/20",
        blobColor: "bg-purple-600/20"
    },
    {
        step: "03",
        title: "Collaborate",
        description: "Invite team members via the membership system. Cursor syncs instantly.",
        icon: Code,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        blobColor: "bg-emerald-500/20"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2, // Increased delay for distinct steps
            delayChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -30 }, // Slightly more movement for emphasis
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Workflow() {
    return (
        <section id="workflow" className="py-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-background to-background pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                        How CodeLive Works
                    </h2>
                    <p className="text-gray-400 text-lg">
                        From idea to deployment in three simple steps.
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {steps.map((stepItem, index) => (
                        <motion.div
                            variants={item}
                            key={index}
                            className={`group relative p-8 rounded-2xl border ${stepItem.borderColor} ${stepItem.bgColor} backdrop-blur-sm overflow-hidden hover:border-opacity-50 transition-all duration-300`}
                        >
                            {/* Hover Gradient Blob */}
                            <div className={`absolute top-0 right-0 w-64 h-64 ${stepItem.blobColor} rounded-full blur-[80px] opacity-0 group-hover:opacity-50 transition-opacity duration-500 -mr-20 -mt-20`} />

                            <div className={`w-14 h-14 rounded-xl ${stepItem.bgColor} border ${stepItem.borderColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                <stepItem.icon className={`w-7 h-7 ${stepItem.color}`} />
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Step {stepItem.step}</span>
                                <h3 className="text-2xl font-bold font-display mt-2">{stepItem.title}</h3>
                            </div>

                            <p className="text-gray-400 leading-relaxed">
                                {stepItem.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
