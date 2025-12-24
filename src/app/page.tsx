'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Bot, Image as ImageIcon, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  return (
    <main className="min-h-screen relative overflow-hidden bg-obsidian flex flex-col items-center justify-center p-6 text-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />

      <div className="relative z-20 max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 mb-8 border border-radiant-orange/20 rounded-full bg-radiant-orange/5 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-radiant-orange uppercase tracking-wider">Obsidian Intelligence • Monad Native</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl md:text-8xl font-black text-white tracking-tight mb-8"
        >
          AI Synthesis.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-radiant-orange to-orange-400">Radiant Power.</span>
        </motion.h1>

        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
          Connect your wallet to experience high-fidelity AI on Monad Sepolia.
          Obsidian architecture, sovereign micro-billing, radiant output.
        </p>

        <div className="flex justify-center mb-24">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-8 py-4 bg-radiant-orange text-obsidian font-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,140,0,0.3)] group flex items-center gap-3 text-lg"
                    >
                      <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      CONNECT YOUR WALLET TO GET STARTED
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <button
                        onClick={() => router.push('/chat/new')}
                        type="button"
                        className="px-8 py-4 bg-radiant-orange text-obsidian font-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,140,0,0.3)] group flex items-center gap-3 text-lg"
                      >
                        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        SYNCHRONIZE CORE
                      </button>
                      <div className="flex items-center gap-4">
                        <button onClick={openChainModal} className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest font-bold border border-white/5 px-3 py-1 rounded-full">{chain.name}</button>
                        <button onClick={openAccountModal} className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest font-bold border border-white/5 px-3 py-1 rounded-full">{account.displayName}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {!isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FeatureCard
              icon={<Bot className="w-6 h-6 text-radiant-orange" />}
              title="Hyper-Logic"
              description="Ultra-low latency reasoning powered by the latest Gemini architecture."
            />
            <FeatureCard
              icon={<ImageIcon className="w-6 h-6 text-radiant-orange" />}
              title="Radiant Vision"
              description="High-fidelity image synthesis with direct on-chain fuel consumption."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-radiant-orange" />}
              title="On-Chain Fuel"
              description="Sovereign micro-billing on Monad. 0.001 MON/text, 0.003 MON/image."
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
          >
            <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-radiant-orange/20 shadow-[0_0_30px_rgba(255,140,0,0.05)]">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-radiant-orange rounded-full animate-pulse" />
                OPERATIONAL DIRECTIVES
              </h3>
              <div className="space-y-6">
                <div className="group">
                  <p className="text-[10px] font-black text-radiant-orange uppercase tracking-widest mb-1">01. Fuel Authorization</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    The Obsidian engine requires <span className="text-white font-medium">MON Fuel</span> to synthesize responses. Use the <span className="text-radiant-orange font-bold uppercase tracking-tighter">Refill</span> button in the header to authorize a 0.1 MON deposit. Every interaction is settled on-chain.
                  </p>
                </div>
                <div className="group">
                  <p className="text-[10px] font-black text-radiant-orange uppercase tracking-widest mb-1">02. Synthesis Modes</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Toggle between <span className="text-white font-medium">TEXT</span> and <span className="text-white font-medium">IMAGE</span> synthesis in the header. Text synthesis consumes 0.001 MON, while high-fidelity image generation requires 0.003 MON.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-white/20 rounded-full" />
                SYSTEM ARCHITECTURE
              </h3>
              <div className="space-y-6">
                <div className="group">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">03. Context Persistence</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    All síntesis logs are stored securely and indexed by your wallet address. Use the sidebar to navigate between different historical cores or delete inactive sessions.
                  </p>
                </div>
                <div className="group">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">04. Session Sovereignty</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    You maintain full control over your session. Deauthorize your connection using the logout icon in the sidebar footer to clear the active interface state.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-white/5 hover:border-radiant-orange/20 transition-all group">
      <div className="mb-6 p-3 rounded-xl bg-obsidian border border-white/5 inline-block group-hover:shadow-[0_0_15px_rgba(255,140,0,0.2)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
