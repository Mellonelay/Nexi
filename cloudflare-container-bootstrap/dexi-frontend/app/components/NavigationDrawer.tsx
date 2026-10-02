"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  HelpCircle,
  Home,
  Languages,
  Landmark,
  LineChart,
  MessageSquare,
  Settings,
  TrendingUp,
  Wallet,
  X,
  Zap,
  Bell,
  Megaphone,
} from "lucide-react";
import { localeLabel } from "../state/locale";
import { useLocale } from "../state/LocaleProvider";
import type { UiMessageKey } from "../state/messages";
import AccountIdentityHeader from "./AccountIdentityHeader";

type DrawerItem = { key: UiMessageKey; href: string; icon: typeof Home };
const groups: Array<{ titleKey: UiMessageKey; items: DrawerItem[] }> = [
  {
    titleKey: "primary",
    items: [
      { key: "dashboard", href: "/dashboard", icon: Home },
      { key: "spotTrading", href: "/dashboard/spot", icon: LineChart },
      { key: "optionsBinary", href: "/dashboard/binary", icon: TrendingUp },
      { key: "wallet", href: "/dashboard/wallet", icon: Wallet },
      { key: "earnMining", href: "/dashboard/mining", icon: Zap },
      { key: "loan", href: "/dashboard/loans", icon: Landmark },
    ],
  },
  {
    titleKey: "communicationContent",
    items: [
      { key: "messages", href: "/dashboard/messages", icon: MessageSquare },
      {
        key: "announcements",
        href: "/dashboard/announcement",
        icon: Megaphone,
      },
      { key: "learn", href: "/dashboard/learn", icon: BookOpen },
      { key: "support", href: "/dashboard/support", icon: HelpCircle },
    ],
  },
  {
    titleKey: "accountSystem",
    items: [{ key: "settings", href: "/dashboard/settings", icon: Settings }],
  },
];
const isActive = (pathname: string, href: string) =>
  pathname === href ||
  (href !== "/dashboard" && pathname.startsWith(`${href}/`));

export default function NavigationDrawer({
  triggerContent,
}: {
  triggerContent?: ReactNode;
}) {
  const pathname = usePathname();
  const { locale, setLocale, languages, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);
  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
    setLanguage(false);
  };
  return (
    <>
      <button
        type="button"
        aria-label={t("openApplicationMenu")}
        aria-controls="nexi-application-drawer"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={
          triggerContent
            ? "inline-flex h-[44px] min-w-0 items-center rounded-xl px-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]"
            : "inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-violet-300/20 bg-black/20 text-white backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]"
        }
      >
        {triggerContent ? (
          <>
            <span className="sr-only">{t("openApplicationMenu")}</span>
            {triggerContent}
          </>
        ) : (
          <>
            <span className="sr-only">{t("openApplicationMenu")}</span>
            <span aria-hidden="true" className="flex flex-col gap-1">
              <i className="h-px w-4 bg-current" />
              <i className="h-px w-4 bg-current" />
              <i className="h-px w-4 bg-current" />
            </span>
          </>
        )}
      </button>
      <dialog
        ref={dialogRef}
        id="nexi-application-drawer"
        aria-labelledby="nexi-application-drawer-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="nexi-drawer fixed inset-y-0 left-0 m-0 flex h-[calc(100dvh-76px-env(safe-area-inset-bottom))] w-[84vw] max-w-[320px] flex-col overflow-y-auto overscroll-contain border-r border-violet-300/20 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <h2 id="nexi-application-drawer-title" className="sr-only">
              {t("openApplicationMenu")}
        </h2>
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            ref={closeRef}
            onClick={close}
            aria-label={t("closeApplicationMenu")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#C3BBD0] hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav
          className="flex-1"
          aria-label={language ? t("languageSelection") : t("primary")}
        >
          {!language && <AccountIdentityHeader onNavigate={close} compact />}
          {language ? (
            <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setLanguage(false)}
                    className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm text-[#C3BBD0]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("backToApplicationMenu")}
                  </button>
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLocale(item.code);
                        setLanguage(false);
                      }}
                      className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${locale === item.code ? "border-violet-300/45 bg-[#2A1742] text-white" : "border-transparent text-[#C3BBD0]"}`}
                    >
                      {item.label}
                      {locale === item.code && (
                        <Check className="h-4 w-4 text-[#48C0CC]" />
                      )}
                    </button>
                  ))}
            </div>
          ) : (
            <>
                  {groups.map((group) => (
                    <div key={group.titleKey} className="mb-5">
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C8299]">
                        {t(group.titleKey)}
                      </p>
                      <div className="space-y-1">
                        {group.items.map(({ key, href, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={close}
                            aria-current={
                              isActive(pathname, href) ? "page" : undefined
                            }
                            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${isActive(pathname, href) ? "border border-violet-300/25 bg-[#2A1742] text-white" : "text-[#C3BBD0] hover:bg-white/5 hover:text-white"}`}
                          >
                            <Icon
                              className="h-4 w-4 text-[#A995FF]"
                              aria-hidden="true"
                            />
                            {t(key)}
                          </Link>
                        ))}
                        {group.titleKey === "accountSystem" && (
                          <button
                            type="button"
                            onClick={() => setLanguage(true)}
                            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-[#C3BBD0] hover:bg-white/5"
                          >
                            <Languages className="h-4 w-4 text-[#8C8299]" />
                            <span className="flex-1 text-left">
                              {t("language")}
                            </span>
                            <span className="text-xs text-[#8C8299]">
                              {localeLabel(locale)}
                            </span>
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
            </>
          )}
        </nav>
      </dialog>
    </>
  );
}
