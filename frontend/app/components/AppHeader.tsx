"use client";

import { Bell, Languages } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../state/LocaleProvider";
import { localeLabel } from "../state/locale";
import WalletConnectControl from "./WalletConnectControl";
import NavigationDrawer from "./NavigationDrawer";
import AssetIcon from "./AssetIcon";
import { NexiWordmark } from "../dashboard/components/QuotesHubVisuals";
import { NotificationsPanel } from "./NotificationsPanel";

export default function AppHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const { locale, setLocale, languages, t } = useLocale();
  return (
    <header className="nexi-app-header nexi-safe-area-header nexi-topbar relative z-40 flex h-auto min-h-14 w-full max-w-full min-w-0 flex-wrap items-center gap-[8px] border-b border-violet-300/15 md:min-h-16">
      <div className="lg:hidden min-w-0">
        <NavigationDrawer
          triggerContent={
            <span className="contents max-[359px]:[&>span>span:last-child]:hidden">
              <NexiWordmark compact />
            </span>
          }
        />
      </div>
      <div className="hidden min-w-0 flex-1 lg:block" aria-hidden="true" />
      <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-[6px] md:flex-nowrap md:gap-2">
        <span
          aria-label="Ethereum network"
          title="Ethereum network"
          className="nexi-header-icon hidden h-[40px] w-[40px] shrink-0 sm:flex"
        >
          <AssetIcon
            item={{
              assetId: "ETH",
              symbol: "ETH",
              displaySymbol: "ETH",
              name: "Ethereum",
            }}
          />
        </span>
        <WalletConnectControl compact />
        <label
          className="nexi-header-icon relative h-[44px] w-[44px] shrink-0 cursor-pointer focus-within:ring-2 focus-within:ring-[#A995FF] focus-within:ring-offset-2 focus-within:ring-offset-[#08060D]"
          title={t("languageSelection")}
        >
          <Languages className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="sr-only">{t("languageSelection")}</span>
          <select
            aria-label={t("languageSelection")}
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {languages.map((item) => (
              <option key={item.code} value={item.code}>
                {localeLabel(item.code)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label={
            unreadCount !== null && unreadCount > 0
              ? t("notifications") + ", " + unreadCount + " unread"
              : t("notifications")
          }
          aria-controls="nexi-notifications-panel"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((open) => !open)}
          className="nexi-header-icon relative h-[44px] w-[44px] shrink-0"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          {unreadCount !== null && unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 min-w-4 rounded-full bg-[#6d41ff] px-1 text-center text-[10px] font-bold leading-4 text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </header>
  );
}
