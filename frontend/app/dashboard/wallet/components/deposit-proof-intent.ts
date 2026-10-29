import api from '../../../lib/api';
import { getAccessToken } from '../../../lib/auth-session';
import { type PendingIntentKey } from '../../../lib/intent-key';

export type PendingDepositClaim = { proof: File; fingerprint: string; objectKey: string; intent: PendingIntentKey };

export function sameDepositClaim(current: PendingDepositClaim | null, proof: File, fingerprint: string): current is PendingDepositClaim {
  return current?.proof === proof && current.fingerprint === fingerprint;
}

export async function uploadDepositProofObject(proof: File): Promise<string> {
  const intent = await api.post<{ key: string }>('/financial/deposit-proof-intents', {
    contentType: proof.type,
    byteSize: String(proof.size),
  });
  const token = getAccessToken();
  const platformOrigin = (process.env.NEXT_PUBLIC_PLATFORM_URL || window.location.origin).replace(/\/$/, '');
  const upload = await fetch(`${platformOrigin}/storage/deposit-proof?key=${encodeURIComponent(intent.data.key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': proof.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: proof,
  });
  if (!upload.ok) throw new Error(`Proof upload failed (${upload.status})`);
  return intent.data.key;
}
