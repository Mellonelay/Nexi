"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  captureReferralCode,
  clearReferralCode,
  clearWalletSession,
  loadCurrentUser,
  logoutWallet,
  requestWalletChallenge,
  setWalletSession,
  verifyWalletChallenge,
} from "../lib/wallet-auth";
import { hasAuthSession } from "../lib/auth-session";
import {
  config as wagmiConfig,
  walletChain,
  walletConnectConfigured,
} from "../lib/wagmi";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
function walletKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function walletPriority(name: string, id: string) {
  const value = walletKey(`${name} ${id}`);
  if (value.includes("metamask")) return 10;
  if (value.includes("trust")) return 20;
  if (value.includes("walletconnect")) return 30;
  if (value.includes("base")) return 40;
  if (value.includes("coinbase")) return 50;
  if (value.includes("rabby")) return 60;
  if (value.includes("brave")) return 70;
  if (value.trim() === "injected") return 900;
  return 100;
}

function walletErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data;
    const backendMessage =
      detail && typeof detail === "object" && "message" in detail
        ? (detail as { message?: unknown }).message
        : undefined;
    if (typeof backendMessage === "string" && backendMessage.trim())
      return backendMessage;
    if (error.response?.status)
      return `Wallet verification failed (${error.response.status}).`;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/tab is not active|not active/i.test(message))
    return "Open the wallet, approve the request, then retry.";
  if (/user rejected|rejected the request|denied/i.test(message))
    return "Wallet request was rejected. Approve the connection to continue.";
  if (
    /unsupported chain|switch chain|chain not configured|wallet network/i.test(
      message,
    )
  )
    return `Switch the wallet to ${walletChain.name} and retry.`;
  if (/connectoralreadyconnected/i.test(message))
    return "Choose the connected wallet below to verify it.";
  return "Wallet verification failed.";
}

