'use client';

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { FuelMeter } from '@/components/FuelMeter';
import { Zap, Bot, Image as ImageIcon, ShieldCheck, Send, Loader2, PlusCircle, BatteryCharging, ExternalLink } from 'lucide-react';
import { parseEther, formatEther } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LUMINA_FUEL_ADDRESS as `0x${string}`;
const ABI = [
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" }
];

export default function LandingPage() {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<{ role: string; content: string; type?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [fuelPercentage, setFuelPercentage] = useState(100);
  const [mode, setMode] = useState<'text' | 'image'>('text');

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: onChainBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getBalance',
    args: [address as `0x${string}`],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 5000,
    }
  });

  useEffect(() => {
    if (onChainBalance !== undefined) {
      const balanceInEth = parseFloat(formatEther(onChainBalance as bigint));
      const percentage = Math.min((balanceInEth / 0.1) * 100, 100);
      setFuelPercentage(percentage);
    }
  }, [onChainBalance]);

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

  const handleDeposit = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'deposit',
      value: parseEther('0.1'),
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !isConnected) return;

    const userMsg = { role: 'user', content: input, type: mode };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          walletAddress: address,
          conversationId,
          type: mode
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.text, type: mode }]);
      if (data.conversationId) setConversationId(data.conversationId);

      setTimeout(() => refetchBalance(), 3000);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-obsidian selection:bg-radiant-orange/30 flex flex-col">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full" />

      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={startNewChat}>
          <div className="relative">
            <div className="absolute inset-0 bg-radiant-orange/20 blur-xl rounded-full group-hover:bg-radiant-orange/40 transition-all duration-500" />
            <img
              src="/logo.png"
              alt="Lumina AI Logo"
              className="w-10 h-10 relative z-10 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(255,140,0,0.3)] group-hover:scale-110 transition-transform duration-500 object-contain bg-obsidian/50 p-1"
            />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase group-hover:text-radiant-orange transition-colors duration-500">
            LUMINA <span className="text-radiant-orange">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          {isConnected && (
            <div className="flex items-center gap-4">
              <FuelMeter balance={fuelPercentage} isLoading={isConfirming} />
              <button
                onClick={handleDeposit}
                disabled={isConfirming}
                className="bg-white/5 hover:bg-radiant-orange/20 border border-white/10 hover:border-radiant-orange/40 p-2 rounded-lg transition-all group"
                title="Deposit Fuel (0.1 MON)"
              >
                {isConfirming ? <Loader2 className="w-5 h-5 animate-spin text-radiant-orange" /> : <BatteryCharging className="w-5 h-5 text-radiant-orange group-hover:scale-110 transition-transform" />}
              </button>
            </div>
          )}
          <ConnectButton />
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative z-20 max-w-5xl mx-auto w-full px-6">
        {!isConnected ? (
          <section className="pt-20 pb-20 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 mb-6 border border-radiant-orange/20 rounded-full bg-radiant-orange/5 backdrop-blur-sm"
            >
              <span className="text-sm font-medium text-radiant-orange uppercase tracking-wider">Powered by Monad Sepolia</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-black text-white tracking-tight mb-8"
            >
              AI Intelligence.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-radiant-orange to-orange-400">Radiant Efficiency.</span>
            </motion.h1>

            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mb-12">
              Connect your wallet to experience the next generation of AI on Monad.
              Obsidian sleek design, radiant power.
            </p>

            <ConnectButton />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
              <FeatureCard
                icon={<Bot className="w-6 h-6 text-radiant-orange" />}
                title="Gemini 1.5 Flash"
                description="Ultra-low latency chat responses powered by Google's latest model."
              />
              <FeatureCard
                icon={<ImageIcon className="w-6 h-6 text-radiant-orange" />}
                title="Flash Generation"
                description="Instant high-fidelity image generation for your creative needs."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-radiant-orange" />}
                title="Sovereign Fuel"
                description="Economical micro-billing on Monad. 0.001 MON/text, 0.003 MON/image."
              />
            </div>
          </section>
        ) : (
          <div className="flex-1 flex flex-col gap-4 mb-32 h-[calc(100vh-250px)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-radiant-orange" />
                  Sovereign Model
                </h2>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setMode('text')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'text' ? 'bg-radiant-orange text-obsidian shadow-[0_0_10px_rgba(255,140,0,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  >
                    TEXT
                  </button>
                  <button
                    onClick={() => setMode('image')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'image' ? 'bg-radiant-orange text-obsidian shadow-[0_0_10px_rgba(255,140,0,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  >
                    IMAGE
                  </button>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                  {mode === 'text' ? 'GEMINI-3-FLASH-PREVIEW' : 'GEMINI-2.5-FLASH-IMAGE'}
                </span>
              </div>
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                title="Create a new conversation session"
              >
                <PlusCircle className="w-4 h-4" />
                New Session
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide pr-2">
              <AnimatePresence initial={false}>
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center text-neutral-600 italic"
                  >
                    The terminal is ready. Awaiting your prompt...
                  </motion.div>
                )}
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user'
                      ? 'bg-radiant-orange/10 border border-radiant-orange/20 text-white shadow-[0_0_20px_rgba(255,140,0,0.1)]'
                      : 'bg-[#0F0F0F] border border-white/5 text-neutral-300'
                      }`}>
                      {m.type === 'image' && m.role === 'assistant' ? (
                        <div className="space-y-4 min-w-[300px]">
                          {(m.content.startsWith('http') || m.content.startsWith('data:image')) ? (
                            <ImageDisplay src={m.content} />
                          ) : (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <p className="text-xs font-mono text-red-400 mb-2 uppercase tracking-widest font-bold">Radiant Synthesis Error</p>
                              <pre className="text-[10px] text-neutral-400 overflow-x-auto whitespace-pre-wrap">{m.content}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-[#0F0F0F] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-radiant-orange rounded-full animate-pulse shadow-[0_0_10px_#FF8C00]" />
                      <span className="text-xs font-mono text-radiant-orange animate-pulse uppercase tracking-[0.2em]">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSend} className="fixed bottom-12 left-6 right-6 max-w-5xl mx-auto z-30">
              <div className="glass-morphism p-2 rounded-2xl flex items-center gap-2 group focus-within:border-radiant-orange/40 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Lumina anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-neutral-600 px-4 py-3"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || fuelPercentage <= 0}
                  className="p-3 bg-radiant-orange text-obsidian rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(255,140,0,0.2)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-center text-[10px] text-neutral-600 mt-3 tracking-[0.3em] uppercase">
                Obsidian Engine v1.0 • Monad Devnet Integration
              </p>
            </form>
          </div>
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

function ImageDisplay({ src }: { src: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative group mt-4 rounded-xl overflow-hidden border border-radiant-orange/30 shadow-[0_0_20px_rgba(255,140,0,0.15)] group-hover:shadow-[0_0_30px_rgba(255,140,0,0.3)] transition-all duration-500">
      {loading && (
        <div className="w-full aspect-video bg-white/5 animate-pulse rounded-xl flex items-center justify-center border border-white/5">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-radiant-orange animate-spin" />
            <span className="text-[10px] font-mono text-radiant-orange uppercase tracking-[0.3em] font-bold">Radiant Synthesis...</span>
          </div>
        </div>
      )}
      <div className={`relative aspect-video ${error ? 'hidden' : 'block'}`}>
        <img
          src={src}
          alt="Radiant AI Synthesis"
          onLoad={() => setLoading(false)}
          onError={() => {
            console.error("Image Synthesis Failed for source:", src);
            setLoading(false);
            setError(true);
          }}
          className={`w-full h-auto object-cover transition-all duration-1000 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        />
        {!loading && !error && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        )}
      </div>

      {error && (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-obsidian/80 backdrop-blur-sm">
          <p className="text-red-400 text-xs font-bold mb-2 uppercase tracking-widest">Synthesis Unstable</p>
          <p className="text-neutral-500 text-[10px] max-w-[200px] leading-relaxed">The radiant gate to the synthesis engine is currently out of sync.</p>
          <button
            onClick={() => { setError(false); setLoading(true); }}
            className="mt-4 text-[10px] text-radiant-orange underline uppercase tracking-widest hover:text-white transition-colors"
          >
            Retry Synthesis
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
          <a
            href={src}
            download="lumina-radiant-synthesis.png"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-radiant-orange text-obsidian px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_#FF8C00] flex items-center gap-2"
          >
            {src.startsWith('data:') ? 'Download Synthesis' : 'Open Engine Source'} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
