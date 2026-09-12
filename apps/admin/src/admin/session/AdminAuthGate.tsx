import { useState, type FormEvent, type ReactNode } from "react";
import type { AdminDataProvider } from "../data/provider";
import { useAdminSession } from "./session";

export function AdminAuthGate({ children, provider }: { children: ReactNode; provider: AdminDataProvider }) {
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.identityStatus === "local" || session.identityStatus === "ready") return <>{children}</>;
  if (session.identityStatus === "loading") {
    return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking Admin session…</main>;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!provider.login || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await provider.login(email.trim(), password);
      sessionStorage.setItem("nexi.admin.access_token", result.access_token);
      if (result.refresh_token) sessionStorage.setItem("nexi.admin.refresh_token", result.refresh_token);
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin login failed");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">NEXI Admin</div>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use an Admin account with an assigned NEXI role.</p>
        <label className="mt-6 block text-xs text-muted-foreground">Email</label>
        <input autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" required />
        <label className="mt-4 block text-xs text-muted-foreground">Password</label>
        <input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" required />
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy || !provider.login} className="mt-6 h-11 w-full rounded-md bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
