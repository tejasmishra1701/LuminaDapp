import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina AI | Premium AI DApp",
  description: "Experience the next generation of AI on Monad. Obsidian sleek design, radiant power.",
  icons: {
    icon: "/logo.png",
  },
};

import { Sidebar } from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-obsidian text-foreground antialiased`}
      >
        <Providers>
          <div className="flex h-screen bg-obsidian">
            <Sidebar />
            <div className="flex-1 overflow-auto relative">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
