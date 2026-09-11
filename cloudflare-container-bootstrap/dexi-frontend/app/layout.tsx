import './globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import type { Viewport } from 'next'
import { Providers } from './providers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import RootClientRuntime from './components/RootClientRuntime';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050508',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <title>NEXI</title>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#050508] font-sans text-[#F5F7FB] antialiased">
        <Providers>
          <RootClientRuntime />
          {children}
        </Providers>
      </body>
    </html>
  )
}
