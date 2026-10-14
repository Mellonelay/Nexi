export type WalletConnectorOption = {
  id: string;
  uid: string;
  name: string;
  type: string;
};

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

export function isCoinbaseInjectedProvider(provider: unknown): boolean {
  if (!provider || typeof provider !== "object") return false;
  const candidate = provider as {
    isCoinbaseWallet?: boolean;
    providers?: unknown;
  };
  if (candidate.isCoinbaseWallet === true) return true;
  return (
    Array.isArray(candidate.providers) &&
    candidate.providers.some(isCoinbaseInjectedProvider)
  );
}

export function getWalletConnectorOptions<T extends WalletConnectorOption>(
  connectors: readonly T[],
  coinbaseProviderDetected = false,
): T[] {
  const hasNamedInjected = connectors.some(
    (connector) =>
      connector.type === "injected" && walletKey(connector.name) !== "injected",
  );
  const hasCoinbaseExtension =
    coinbaseProviderDetected ||
    connectors.some(
      (connector) =>
        connector.type === "injected" &&
        walletKey(connector.name).includes("coinbase"),
    );
  const seenUids = new Set<string>();

  return [...connectors]
    .sort(
      (a, b) =>
        walletPriority(a.name, a.id) - walletPriority(b.name, b.id) ||
        a.name.localeCompare(b.name) ||
        a.uid.localeCompare(b.uid),
    )
    .filter((connector) => {
      if (seenUids.has(connector.uid)) return false;
      seenUids.add(connector.uid);
      const isCoinbaseSdk =
        connector.type !== "injected" &&
        walletKey(connector.name).includes("coinbase");
      if (hasCoinbaseExtension && isCoinbaseSdk) return false;
      return !(
        connector.type === "injected" &&
        walletKey(connector.name) === "injected" &&
        hasNamedInjected
      );
    });
}

export function getWalletConnectorLabel(
  connector: WalletConnectorOption,
  coinbaseProviderDetected = false,
): string {
  if (
    coinbaseProviderDetected &&
    connector.type === "injected" &&
    walletKey(connector.name) === "injected"
  ) {
    return "Coinbase Wallet";
  }
  return connector.name;
}
