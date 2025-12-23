'use client';

import React from 'react';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';

// Define Monad Sepolia Chain
const monadSepolia = {
  id: 10143,
  name: 'Monad Sepolia',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-devnet.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://explorer.monad-devnet.xyz/' },
  },
  testnet: true,
} as const;

const config = getDefaultConfig({
  appName: 'Lumina AI',
  projectId: 'YOUR_PROJECT_ID', // User should replace this or I'll use a placeholder
  chains: [monadSepolia, mainnet, sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#FF8C00',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
