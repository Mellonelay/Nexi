"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { normalizePublicBanners, type PublicBannerScope, type PublicBanner } from "../state/public-settings";

function scopeForPath(pathname: string): PublicBannerScope {
  if (pathname.startsWith("/dashboard/spot")) return "spot";
  if (pathname.startsWith("/dashboard/binary")) return "binary";
  if (pathname.startsWith("/dashboard/wallet")) return "wallets";
  return "global";
}

const severityClasses = {
  info: "border-cyan-400/25 bg-cyan-950/30 text-cyan-100",
  warning: "border-amber-400/30 bg-amber-950/30 text-amber-100",
  critical: "border-rose-400/35 bg-rose-950/35 text-rose-100",
} as const;

export default function PublicBanners() {
  const pathname = usePathname();
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const scope = scopeForPath(pathname);

  useEffect(() => {
    let active = true;
    void api.get<unknown>("/public/config/banners")
      .then(({ data }) => {
        if (active) setBanners(normalizePublicBanners(data, scope));
      })
      .catch(() => {
        if (active) setBanners([]);
      });
    return () => {
      active = false;
    };
  }, [scope]);

  if (banners.length === 0) return null;
  return (
    <section aria-label="Public notices" className="space-y-2 px-4 pt-3 sm:px-6">
      {banners.map((banner) => (
        <div
          key={banner.id}
          role={banner.severity === "critical" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${severityClasses[banner.severity]}`}
        >
          {banner.message}
        </div>
      ))}
    </section>
  );
}
