import React from 'react';
import { Link } from 'react-router-dom';
import { FaCode, FaUsers, FaBolt } from 'react-icons/fa';

const FeatureCard = ({ icon, title, children, featured = false }) => (
    <div className={`bg-[var(--dark-card)] p-8 rounded-2xl border border-gray-800 hover:border-[var(--primary-purple)] transition ${
        featured ? 'shadow-[0_0_25px_rgba(131,140,229,0.3)] border-[var(--accent-blue)]' : ''
    }`}>
        <div className="text-4xl text-[var(--primary-purple)] mb-4">{icon}</div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const HomePage = () => {
    return (
        <div className="bg-[var(--dark-bg)] text-white min-h-screen font-sans">
            <header className="container mx-auto p-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">CodeLive</h1>
                <div>
                    <Link to="/login" className="mr-4 hover:text-[var(--accent-lavender)]">Login</Link>
                    <Link to="/register" className="px-5 py-2 font-bold text-white bg-[var(--primary-purple)] rounded-lg hover:brightness-110 transition">Create Account</Link>
                </div>
            </header>

            <main className="container mx-auto text-center px-6 py-24">
                <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[var(--accent-lavender)] to-[var(--accent-blue)] bg-clip-text text-transparent pb-4">
                    Build. Collaborate. Deploy.
                </h2>
                <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
                    CodeLive is a modern development platform that brings teams together to create amazing applications with real-time collaboration.
                </p>
                <div>
                    <Link to="/register" className="px-8 py-4 font-bold text-white bg-[var(--primary-purple)] rounded-lg hover:brightness-110 transition mr-4">Get Started</Link>
                    <Link to="/login" className="px-8 py-4 font-bold bg-dark-card rounded-lg hover:bg-gray-800 transition">Sign In</Link>
                </div>
            </main>

            <section className="container mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8">
                <FeatureCard icon={<FaCode />} title="Real-time Coding">
                    Write code together with your team in real-time with advanced collaboration features and live cursors.
                </FeatureCard>
                <FeatureCard icon={<FaUsers />} title="Team Collaboration" featured={true}>
                    Invite team members, share projects, and work together seamlessly with real-time sync across all devices.
                </FeatureCard>
                <FeatureCard icon={<FaBolt />} title="Lightning Fast">
                    Build and ship faster than ever with our optimized development environment and instant hot reloading.
                </FeatureCard>
            </section>
        </div>
    );
};

export default HomePage;