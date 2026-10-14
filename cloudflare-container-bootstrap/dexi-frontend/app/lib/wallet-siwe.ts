import type { Address } from "viem";

export type WalletChallenge = {
  message: string;
  chainId: number;
};

export type ConnectorClientParameters<ConnectorType> = {
  connector: ConnectorType;
  account: Address;
  chainId: number;
  assertChainId: true;
};

export type WalletSigningClient = {
  account: { address: string };
  chain: { id: number };
  signMessage: (input: {
    account: Address;
    message: string;
  }) => Promise<string>;
};

type CompleteWalletSiweParameters<ConnectorType, Session> = {
  connector: ConnectorType;
  address: Address;
  chainId: number;
  referralCode: string | null;
  requestChallenge: (
    address: string,
    chainId: number,
  ) => Promise<WalletChallenge>;
  getWalletClient: (
    parameters: ConnectorClientParameters<ConnectorType>,
  ) => Promise<WalletSigningClient>;
  verifyChallenge: (
    message: string,
    signature: string,
    referralCode: string | null,
  ) => Promise<Session>;
};

export async function completeWalletSiwe<ConnectorType, Session>({
  connector,
  address,
  chainId,
  referralCode,
  requestChallenge,
  getWalletClient,
  verifyChallenge,
}: CompleteWalletSiweParameters<ConnectorType, Session>): Promise<Session> {
  const challenge = await requestChallenge(address, chainId);
  if (challenge.chainId !== chainId) {
    throw new Error(
      "Wallet challenge chain does not match the selected wallet.",
    );
  }

  const client = await getWalletClient({
    connector,
    account: address,
    chainId,
    assertChainId: true,
  });

  if (
    client.account.address.toLowerCase() !== address.toLowerCase() ||
    client.chain.id !== chainId
  ) {
    throw new Error("Wallet account or network changed during authentication.");
  }

  const signature = await client.signMessage({
    account: address,
    message: challenge.message,
  });
  return verifyChallenge(challenge.message, signature, referralCode);
}
