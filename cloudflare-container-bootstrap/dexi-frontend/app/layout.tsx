'use client';

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import type { Viewport } from 'next'
import { Providers } from './providers';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050508',
}

function Heartbeat() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const socket = io(apiUrl, { autoConnect: true, transports: ['polling', 'websocket'], tryAllTransports: true });
    const interval = setInterval(() => {
      const user = localStorage.getItem('user');
      let userId: string | null = null;
      try {
        userId = user ? JSON.parse(user).id ?? null : null;
      } catch {
        userId = null;
      }
      socket.emit('heartbeat', { userId });
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return null;
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className="bg-[#050508] font-sans text-[#F5F7FB] antialiased">
        <Providers>
          <Heartbeat />
          {children}
        </Providers>
      </body>
    </html>
  )
}
