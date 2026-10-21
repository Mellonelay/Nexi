"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import { hasAuthSession } from "../lib/auth-session";

type PublicNavigationItem = {
  surface: "bottom" | "drawer";
  target: string;
  audience: "public" | "authenticated" | "vip" | "internal";
  visible: boolean;
  order: number;
};

export function usePublicNavigation(
  surface: PublicNavigationItem["surface"],
  defaults: readonly string[],
) {
  const [targets, setTargets] = useState<string[]>([...defaults]);

  useEffect(() => {
    let active = true;
    const load = () => {
      void api.get<unknown>("/public/config/navigation").then(({ data }) => {
        if (!active || !Array.isArray(data)) return;
        const allowedTargets = new Set(defaults);
        const resolved = data
          .flatMap((value: unknown) => {
            if (typeof value !== "object" || value === null) return [];
            const item = value as Partial<PublicNavigationItem>;
            if (
              item.surface !== surface ||
              typeof item.target !== "string" ||
              !allowedTargets.has(item.target) ||
              !["public", "authenticated", "vip", "internal"].includes(
                String(item.audience),
              ) ||
              typeof item.visible !== "boolean" ||
              !Number.isInteger(item.order)
            )
              return [];
            return [item as PublicNavigationItem];
          })
          .filter(
            (item) =>
              item.visible &&
              (item.audience === "public" ||
                (item.audience === "authenticated" && hasAuthSession())),
          )
          .sort((left, right) => left.order - right.order)
          .map((item) => item.target);
        setTargets(resolved);
      })
      .catch(() => undefined);
    };
    load();
    window.addEventListener("nexi:wallet-session", load);
    return () => {
      active = false;
      window.removeEventListener("nexi:wallet-session", load);
    };
  }, [defaults, surface]);

  return targets;
}
