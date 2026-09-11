'use client';
'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { recoverPublicSession } from '../lib/api';
import { hapticFeedback } from '../lib/haptics';
import { sessionPrincipalId } from '../lib/wallet-auth';

export default function RootClientRuntime() {
  useEffect(() => {
    void recoverPublicSession();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const selector = 'button:not(:disabled),a[href],[role="tab"],[role="button"],.nexi-interactive';
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
      if (!target || target.matches('[aria-disabled="true"]')) return;
      hapticFeedback('selection');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
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
