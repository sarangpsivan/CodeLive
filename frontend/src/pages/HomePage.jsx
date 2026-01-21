import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Code2, Users, Zap, Shield, Globe } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 mb-8 animate-fade-in">
            <Zap size={16} />
            <span className="text-sm font-medium">Real-time collaboration is here</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Code Together. <br />
            <span className="text-purple-500">Build Faster.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10">
            Experience the next generation of collaborative coding. Create, share, and build projects with your team in real-time with our integrated IDE.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all font-semibold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              Get Started for Free
            </Link>
            <Link to="/login" className="px-8 py-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800 transition-all font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Code2 className="text-purple-500" />}
            title="Advanced Editor"
            description="Powerful Monaco-based editor with syntax highlighting for 50+ languages."
          />
          <FeatureCard 
            icon={<Users className="text-blue-500" />}
            title="Live Collaboration"
            description="See your teammates' cursors and edits instantly with zero latency."
          />
          <FeatureCard 
            icon={<Shield className="text-emerald-500" />}
            title="Secure Sandboxes"
            description="Isolated environments to run and test your code safely in the cloud."
          />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="border-t border-gray-900 py-12 text-center text-gray-500">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Terminal size={20} className="text-purple-500" />
          <span className="font-bold text-white tracking-widest uppercase">Codelive</span>
        </div>
        <p className="text-sm">© 2026 Codelive. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm hover:border-purple-500/50 transition-colors group">
    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default HomePage;