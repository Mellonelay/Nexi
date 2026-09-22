import './globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata, Viewport } from 'next'
import { Providers } from './providers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import RootClientRuntime from './components/RootClientRuntime';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050508',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'NEXI',
  icons: { icon: '/icon.svg' },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-[#050508] font-sans text-[#F5F7FB] antialiased">
        <Providers>
          <RootClientRuntime />
          {children}
        </Providers>
      </body>
    </html>
  )
}
