import assert from "node:assert/strict";
import { test } from "node:test";
import { getWalletConnectorOptions } from "./wallet-connector-options.ts";

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