function WalletConnectControlInner({ compact = false }: { compact?: boolean }) {
  const {
    address,
    chainId,
    connector: activeConnector,
    isConnected,
  } = useAccount();
  const { connectors, connectAsync, error: connectionError } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const previousAddress = useRef<string | null>(null);
  const previousChainId = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chooserRef = useRef<HTMLDialogElement>(null);
  const closeChooserRef = useRef<HTMLButtonElement>(null);
  const [sessionPresent, setSessionPresent] = useState(false);
  const sessionQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: loadCurrentUser,
    enabled: sessionPresent,
    retry: false,
    staleTime: 30_000,
  });

  const walletOptions = useMemo(() => {
    const hasNamedInjected = connectors.some(
      (connector) =>
        connector.type === "injected" &&
        walletKey(connector.name) !== "injected",
    );
    const seen = new Set<string>();
    return [...connectors]
      .sort(
        (a, b) =>
          walletPriority(a.name, a.id) - walletPriority(b.name, b.id) ||
          a.name.localeCompare(b.name),
      )
      .filter((connector) => {
        const key = walletKey(connector.name);
        if (key === "injected" && hasNamedInjected) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [connectors]);

  useEffect(() => {
    const syncSession = () => setSessionPresent(hasAuthSession());
    syncSession();
    window.addEventListener("nexi:wallet-session", syncSession);
    return () => window.removeEventListener("nexi:wallet-session", syncSession);
  }, []);

  useEffect(() => {
    captureReferralCode();
  }, []);

  useEffect(() => {
    const addressChanged = Boolean(
      address &&
      previousAddress.current &&
      previousAddress.current.toLowerCase() !== address.toLowerCase(),
    );
    const chainChanged = Boolean(
      chainId && previousChainId.current && previousChainId.current !== chainId,
    );
    const disconnected = !isConnected && Boolean(previousAddress.current);
    if (addressChanged || chainChanged || disconnected) {
      clearWalletSession();
      void queryClient.cancelQueries({ queryKey: ["user", "me"] });
      queryClient.removeQueries({ queryKey: ["user", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["user"] });
    }
    previousAddress.current = address ?? null;
    previousChainId.current = chainId ?? null;
  }, [address, chainId, isConnected, queryClient]);

  useEffect(() => {
    if (sessionQuery.error) clearWalletSession();
  }, [sessionQuery.error]);

  const authenticateConnectedWallet = useCallback(
    async (selectedAddress: string, selectedChainId: number) => {
      const challenge = await requestWalletChallenge(
        selectedAddress,
        selectedChainId,
      );
      const signature = await signMessageAsync({ message: challenge.message });
      const referralCode = captureReferralCode();
      const verified = await verifyWalletChallenge(
        challenge.message,
        signature,
        referralCode,
      );
      setWalletSession(verified);
      clearReferralCode();
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setOpen(false);
      setMessage("Connected");
    },
    [queryClient, signMessageAsync],
  );

  const connect = useCallback(
    async (connector: (typeof connectors)[number]) => {
      if (busy) return;
      setBusy(true);
      setMessage("");
      try {
        let selectedAddress = address;
        let selectedChainId = chainId;
        const sameConnector = Boolean(
          isConnected &&
          activeConnector?.uid === connector.uid &&
          selectedAddress,
        );

        if (!sameConnector) {
          if (isConnected) await disconnectAsync();
          const result = await connectAsync({ connector });
          selectedAddress = result.accounts[0];
          selectedChainId = result.chainId;
        }

        if (!selectedAddress || !selectedChainId)
          throw new Error("The wallet did not provide an account.");
        await authenticateConnectedWallet(selectedAddress, selectedChainId);
      } catch (error) {
        setMessage(walletErrorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [
      activeConnector,
      address,
      authenticateConnectedWallet,
      busy,
      chainId,
      connectAsync,
      disconnectAsync,
      isConnected,
    ],
  );

  const openWalletChooser = useCallback(() => {
    if (busy) return;
    setMessage("");
    setOpen(true);
  }, [busy]);

  useEffect(() => {
    window.addEventListener("nexi:verify-wallet-request", openWalletChooser);
    return () =>
      window.removeEventListener(
        "nexi:verify-wallet-request",
        openWalletChooser,
      );
  }, [openWalletChooser]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const chooser = chooserRef.current;
    chooser?.showModal();
    closeChooserRef.current?.focus();
    return () => {
      if (chooser?.open) chooser.close();
      trigger?.focus();
    };
  }, [open]);

  const disconnectWallet = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutWallet();
    } finally {
      await disconnectAsync();
      queryClient.removeQueries({ queryKey: ["user", "me"] });
      setBusy(false);
    }
  };

  const sessionWalletAddress = sessionQuery.data?.walletAddress;
  if (
    isConnected &&
    sessionWalletAddress &&
    address &&
    sessionWalletAddress.toLowerCase() === address.toLowerCase()
  ) {
    return (
      <button
        type="button"
        onClick={() => void disconnectWallet()}
        disabled={busy}
        className="min-h-11 rounded-xl border border-violet-300/25 bg-[#2A1742] px-3 text-left text-sm text-[#F8F6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
        title="Disconnect wallet"
      >
        {truncateAddress(sessionWalletAddress)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openWalletChooser())}
        disabled={busy}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${compact ? "w-full" : ""} min-h-11 rounded-xl border border-violet-300/25 bg-[#171022] px-3 text-sm font-semibold text-[#F8F6FF] transition hover:border-violet-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]`}
      >
        {busy
          ? "Connecting…"
          : isConnected && address
            ? "Verify wallet"
            : "Connect"}
      </button>

      <dialog
            ref={chooserRef}
            onCancel={(event) => {
              event.preventDefault();
              setOpen(false);
            }}
            className="fixed inset-x-3 bottom-[calc(8px+env(safe-area-inset-bottom))] m-0 max-h-[calc(100dvh-16px-env(safe-area-inset-bottom))] max-w-none flex-col overflow-hidden rounded-2xl border border-violet-300/25 bg-[#0B0A0E] p-3 shadow-2xl backdrop:bg-black/55 sm:inset-x-auto sm:right-4 sm:top-16 sm:w-80 sm:max-h-[min(70dvh,520px)]"
            aria-label="Choose an Ethereum wallet"
          >
            <div className="flex items-start justify-between gap-3 px-1 pb-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  Choose an Ethereum wallet
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8C8299]">
                  Installed EVM wallets are discovered automatically
                  {walletConnectConfigured
                    ? "; mobile wallets can also use WalletConnect"
                    : ""}
                  .
                </p>
              </div>
              <button
                type="button"
                ref={closeChooserRef}
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11 rounded-lg text-[#8C8299] hover:bg-[#171022] hover:text-white"
                aria-label="Close wallet chooser"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
              {walletOptions.map((connector) => {
                const connected =
                  activeConnector?.uid === connector.uid && isConnected;
                return (
                  <button
                    type="button"
                    key={connector.uid}
                    onClick={() => void connect(connector)}
                    disabled={busy}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm text-[#F8F6FF] transition hover:bg-[#2A1742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
                  >
                    <span className="min-w-0 truncate">{connector.name}</span>
                    {connected && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nexi-cyan)]">
                        Connected
                      </span>
                    )}
                  </button>
                );
              })}

              {walletOptions.length === 0 && (
                <p className="rounded-xl border border-violet-300/15 bg-[#171022] px-3 py-4 text-xs leading-5 text-[#A99DB8]">
                  No compatible EVM wallet was discovered. Open NEXI in a wallet
                  browser or install an EIP-6963/EIP-1193 compatible wallet.
                </p>
              )}
            </div>

            {(message || connectionError) && (
              <p
                className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-[#FFB6C2]"
                role="alert"
              >
                {message || "Wallet connection failed."}
              </p>
            )}
      </dialog>
    </div>
  );
}

export default function WalletConnectControl(props: { compact?: boolean }) {
  if (!wagmiConfig)
    return (
      <span className="text-xs text-[#8C8299]" role="status">
        Wallet connection is not configured.
      </span>
    );
  return <WalletConnectControlInner {...props} />;
}
