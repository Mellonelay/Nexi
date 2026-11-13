'use client';

import { mainnet } from 'viem/chains';
import { createConfig, http, type Config } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const configuredRpcUrl = process.env.NEXT_PUBLIC_WALLET_RPC_URL;

// NEXI wallet authentication uses Ethereum Mainnet (chain 1) in every environment.
// A dedicated RPC is optional; viem can use the selected chain's public fallback.
export const walletChain = mainnet;

const connectors = [
  // Coinbase Wallet also covers the Coinbase/Base wallet path when no injected
  // EIP-6963 provider is present.
  coinbaseWallet({ appName: 'NEXI' }),
  // Legacy EIP-1193 fallback for wallets that do not yet announce through EIP-6963.
  injected({ unstable_shimAsyncInject: 2_000 }),
];
export const config: Config = createConfig({
  chains: [walletChain],
  connectors,
  transports: {
    [mainnet.id]: configuredRpcUrl ? http(configuredRpcUrl) : http(),
  },
  // Discover every EIP-6963 injected provider independently so MetaMask,
  // Trust Wallet, Brave, Rabby, Coinbase and other compatible wallets can
  // coexist without competing for window.ethereum.
  multiInjectedProviderDiscovery: true,
  ssr: true,
});
