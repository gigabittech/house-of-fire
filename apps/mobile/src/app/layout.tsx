import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import AppChrome from '@/components/AppChrome';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'House of Fire',
  description: 'Underground house and techno. One room. One night a month.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/assets/icon.png',
    apple: '/assets/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'House of Fire',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A08',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/*
          Clash Display via Fontshare (no next/font support). The `precedence`
          prop lets React 19 hoist this stylesheet into <head> from inside a
          Server Component. Without it, the <link> becomes an illegal child of
          <html> and breaks hydration — blanking the whole app.
        */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          precedence="default"
        />
        <div className="hof-app-frame">
          <AppChrome>{children}</AppChrome>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
