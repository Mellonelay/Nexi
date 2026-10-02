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
  const { locale, setLocale, languages, t } = useLocale();
  return (
    <header className="nexi-app-header relative z-40 flex h-[56px] min-w-0 items-center gap-[8px] border-b border-violet-300/15 px-[12px] md:h-[64px] md:px-6">
      <div className="lg:hidden min-w-0">
        <NavigationDrawer triggerContent={<NexiWordmark compact />} />
      </div>
      <div className="hidden min-w-0 flex-1 lg:block" aria-hidden="true" />
      <div className="ml-auto flex min-w-0 items-center gap-[6px] md:gap-2">
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
          className="nexi-header-icon relative h-[44px] w-[44px] shrink-0 cursor-pointer"
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
          aria-label={t("notifications")}
          aria-controls="nexi-notifications-panel"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((open) => !open)}
          className="nexi-header-icon relative h-[44px] w-[44px] shrink-0"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
}
