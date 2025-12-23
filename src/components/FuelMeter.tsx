'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FuelMeterProps {
    balance: number; // 0 to 100
    isLoading?: boolean;
}

export function FuelMeter({ balance, isLoading }: FuelMeterProps) {
    return (
        <div className="flex flex-col gap-2 w-full max-w-xs">
            <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-radiant-orange font-bold">Session Fuel</span>
                <span className="text-sm font-mono text-white">{balance.toFixed(2)}%</span>
            </div>
            <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${balance}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-600 to-radiant-orange relative"
                >
                    {balance > 0 && (
                        <div className="absolute right-0 top-0 h-full w-2 bg-white/30 blur-sm shadow-[0_0_10px_#FF8C00]" />
                    )}
                </motion.div>
                {isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                        style={{ backgroundSize: '200% 100%' }} />
                )}
            </div>
            <p className="text-[10px] text-neutral-500 italic">
                0.01 MON / msg • 0.05 MON / img
            </p>
        </div>
    );
}
