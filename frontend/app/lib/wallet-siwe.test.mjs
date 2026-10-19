import assert from "node:assert/strict";
import { test } from "node:test";
import { completeWalletSiwe } from "./wallet-siwe.ts";

const address = "0xAbCd000000000000000000000000000000001234";
const connector = { uid: "coinbase-eip6963" };
const challenge = {
  message: "nexitrading.app wants you to sign in",
  chainId: 1,
};

function client(overrides = {}) {
  return {
    account: { address },
    chain: { id: 1 },
    signMessage: async ({ account, message }) => {
      assert.equal(account, address);
      assert.equal(message, challenge.message);
      return "signature";
    },
    ...overrides,
  };
}

test("SIWE requests, signs with the selected connector and account, then verifies in order", async () => {
  const calls = [];
  const session = await completeWalletSiwe({
    connector,
    address,
    chainId: 1,
    referralCode: "REF",
    requestChallenge: async (requestedAddress, chainId) => {
      calls.push(["challenge", requestedAddress, chainId]);
      return challenge;
    },
    getWalletClient: async (parameters) => {
      calls.push(["client", parameters]);
      return client({
        signMessage: async (input) => {
          calls.push(["sign", input]);
          return "signature";
        },
      });
    },
    verifyChallenge: async (...args) => {
      calls.push(["verify", ...args]);
      return { access_token: "test" };
    },
  });

  assert.deepEqual(session, { access_token: "test" });
  assert.deepEqual(
    calls.map(([name]) => name),
    ["challenge", "client", "sign", "verify"],
  );
  assert.equal(calls[0][1], address);
  assert.equal(calls[0][2], 1);
  assert.deepEqual(calls[1][1], {
    connector,
    account: address,
    chainId: 1,
    assertChainId: true,
  });
  assert.deepEqual(calls[2][1], {
    account: address,
    message: challenge.message,
  });
  assert.deepEqual(calls[3].slice(1), [challenge.message, "signature", "REF"]);
});

test("SIWE rejects a challenge for a different chain before opening a signing request", async () => {
  let signed = false;

  await assert.rejects(
    completeWalletSiwe({
      connector,
      address,
      chainId: 1,
      referralCode: null,
      requestChallenge: async () => ({ ...challenge, chainId: 11155111 }),
      getWalletClient: async () =>
        client({
          signMessage: async () => {
            signed = true;
            return "signature";
          },
        }),
      verifyChallenge: async () => ({ ok: true }),
    }),
    /challenge chain does not match/,
  );

  assert.equal(signed, false);
});

test("SIWE refuses a connector client whose account or chain changed", async () => {
  await assert.rejects(
    completeWalletSiwe({
      connector,
      address,
      chainId: 1,
      referralCode: null,
      requestChallenge: async () => challenge,
      getWalletClient: async () =>
        client({
          account: { address: "0x0000000000000000000000000000000000000001" },
        }),
      verifyChallenge: async () => ({ ok: true }),
    }),
    /account or network changed/,
  );
});

test("SIWE does not verify after wallet signing is rejected", async () => {
  let verified = false;

  await assert.rejects(
    completeWalletSiwe({
      connector,
      address,
      chainId: 1,
      referralCode: null,
      requestChallenge: async () => challenge,
      getWalletClient: async () =>
        client({
          signMessage: async () => {
            throw new Error("User rejected request");
          },
        }),
      verifyChallenge: async () => {
        verified = true;
        return { ok: true };
      },
    }),
    /User rejected request/,
  );

  assert.equal(verified, false);
});

test("SIWE propagates backend verification failure without yielding a session", async () => {
  await assert.rejects(
    completeWalletSiwe({
      connector,
      address,
      chainId: 1,
      referralCode: null,
      requestChallenge: async () => challenge,
      getWalletClient: async () => client(),
      verifyChallenge: async () => {
        throw new Error("Invalid SIWE signature");
      },
    }),
    /Invalid SIWE signature/,
  );
});
