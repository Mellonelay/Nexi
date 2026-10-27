export async function loadWallet() {
  return fetch("/api/wallet/me");
}
