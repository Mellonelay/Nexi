'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { sessionPrincipalId } from '../lib/wallet-auth';
import { recoverPublicSession } from '../lib/api';

export default function RootClientRuntime() {
  useEffect(() => {
    void recoverPublicSession();
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const socket = io(apiUrl, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
    });
    const interval = setInterval(() => {
      socket.emit('heartbeat', { userId: sessionPrincipalId() });
    }, 30000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return null;
}
