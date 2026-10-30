"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "../state/LocaleProvider";
import { authoritativeValue, productStateLabel } from "../lib/product-states";
import { loadCurrentUser, sessionPrincipalId, type WalletProfile } from "../lib/wallet-auth";
import { hasAuthSession } from "../lib/auth-session";
import { NexiWordmark } from "../dashboard/components/QuotesHubVisuals";

type AccountIdentityHeaderProps = {
  onNavigate?: () => void;
  compact?: boolean;
};

type AccountState = "UNAVAILABLE" | "LOADING" | "ERROR" | "LIVE";

function accountState(
  sessionPresent: boolean,
  sessionQuery: { isLoading: boolean; isError: boolean; data?: WalletProfile },
): AccountState {
  if (!sessionPresent) return "UNAVAILABLE";
  if (sessionQuery.isLoading) return "LOADING";
  if (sessionQuery.isError) return "ERROR";
  return sessionQuery.data ? "LIVE" : "UNAVAILABLE";
}

function accountVipLabel(
  state: AccountState,
  level: number | null,
  name: string | null,
  t: ReturnType<typeof useLocale>["t"],
) {
  if (state === "LIVE" && level !== null) {
    return name ? `Level ${level} · ${name}` : `Level ${level}`;
  }
  return state === "LOADING" ? t("loadingAccount") : t("accountUnavailable");
}

function AccountIdentityCard({
  compact,
  displayName,
  onNavigate,
  profileId,
  state,
  t,
  vipLabel,
}: AccountIdentityHeaderProps & {
  displayName: string;
  profileId: string;
  state: AccountState;
  t: ReturnType<typeof useLocale>["t"];
  vipLabel: string;
}) {
  const statusLabel =
    state === "LOADING"
      ? t("loadingAccount")
      : state === "LIVE"
        ? productStateLabel(state)
        : t("accountUnavailable");
  const statusClass =
    state === "LIVE"
      ? "bg-[#48C0CC]"
      : state === "LOADING"
        ? "bg-[#A995FF]"
        : "bg-[#8C8299]";
  return (
    <Link
      href="/dashboard/settings?tab=profile"
      onClick={onNavigate}
      aria-label={t("profile")}
      className={`${compact ? "mb-4 rounded-xl p-3" : "mb-5 rounded-2xl p-4"} block border border-violet-300/15 bg-[#171022] transition-colors hover:border-violet-300/30 hover:bg-[#1C142A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="origin-left scale-[0.85] transform">
          <NexiWordmark compact />
        </span>
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-[#A995FF]"
          aria-hidden="true"
        />
      </div>
      <div className={`${compact ? "mt-2" : "mt-4"} min-w-0`}>
        <p className="truncate text-sm font-semibold text-white">
          {displayName !== "—" ? displayName : t("profile")}
        </p>
        <p className="mt-1 truncate font-mono text-[11px] text-[#C3BBD0]">
          {profileId === "—" ? profileId : shortenId(profileId)}
        </p>
      </div>
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-violet-300/10 bg-black/15 px-2.5 py-2">
            <p className="text-[#8C8299]">{t("score")}</p>
            <p className="mt-1 font-medium text-[#F8F6FF]">—</p>
          </div>
          <div className="rounded-xl border border-violet-300/10 bg-black/15 px-2.5 py-2">
            <p className="text-[#8C8299]">{t("vipLevel")}</p>
            <p className="mt-1 truncate font-medium text-[#F8F6FF]">{vipLabel}</p>
          </div>
        </div>
      )}
      <div
        className={`${compact ? "mt-2" : "mt-3"} flex items-center gap-2 text-[11px] text-[#C3BBD0]`}
        aria-live="polite"
      >
        <span
          className={`h-2 w-2 rounded-full ${statusClass}`}
          aria-hidden="true"
        />
        <span>
          {t("userStatus")}: {statusLabel}
        </span>
      </div>
    </Link>
  );
}

function shortenId(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}

export default function AccountIdentityHeader({
  onNavigate,
  compact = false,
}: AccountIdentityHeaderProps) {
  const { t } = useLocale();
  const [sessionPresent, setSessionPresent] = useState(false);
  const [principalId, setPrincipalId] = useState<string | null>(sessionPrincipalId());
  const sessionQuery = useQuery<WalletProfile>({
    queryKey: ["user", "me", principalId],
    queryFn: loadCurrentUser,
    enabled: sessionPresent && Boolean(principalId),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const syncSession = () => {
      const hasSession = hasAuthSession();
      setSessionPresent(hasSession);
      setPrincipalId(sessionPrincipalId());
    };
    syncSession();
    window.addEventListener("nexi:wallet-session", syncSession);
    return () => window.removeEventListener("nexi:wallet-session", syncSession);
  }, []);

  const state = accountState(sessionPresent, sessionQuery);
  const profileId =
    state === "LIVE" ? authoritativeValue(sessionQuery.data?.id) : "—";
  const displayName =
    state === "LIVE" ? authoritativeValue(sessionQuery.data?.displayName) : "—";
  const vip = state === "LIVE" ? sessionQuery.data?.vip ?? null : null;
  const vipLevel = vip?.level ?? null;
  const vipName = vip?.name?.trim() || null;
  const vipLabel = accountVipLabel(state, vipLevel, vipName, t);
  return (
    <AccountIdentityCard
      compact={compact}
      displayName={displayName}
      onNavigate={onNavigate}
      profileId={profileId}
      state={state}
      t={t}
      vipLabel={vipLabel}
    />
  );
}
