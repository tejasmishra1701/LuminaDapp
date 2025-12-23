'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { FuelMeter } from '@/components/FuelMeter';
import { Zap, Bot, Image as ImageIcon, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-obsidian selection:bg-radiant-orange/30">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />

      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-radiant-orange rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,140,0,0.5)]">
            <Zap className="text-obsidian w-5 h-5 fill-current" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">LUMINA <span className="text-radiant-orange">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <FuelMeter balance={75} />
          <ConnectButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block px-4 py-1.5 mb-6 border border-radiant-orange/20 rounded-full bg-radiant-orange/5 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-radiant-orange uppercase tracking-wider">Powered by Monad Sepolia</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-black text-white tracking-tight mb-8"
        >
          AI Intelligence.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-radiant-orange to-orange-400">Radiant Efficiency.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-neutral-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
        >
          Experience the world's most premium AI DApp. High-contrast design meets ultra-fast Monad execution.
          Fuel your intelligence with MON.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row gap-4 items-center"
        >
          <button className="px-8 py-4 bg-radiant-orange text-obsidian font-bold rounded-xl shadow-[0_0_30px_rgba(255,140,0,0.3)] hover:shadow-[0_0_40px_rgba(255,140,0,0.5)] transition-all hover:scale-105">
            Launch Terminal
          </button>
          <button className="px-8 py-4 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
            Documentation
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Bot className="w-6 h-6 text-radiant-orange" />}
            title="Gemini 2.5 Flash"
            description="Ultra-low latency chat responses powered by Google's latest model."
          />
          <FeatureCard
            icon={<ImageIcon className="w-6 h-6 text-radiant-orange" />}
            title="Flash Generation"
            description="Instant high-fidelity image generation for your creative needs."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-radiant-orange" />}
            title="Session Fuel"
            description="Transparent micro-billing on Monad. Pay only for what you use."
          />
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/5 text-center text-neutral-600">
        <p>© 2025 LUMINA AI. All rights Reserved.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-white/5 hover:border-radiant-orange/20 transition-all group">
      <div className="mb-6 p-3 rounded-xl bg-obsidian border border-white/5 inline-block group-hover:shadow-[0_0_15px_rgba(255,140,0,0.2)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
