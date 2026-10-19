import { useState } from "react";
import type { MutationResult } from "@/admin/data/provider";

export function useReceipt() {
  const [receipt, setReceipt] = useState<{ action: string; result: MutationResult } | null>(null);
  return {
    receipt,
    record: (action: string, result: MutationResult) => setReceipt({ action, result }),
    clear: () => setReceipt(null),
  };
}
