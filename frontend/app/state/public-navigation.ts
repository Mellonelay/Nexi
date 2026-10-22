"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import { hasAuthSession } from "../lib/auth-session";
import {
  normalizePublicNavigation,
  normalizePublicRoutes,
  type PublicNavigationDestination,
} from "./public-settings";

export function usePublicNavigation(
  surface: "bottom" | "drawer",
  defaults: readonly string[],
): PublicNavigationDestination[] {
  const [items, setItems] = useState<PublicNavigationDestination[]>(() =>
    normalizePublicNavigation(null, surface, defaults, normalizePublicRoutes(null), true),
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [navigation, routes] = await Promise.all([
        api.get<unknown>("/public/config/navigation").then(({ data }) => data).catch(() => null),
        api.get<unknown>("/public/config/routes").then(({ data }) => data).catch(() => null),
      ]);
      if (active) {
        setItems(normalizePublicNavigation(
          navigation,
          surface,
          defaults,
          normalizePublicRoutes(routes),
          hasAuthSession(),
        ));
      }
    };
    void load();
    window.addEventListener("nexi:wallet-session", load);
    return () => {
      active = false;
      window.removeEventListener("nexi:wallet-session", load);
    };
  }, [defaults, surface]);

  return items;
}
