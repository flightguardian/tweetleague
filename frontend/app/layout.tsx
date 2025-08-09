import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { TawkChat } from "@/components/tawk-chat";
import { FaXTwitter } from 'react-icons/fa6';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "COV Tweet League - Coventry City Predictions",
    template: "%s | COV Tweet League"
  },
  description: "Predict Coventry City FC match outcomes and compete with fellow Sky Blues fans",
  icons: {
    icon: '/trophy.svg',
    shortcut: '/trophy.svg',
    apple: '/trophy.svg',
  },
  openGraph: {
    title: 'COV Tweet League',
    description: 'Predict Coventry City FC match outcomes and compete with fellow Sky Blues fans',
    type: 'website',
    siteName: 'COV Tweet League',
  },
  twitter: {
    card: 'summary',
    title: 'COV Tweet League',
    description: 'Predict Coventry City FC match outcomes',
    creator: '@covtweetleague',
    site: '@covtweetleague',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-8 flex-grow">
              {children}
            </main>
            <footer className="bg-[#101010] text-white py-8 mt-12">
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm opacity-75">© 2025 COV Tweet League</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <a 
                    href="https://twitter.com/covtweetleague" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[rgb(98,181,229)] transition-colors flex items-center gap-2"
                  >
                    <FaXTwitter className="h-5 w-5" />
                    <span className="text-sm">@covtweetleague</span>
                  </a>
                </div>
                <p className="text-xs mt-3 opacity-50">Unofficial Coventry City fan site</p>
              </div>
            </footer>
          </div>
          <Toaster />
          <TawkChat />
        </Providers>
      </body>
    </html>
  );
}
