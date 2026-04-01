'use client';

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css';
import type { Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const inter = Inter({ subsets: ['latin'] })

const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0e27',
}

// Metadata cannot be exported from client component
// Moved metadata to separate file or use Layout wrapper if needed.
// For simplicity in this edit, assuming we can keep client logic here or refactor.
// Next.js App Router: layout.tsx can be server, but we need useEffect.
// Best practice: Create a Client Component wrapper for Heartbeat.

function Heartbeat() {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002');

    const interval = setInterval(() => {
      // Get User ID from localStorage if logged in
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;

      socket.emit('heartbeat', { userId });
    }, 30000); // 30 seconds pulse

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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Heartbeat />
          {children}
        </Providers>
      </body>
    </html>
  )
}
