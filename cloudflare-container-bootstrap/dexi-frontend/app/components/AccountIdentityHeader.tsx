"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "../state/LocaleProvider";
import { authoritativeValue } from "../lib/product-states";
import { loadCurrentUser, type WalletProfile } from "../lib/wallet-auth";
import { NexiWordmark } from "../dashboard/components/QuotesHubVisuals";

type AccountIdentityHeaderProps = {
  onNavigate?: () => void;
  compact?: boolean;
};

function shortenId(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}

export default function AccountIdentityHeader({
  onNavigate,
  compact = false,
}: AccountIdentityHeaderProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [sessionPresent, setSessionPresent] = useState(false);
  const sessionQuery = useQuery<WalletProfile>({
    queryKey: ["user", "me"],
    queryFn: loadCurrentUser,
    enabled: sessionPresent,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const syncSession = () => {
      const hasSession = Boolean(window.localStorage.getItem("token"));
      setSessionPresent(hasSession);
      if (hasSession)
        void queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    };
    syncSession();
    window.addEventListener("nexi:wallet-session", syncSession);
    return () => window.removeEventListener("nexi:wallet-session", syncSession);
  }, [queryClient]);

  const state = !sessionPresent
    ? "UNAVAILABLE"
    : sessionQuery.isLoading
      ? "LOADING"
      : sessionQuery.isError
        ? "ERROR"
        : sessionQuery.data
          ? "LIVE"
          : "UNAVAILABLE";
  const profileId =
    state === "LIVE" ? authoritativeValue(sessionQuery.data?.id) : "—";
  const displayName =
    state === "LIVE" ? authoritativeValue(sessionQuery.data?.displayName) : "—";
  const statusLabel =
    state === "LOADING"
      ? t("loadingAccount")
      : state === "LIVE"
        ? "LIVE"
        : t("accountUnavailable");
  const statusClass =
    state === "LIVE"
      ? "bg-[#48C0CC]"
      : state === "LOADING"
        ? "bg-[#A995FF]"
        : "bg-[#8C8299]";

  return (
    <Link
      href="/dashboard/profile"
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
            <p className="mt-1 font-medium text-[#F8F6FF]">—</p>
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
