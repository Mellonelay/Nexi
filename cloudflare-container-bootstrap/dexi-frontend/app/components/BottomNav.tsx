"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Coins, Home, LineChart, Wallet } from "lucide-react";
import { useLocale } from "../state/LocaleProvider";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: Home },
  { key: "spot", href: "/dashboard/spot", icon: LineChart },
  { key: "options", href: "/dashboard/binary", icon: BarChart3 },
  { key: "wallet", href: "/dashboard/wallet", icon: Wallet },
  { key: "earn", href: "/dashboard/mining", icon: Coins },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("primary")}
      className="relative z-50 shrink-0 px-3 pb-[calc(4px+env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      <div className="nexi-bottom-nav mx-auto grid h-[60px] max-w-[420px] grid-cols-5 items-center rounded-[18px] border px-1 backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] ${active ? "text-violet-300" : "text-[var(--nexi-text-secondary)] hover:bg-white/[0.03] hover:text-white"}`}
            >
              {active && (
                <span
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--nexi-cal-violet-bright)] shadow-[0_0_12px_rgba(124,58,237,.72)]"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`relative h-[19px] w-[19px] ${active ? "text-violet-300 drop-shadow-[0_0_7px_rgba(115,83,221,.6)]" : ""}`}
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <span className="relative">
                {t(item.key as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
