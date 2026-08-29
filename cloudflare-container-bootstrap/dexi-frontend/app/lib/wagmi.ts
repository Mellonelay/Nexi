'use client';

import { sepolia } from 'viem/chains';
import { createConfig, http, type Config } from 'wagmi';

const configuredRpcUrl = process.env.NEXT_PUBLIC_WALLET_RPC_URL;

// Sepolia is the approved non-production wallet-auth chain. A dedicated RPC
// is an optional deployment setting; viem can use the chain's public fallback
// for this local checkpoint when NEXT_PUBLIC_WALLET_RPC_URL is absent.
export const walletChain = sepolia;

export const config: Config = createConfig({
  chains: [walletChain],
  transports: { [walletChain.id]: configuredRpcUrl ? http(configuredRpcUrl) : http() },
  multiInjectedProviderDiscovery: true,
  ssr: true,
});
