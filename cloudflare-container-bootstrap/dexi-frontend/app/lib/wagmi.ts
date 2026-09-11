'use client';

import { sepolia } from 'viem/chains';
import { createConfig, http, type Config } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const configuredRpcUrl = process.env.NEXT_PUBLIC_WALLET_RPC_URL;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();

// Sepolia is the approved non-production wallet-auth chain. A dedicated RPC
// is optional; viem can use the chain's public fallback when no override exists.
export const walletChain = sepolia;
export const walletConnectConfigured = Boolean(walletConnectProjectId);

const connectors = [
  // Coinbase Wallet also covers the Coinbase/Base wallet path when no injected
  // EIP-6963 provider is present.
  coinbaseWallet({ appName: 'NEXI' }),
  // Legacy EIP-1193 fallback for wallets that do not yet announce through EIP-6963.
  injected({ unstable_shimAsyncInject: 2_000 }),
  ...(walletConnectProjectId
    ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true })]
    : []),
];
export const config: Config = createConfig({
  chains: [walletChain],
  connectors,
  transports: {
    [walletChain.id]: configuredRpcUrl ? http(configuredRpcUrl) : http(),
  },
  // Discover every EIP-6963 injected provider independently so MetaMask,
  // Trust Wallet, Brave, Rabby, Coinbase and other compatible wallets can
  // coexist without competing for window.ethereum.
  multiInjectedProviderDiscovery: true,
  ssr: true,
});
