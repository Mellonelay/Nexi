'use client';

import * as React from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ActivePairProvider } from './state/ActivePairProvider';
import { LocaleProvider } from './state/LocaleProvider';
import { WagmiProvider } from 'wagmi';
import { config as wagmiConfig } from './lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const content = (
      <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ActivePairProvider>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              classNames: {
                toast: 'nexi-shell-glass border-violet-300/20 text-white',
                description: 'text-[var(--nexi-text-secondary)]',
              },
            }}
          />
        </ActivePairProvider>
      </LocaleProvider>
      </QueryClientProvider>
  );
  return wagmiConfig ? <WagmiProvider config={wagmiConfig}>{content}</WagmiProvider> : content;
}
