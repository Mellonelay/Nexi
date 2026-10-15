import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getWalletConnectorLabel,
  getWalletConnectorOptions,
  isCoinbaseInjectedProvider,
  requestCoinbaseInjectedAccounts,
} from "./wallet-connector-options.ts";

const connector = (uid, name, id = "injected", type = "injected") => ({
  uid,
  name,
  id,
  type,
});

test("wallet chooser prefers the discovered Coinbase extension over its SDK connector", () => {
  const coinbaseSdk = connector(
    "coinbase-sdk",
    "Coinbase Wallet",
    "coinbaseWallet",
    "coinbaseWallet",
  );
  const coinbaseExtension = connector(
    "eip6963-coinbase",
    "Coinbase Wallet",
    "injected",
    "injected",
  );
  const metamask = connector("metamask", "MetaMask", "injected");

  assert.deepEqual(
    getWalletConnectorOptions([coinbaseSdk, coinbaseExtension, metamask]),
    [metamask, coinbaseExtension],
  );
});

test("wallet chooser routes a Coinbase extension through the generic injected connector", () => {
  const coinbaseSdk = connector(
    "coinbase-sdk",
    "Coinbase Wallet",
    "coinbaseWallet",
    "coinbaseWallet",
  );
  const injected = connector("injected-fallback", "Injected");

  assert.deepEqual(getWalletConnectorOptions([coinbaseSdk, injected], true), [
    injected,
  ]);
  assert.equal(getWalletConnectorLabel(injected, true), "Coinbase Wallet");
});

test("Coinbase provider detection handles direct and multi-provider injections", () => {
  assert.equal(isCoinbaseInjectedProvider({ isCoinbaseWallet: true }), true);
  assert.equal(
    isCoinbaseInjectedProvider({
      providers: [{ isCoinbaseWallet: true }],
    }),
    true,
  );
  assert.equal(isCoinbaseInjectedProvider({ isMetaMask: true }), false);
});

test("wallet chooser removes only duplicate connector instances and generic injected fallback", () => {
  const named = connector("coinbase-extension", "Coinbase Wallet", "injected");
  const generic = connector("injected-fallback", "Injected");
  const duplicateUid = { ...named, name: "Coinbase" };
  const metamask = connector("metamask", "MetaMask", "injected");

  assert.deepEqual(
    getWalletConnectorOptions([generic, named, duplicateUid, metamask]).map(
      ({ uid }) => uid,
    ),
    ["metamask", "coinbase-extension"],
  );
});

test("Coinbase injected connector requests account access before Wagmi connector negotiation", async () => {
  const calls = [];
  const provider = {
    isCoinbaseWallet: true,
    async request(args) {
      calls.push(args.method);
      return ["0x0000000000000000000000000000000000000001"];
    },
  };

  await requestCoinbaseInjectedAccounts({
    type: "injected",
    getProvider: async () => provider,
  });

  assert.deepEqual(calls, ["eth_requestAccounts"]);
});

test("account preflight leaves non-Coinbase injected and WalletConnect connectors unchanged", async () => {
  let calls = 0;
  const connector = {
    type: "injected",
    getProvider: async () => ({
      isMetaMask: true,
      request: async () => {
        calls += 1;
      },
    }),
  };

  await requestCoinbaseInjectedAccounts(connector);
  await requestCoinbaseInjectedAccounts({ ...connector, type: "walletConnect" });
  assert.equal(calls, 0);
});
