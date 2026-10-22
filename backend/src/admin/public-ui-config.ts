import { BadRequestException } from "@nestjs/common";

export const PUBLIC_ROUTE_DEFINITIONS = [
  { id: "dashboard", path: "/dashboard", label: "Dashboard" },
  { id: "spot", path: "/dashboard/spot", label: "Spot/Margin" },
  { id: "binary", path: "/dashboard/binary", label: "Options" },
  { id: "wallet", path: "/dashboard/wallet", label: "Wallet" },
  { id: "mining", path: "/dashboard/mining", label: "Earn" },
  { id: "loans", path: "/dashboard/loans", label: "Loans" },
  { id: "messages", path: "/dashboard/messages", label: "Messages" },
  { id: "announcements", path: "/dashboard/announcement", label: "Announcements" },
  { id: "learn", path: "/dashboard/learn", label: "Learn" },
  { id: "support", path: "/dashboard/support", label: "Support" },
  { id: "settings", path: "/dashboard/settings", label: "Settings" },
] as const;

const routeStates = new Set(["public", "authenticated", "hidden", "maintenance"]);
const bannerSeverities = new Set(["info", "warning", "critical"]);
const bannerScopes = new Set(["global", "spot", "binary", "wallets"]);

type PublicRouteState = "public" | "authenticated" | "hidden" | "maintenance";
type PublicRouteSetting = {
  id: string;
  path: string;
  state: PublicRouteState;
  order: number;
  unavailableMessage?: string;
};

export function normalizePublicRouteSettings(value: unknown): PublicRouteSetting[] {
  const configured = new Map<string, PublicRouteSetting>();
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== "object" || entry === null) continue;
      const item = entry as Record<string, unknown>;
      const definition = PUBLIC_ROUTE_DEFINITIONS.find(
        (route) => route.id === item.id && route.path === item.path,
      );
      if (!definition || !routeStates.has(String(item.state))) continue;
      const state = item.state as PublicRouteState;
      const message = item.unavailableMessage;
      if (
        (state === "hidden" || state === "maintenance") &&
        (typeof message !== "string" || message.trim().length < 4 || message.length > 300)
      ) continue;
      if (
        item.order !== undefined &&
        (typeof item.order !== "number" || !Number.isSafeInteger(item.order) || item.order < 1 || item.order > 1000)
      ) continue;
      if (configured.has(definition.id)) continue;
      configured.set(definition.id, {
        id: definition.id,
        path: definition.path,
        state,
        order: typeof item.order === "number" ? item.order : PUBLIC_ROUTE_DEFINITIONS.indexOf(definition) + 1,
        ...((state === "hidden" || state === "maintenance") && typeof message === "string"
          ? { unavailableMessage: message }
          : {}),
      });
    }
  }

  return PUBLIC_ROUTE_DEFINITIONS.map((route, index) =>
    configured.get(route.id) ?? {
      id: route.id,
      path: route.path,
      state: "public",
      order: index + 1,
    },
  );
}

export function assertPublicRouteSettings(value: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BadRequestException("Invalid Public route configuration");
  }
  if (!Array.isArray(parsed) || parsed.length !== PUBLIC_ROUTE_DEFINITIONS.length)
    throw new BadRequestException("Public route configuration must include every supported route");

  const normalized = normalizePublicRouteSettings(parsed);
  const ids = new Set(parsed.map((item) => (item as Record<string, unknown>)?.id));
  const orders = new Set(parsed.map((item) => (item as Record<string, unknown>)?.order));
  if (
    normalized.length !== parsed.length ||
    ids.size !== PUBLIC_ROUTE_DEFINITIONS.length ||
    orders.size !== PUBLIC_ROUTE_DEFINITIONS.length ||
    parsed.some((item) => {
      if (typeof item !== "object" || item === null) return true;
      const row = item as Record<string, unknown>;
      return !PUBLIC_ROUTE_DEFINITIONS.some((route) => route.id === row.id && route.path === row.path) ||
        typeof row.label !== "string" || row.label.trim().length === 0 || row.label.length > 80 ||
        typeof row.order !== "number" || !Number.isSafeInteger(row.order) || row.order < 1 || row.order > 1000 ||
        !routeStates.has(String(row.state)) ||
        ((row.state === "hidden" || row.state === "maintenance") &&
          (typeof row.unavailableMessage !== "string" || row.unavailableMessage.trim().length < 4 || row.unavailableMessage.length > 300));
    })
  ) throw new BadRequestException("Public route configuration contains an unsupported or invalid route");
}

export function normalizePublicBanners(value: unknown, now = Date.now()) {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(item.id) || ids.has(item.id) ||
      typeof item.message !== "string" || item.message.trim().length === 0 || item.message.length > 500 ||
      !bannerSeverities.has(String(item.severity)) || item.active !== true ||
      !bannerScopes.has(String(item.scope))
    ) return [];
    const start = item.startsAt === undefined ? undefined : Date.parse(String(item.startsAt));
    const end = item.endsAt === undefined ? undefined : Date.parse(String(item.endsAt));
    if (
      (start !== undefined && !Number.isFinite(start)) ||
      (end !== undefined && !Number.isFinite(end)) ||
      (start !== undefined && start > now) ||
      (end !== undefined && end <= now) ||
      (start !== undefined && end !== undefined && start >= end)
    ) return [];
    ids.add(item.id);
    return [{
      id: item.id,
      message: item.message,
      severity: item.severity,
      scope: item.scope,
      active: true as const,
    }];
  });
}

export function assertPublicBannerSettings(value: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BadRequestException("Invalid Public banner configuration");
  }
  if (!Array.isArray(parsed) || parsed.length > 50)
    throw new BadRequestException("Public banner configuration must contain at most 50 banners");
  const ids: unknown[] = [];
  const valid = parsed.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(item.id) ||
      typeof item.message !== "string" || item.message.trim().length === 0 || item.message.length > 500 ||
      !bannerSeverities.has(String(item.severity)) || typeof item.active !== "boolean" ||
      !bannerScopes.has(String(item.scope))
    ) return false;
    const start = item.startsAt === undefined ? undefined : Date.parse(String(item.startsAt));
    const end = item.endsAt === undefined ? undefined : Date.parse(String(item.endsAt));
    if (
      (item.startsAt !== undefined && typeof item.startsAt !== "string") ||
      (item.endsAt !== undefined && typeof item.endsAt !== "string") ||
      (start !== undefined && !Number.isFinite(start)) ||
      (end !== undefined && !Number.isFinite(end)) ||
      (start !== undefined && end !== undefined && start >= end)
    ) return false;
    ids.push(item.id);
    return true;
  });
  if (!valid)
    throw new BadRequestException("Public banner configuration contains an unsupported or invalid banner");
  if (new Set(ids).size !== ids.length)
    throw new BadRequestException("Public banner IDs must be unique");
}
