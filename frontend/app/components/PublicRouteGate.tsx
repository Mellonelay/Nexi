"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import api from "../lib/api";
import { hasAuthSession } from "../lib/auth-session";
import {
  normalizePublicRoutes,
  publicRouteForPath,
  type PublicRouteSetting,
} from "../state/public-settings";

export default function PublicRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [routes, setRoutes] = useState<PublicRouteSetting[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    void api.get<unknown>("/public/config/routes")
      .then(({ data }) => {
        if (active) setRoutes(normalizePublicRoutes(data));
      })
      .catch(() => {
        if (active) setRoutes(normalizePublicRoutes(null));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncSession = () => setAuthenticated(hasAuthSession());
    syncSession();
    window.addEventListener("nexi:wallet-session", syncSession);
    return () => window.removeEventListener("nexi:wallet-session", syncSession);
  }, []);

  const route = publicRouteForPath(pathname, routes);
  if (
    route?.state === "hidden" ||
    route?.state === "maintenance" ||
    (route?.state === "authenticated" && !authenticated)
  ) {
    return (
      <section
        role={route.state === "maintenance" ? "status" : "alert"}
        aria-live="polite"
        className="mx-auto flex min-h-48 w-full max-w-3xl flex-col justify-center gap-2 px-4 py-8 text-white sm:px-6"
      >
        <h1 className="text-lg font-semibold">
          {route.state === "maintenance"
            ? "Temporarily unavailable"
            : route.state === "authenticated"
              ? "Sign in to continue"
              : "Page unavailable"}
        </h1>
        <p className="text-sm text-[#C3BBD0]">
          {route.unavailableMessage ??
            (route.state === "authenticated"
              ? "Connect your account to view this page."
              : "This page is not available right now.")}
        </p>
      </section>
    );
  }
  return children;
}
