'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, LogOut, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

interface ChatHistory {
    _id: string;
    title: string;
    updatedAt: string;
}

export function Sidebar() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const params = useParams();
    const [chats, setChats] = useState<ChatHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const activeId = params?.id as string;

    const fetchChats = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/chats?walletAddress=${address}`);
            const data = await res.json();
            if (Array.isArray(data)) setChats(data);
        } catch (err) {
            console.error('Failed to fetch chats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            fetchChats();
        } else {
            setChats([]);
        }
    }, [isConnected, address, activeId]); // Re-fetch on activeId change to capture title updates

    const deleteChat = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeletingId(id);
        try {
            const res = await fetch(`/api/chats?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setChats(prev => prev.filter(c => c._id !== id));
                if (activeId === id) {
                    router.push('/chat/new');
                }
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogOut = () => {
        disconnect();
        router.push('/');
    };

    if (!isConnected) return null;

    return (
        <aside className="w-72 bg-obsidian-dark/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen overflow-hidden sticky top-0">
            {/* Header */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3 group mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-radiant-orange/20 blur-lg rounded-full group-hover:bg-radiant-orange/40 transition-all" />
                        <img src="/logo.png" alt="Lumina" className="w-8 h-8 relative z-10 rounded-lg border border-white/10" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-radiant-orange transition-colors">
                        LUMINA
                    </span>
                </Link>

                <button
                    onClick={() => router.push('/chat/new')}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-radiant-orange/10 border border-white/10 hover:border-radiant-orange/40 text-white font-medium flex items-center justify-center gap-2 transition-all group"
                >
                    <Plus className="w-4 h-4 text-radiant-orange group-hover:scale-125 transition-transform" />
                    New Synthesis
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-4">Verification Logs</div>

                {loading && chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-30">
                        <Loader2 className="w-6 h-6 animate-spin text-radiant-orange" />
                        <span className="text-xs">Synchronizing history...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {chats.map((chat) => (
                            <motion.div
                                key={chat._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative"
                            >
                                <Link
                                    href={`/chat/${chat._id}`}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${activeId === chat._id
                                        ? 'bg-radiant-orange/10 border-radiant-orange/30 text-white shadow-[0_0_20px_rgba(255,140,0,0.1)]'
                                        : 'border-transparent hover:bg-white/5 text-white/50 hover:text-white'
                                        }`}
                                >
                                    {activeId === chat._id && (
                                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-radiant-orange rounded-r-full shadow-[0_0_10px_#FF8C00]" />
                                    )}
                                    <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === chat._id ? 'text-radiant-orange' : 'text-white/20'}`} />
                                    <span className="text-sm font-medium truncate flex-1">
                                        {chat.title}
                                    </span>

                                    <button
                                        onClick={(e) => deleteChat(e, chat._id)}
                                        disabled={deletingId === chat._id}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-md transition-all text-white/30 hover:text-red-500"
                                    >
                                        {deletingId === chat._id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {isConnected && !loading && chats.length === 0 && (
                    <div className="py-10 text-center px-4">
                        <p className="text-xs text-white/20">No history found.<br />Start a new synthesis.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 mt-auto border-t border-white/5 bg-obsidian/30 backdrop-blur-md">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 group hover:border-radiant-orange/20 transition-all justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-radiant-orange/10 flex items-center justify-center text-radiant-orange font-bold text-xs ring-1 ring-white/10 group-hover:ring-radiant-orange/40 transition-all">
                            {address?.slice(2, 4).toUpperCase() || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/30 font-bold uppercase truncate">Authorized Entity</p>
                            <p className="text-xs text-white/70 font-mono truncate">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Disconnected'}</p>
                        </div>
                    </div>
                    {isConnected && (
                        <button
                            onClick={handleLogOut}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                            title="Deauthorize Session (Log Out)"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
