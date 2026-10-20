import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getWalletConnectorLabel,
  getWalletConnectorOptions,
  isCoinbaseInjectedProvider,
} from "./wallet-connector-options.ts";

const connector = (uid, name, id = "injected", type = "injected") => ({
  uid,
  name,
  id,
  type,
});

test("wallet chooser prefers the Coinbase SDK popup over an injected Coinbase provider", () => {
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
    [metamask, coinbaseSdk],
  );
});

test("wallet chooser uses the SDK popup when Coinbase is the generic injected provider", () => {
  const coinbaseSdk = connector(
    "coinbase-sdk",
    "Coinbase Wallet",
    "coinbaseWallet",
    "coinbaseWallet",
  );
  const injected = connector("injected-fallback", "Injected");

  assert.deepEqual(getWalletConnectorOptions([coinbaseSdk, injected], true), [
    coinbaseSdk,
  ]);
});

test("wallet chooser keeps the injected Coinbase fallback when the SDK is absent", () => {
  const injected = connector("injected-fallback", "Injected");
  assert.deepEqual(getWalletConnectorOptions([injected], true), [injected]);
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

test("wallet chooser preserves named EIP-6963 providers", () => {
  const names = [
    "MetaMask",
    "Trust Wallet",
    "Rabby Wallet",
    "Brave Wallet",
    "Other EVM Wallet",
  ];
  const providers = names.map((name) => connector(name, name));

  assert.deepEqual(
    getWalletConnectorOptions(providers).map(({ name }) => name),
    names,
  );
});
