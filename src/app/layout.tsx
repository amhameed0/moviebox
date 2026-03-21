import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'MovieBox',
  description: 'Extract movie recommendations from TikTok',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MovieBox',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-180.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <span className="text-xl font-bold tracking-tight text-white">MovieBox</span>
            </a>
            <nav>
              <a href="/library" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Library
              </a>
            </nav>
          </header>
          <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
            {children}
          </main>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
