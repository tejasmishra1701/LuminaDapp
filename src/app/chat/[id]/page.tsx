'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { FuelMeter } from '@/components/FuelMeter';
import { Bot, Image as ImageIcon, Send, Loader2, BatteryCharging, ExternalLink, MessageSquare } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LUMINA_FUEL_ADDRESS as `0x${string}`;
const ABI = [
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" }
];

export default function ChatPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const params = useParams();
    const activeId = params?.id as string;
    const isNewChat = activeId === 'new';

    const [messages, setMessages] = useState<{ role: string; content: string; type?: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [fuelPercentage, setFuelPercentage] = useState(100);
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const scrollRef = useRef<HTMLDivElement>(null);
    const redirectingRef = useRef(false);

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

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Fetch existing messages if not new
    useEffect(() => {
        const fetchMessages = async () => {
            if (isNewChat) {
                setMessages([]);
                return;
            }

            if (!activeId) return;

            // If we're currently redirecting, we don't want to fetch and overwrite
            if (redirectingRef.current) {
                redirectingRef.current = false;
                return;
            }

            setIsMessageLoading(true);
            try {
                const res = await fetch(`/api/chats/${activeId}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages(data.map(m => ({
                        role: m.role,
                        content: m.content,
                        type: m.type
                    })));
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
                setMessages([]);
            } finally {
                setIsMessageLoading(false);
            }
        };
        fetchMessages();
    }, [activeId, isNewChat]);

    useEffect(() => {
        if (onChainBalance !== undefined) {
            const balanceInEth = parseFloat(formatEther(onChainBalance as bigint));
            const percentage = Math.min((balanceInEth / 0.1) * 100, 100);
            setFuelPercentage(percentage);
        }
    }, [onChainBalance]);

    useEffect(() => {
        if (isConfirmed) refetchBalance();
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
                    conversationId: isNewChat ? null : activeId,
                    type: mode
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const assistantMsg = { role: 'assistant', content: data.text, type: mode };
            setMessages(prev => [...prev, assistantMsg]);

            // Redirect if it was a new chat
            if (isNewChat && data.conversationId) {
                redirectingRef.current = true;
                router.replace(`/chat/${data.conversationId}`);
            }

            setTimeout(() => refetchBalance(), 3000);
        } catch (err: any) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="h-screen flex flex-col bg-obsidian relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-radiant-orange/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Top Bar */}
            <header className="p-6 flex justify-between items-center z-10 border-b border-white/5 bg-obsidian/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white/40">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Session Context</span>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setMode('text')}
                            className={`px-3 py-1 rounded-md text-[10px] font-black tracking-tighter transition-all ${mode === 'text' ? 'bg-radiant-orange text-obsidian shadow-[0_0_10px_rgba(255,140,0,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                        >
                            TEXT
                        </button>
                        <button
                            onClick={() => setMode('image')}
                            className={`px-3 py-1 rounded-md text-[10px] font-black tracking-tighter transition-all ${mode === 'image' ? 'bg-radiant-orange text-obsidian shadow-[0_0_10px_rgba(255,140,0,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                        >
                            IMAGE
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <FuelMeter balance={fuelPercentage} isLoading={isConfirming} />
                    <button
                        onClick={handleDeposit}
                        disabled={isConfirming}
                        className="bg-white/5 hover:bg-radiant-orange/20 border border-white/10 hover:border-radiant-orange/40 p-2 rounded-lg transition-all group"
                        title="Deposit Fuel (0.1 MON)"
                    >
                        {isConfirming ? <Loader2 className="w-4 h-4 animate-spin text-radiant-orange" /> : <BatteryCharging className="w-4 h-4 text-radiant-orange group-hover:scale-110 transition-transform" />}
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-hide"
            >
                <div className="max-w-4xl mx-auto w-full space-y-8 pb-32">
                    <AnimatePresence mode="wait">
                        {isMessageLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-[60vh] flex flex-col items-center justify-center gap-4"
                            >
                                <Loader2 className="w-8 h-8 text-radiant-orange animate-spin" />
                                <span className="text-[10px] font-mono text-radiant-orange uppercase tracking-[0.3em] animate-pulse">Synchronizing Synthesis...</span>
                            </motion.div>
                        ) : (
                            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                {messages.length === 0 && !isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="h-[60vh] flex flex-col items-center justify-center text-center gap-6"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group">
                                            <div className="absolute inset-0 bg-radiant-orange/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <Bot className="w-8 h-8 text-radiant-orange relative z-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">Awaiting Directives</h3>
                                            <p className="text-sm text-white/40 max-w-xs">The Obsidian Engine is offline. Provide a prompt to synchronize the synthesis core.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-5 rounded-2xl ${m.role === 'user'
                                            ? 'bg-radiant-orange/10 border border-radiant-orange/20 text-white shadow-[0_0_20px_rgba(255,140,0,0.05)]'
                                            : 'bg-[#0F0F0F] border border-white/5 text-neutral-300'
                                            }`}>
                                            {m.type === 'image' && m.role === 'assistant' ? (
                                                <ImageDisplay src={m.content} />
                                            ) : (
                                                <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {m.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="bg-[#0F0F0F] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-2 h-2 bg-radiant-orange rounded-full animate-pulse shadow-[0_0_10px_#FF8C00]" />
                                    <span className="text-[10px] font-mono text-radiant-orange animate-pulse uppercase tracking-[0.2em]">Radiant Sync...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input Form */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-obsidian via-obsidian/90 to-transparent">
                <form
                    onSubmit={handleSend}
                    className="max-w-4xl mx-auto w-full relative group"
                >
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1A1A1A] border border-white/5 focus-within:border-radiant-orange/40 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'image' ? 'Describe the image synthesis...' : 'Enter synchronization prompt...'}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-neutral-600 px-4 py-3"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim() || !isConnected}
                            className="p-3 bg-radiant-orange text-obsidian rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(255,140,0,0.2)]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

// Re-using ImageDisplay from original page.tsx
function ImageDisplay({ src }: { src: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className="relative group rounded-xl overflow-hidden border border-radiant-orange/30 shadow-[0_0_20px_rgba(255,140,0,0.15)] transition-all duration-500">
            {loading && (
                <div className="w-full aspect-video bg-white/5 animate-pulse rounded-xl flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-radiant-orange animate-spin" />
                    <span className="text-[10px] font-mono text-radiant-orange uppercase tracking-[0.3em] font-bold">Generating...</span>
                </div>
            )}
            <div className={`relative aspect-video ${error ? 'hidden' : 'block'}`}>
                <img
                    src={src}
                    alt="Synthesis"
                    onLoad={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                    className={`w-full h-auto object-cover transition-all duration-1000 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                />
            </div>
            {error && (
                <div className="p-8 text-center bg-obsidian">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4">Sync Failed</p>
                    <button onClick={() => { setError(false); setLoading(true); }} className="text-[10px] text-radiant-orange underline uppercase tracking-widest">Retry</button>
                </div>
            )}
            {!loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-[2px]">
                    <a href={src} download target="_blank" rel="noreferrer" className="bg-radiant-orange text-obsidian px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_#FF8C00] flex items-center gap-2">
                        Download <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
