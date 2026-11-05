import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LayoutTemplate,
  Menu as MenuIcon,
  Flag,
  Coins,
  Network,
  Radio,
  CandlestickChart,
  Timer,
  Scale,
  BookOpen,
  ArrowDownToLine,
  ArrowUpToLine,
  Pickaxe,
  Landmark,
  MessageSquare,
  Megaphone,
  GraduationCap,
  Bell,
  UserCog,
  Wrench,
} from "lucide-react";
import type { Permission } from "../types";

export type RoutePath =
  | "/overview"
  | "/users"
  | "/kyc"
  | "/sessions"
  | "/frontend-control"
  | "/navigation"
  | "/localization"
  | "/feature-flags"
  | "/assets"
  | "/networks"
  | "/market-feeds"
  | "/spot"
  | "/binary"
  | "/settlements"
  | "/exposure"
  | "/wallets"
  | "/ledger"
  | "/deposits"
  | "/withdrawals"
  | "/reconciliation"
  | "/mining"
  | "/loans"
  | "/support"
  | "/messages"
  | "/announcements"
  | "/learn"
  | "/notifications"
  | "/admins"
  | "/roles"
  | "/approvals"
  | "/audit"
  | "/health"
  | "/maintenance"
  | "/sandbox";

export interface NavItem {
  to: RoutePath;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  anyPermissions?: Permission[];
  sandboxOnly?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  primary: RoutePath;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    primary: "/overview",
    items: [
      {
        to: "/overview",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "overview.view",
      },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    primary: "/users",
    items: [
      { to: "/users", label: "Clients", icon: Users, permission: "users.view" },
      { to: "/kyc", label: "KYC Reviews", icon: ShieldCheck, permission: "kyc.view" },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    primary: "/binary",
    items: [
      { to: "/binary", label: "Binary · Ongoing", icon: Timer, permission: "binary.view" },
      {
        to: "/settlements",
        label: "History & Settlements",
        icon: Scale,
        permission: "settlements.view",
      },
      {
        to: "/spot",
        label: "Spot & Margin",
        icon: CandlestickChart,
        permission: "spot.view",
      },
    ],
  },
  {
    id: "wallet-finance",
    label: "Wallet & Finance",
    primary: "/networks",
    items: [
      {
        to: "/networks",
        label: "Deposit Wallet Settings",
        icon: Network,
        permission: "networks.view",
      },
      { to: "/deposits", label: "Deposits", icon: ArrowDownToLine, permission: "deposits.view" },
      {
        to: "/withdrawals",
        label: "Withdrawals",
        icon: ArrowUpToLine,
        permission: "withdrawals.view",
      },
      { to: "/ledger", label: "Ledger", icon: BookOpen, permission: "ledger.view" },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    primary: "/assets",
    items: [
      { to: "/assets", label: "Assets", icon: Coins, permission: "assets.view" },
      { to: "/market-feeds", label: "Price Data Sources", icon: Radio, permission: "feeds.view" },
    ],
  },
  {
    id: "products",
    label: "Products",
    primary: "/mining",
    items: [
      { to: "/mining", label: "Mining", icon: Pickaxe, permission: "mining.view" },
      { to: "/loans", label: "Loans", icon: Landmark, permission: "loans.view" },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    primary: "/messages",
    items: [
      { to: "/messages", label: "Messages", icon: MessageSquare, permission: "messages.view" },
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        permission: "notifications.view",
        anyPermissions: ["operator_alerts.view"],
      },
      {
        to: "/announcements",
        label: "Announcements",
        icon: Megaphone,
        permission: "announcements.view",
      },
      { to: "/learn", label: "Learn Content", icon: GraduationCap, permission: "learn.view" },
    ],
  },
  {
    id: "settings",
    label: "Administration & Settings",
    primary: "/frontend-control",
    items: [
      {
        to: "/frontend-control",
        label: "Public App Settings",
        icon: LayoutTemplate,
        permission: "frontend.view",
      },
      {
        to: "/navigation",
        label: "Public Navigation",
        icon: MenuIcon,
        permission: "navigation.view",
      },
      { to: "/feature-flags", label: "Feature Controls", icon: Flag, permission: "flags.view" },
      { to: "/admins", label: "Admin Accounts", icon: UserCog, permission: "admins.view" },
      { to: "/maintenance", label: "Maintenance", icon: Wrench, permission: "maintenance.view" },
    ],
  },
];

export const ALL_ROUTES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function getVisibleNavGroups(can: (permission: Permission) => boolean): NavGroup[] {
  return NAV_GROUPS.flatMap((group) => {
    const items = group.items.filter((item) => can(item.permission) || item.anyPermissions?.some(can));
    if (items.length === 0) return [];
    return [
      {
        ...group,
        primary: items.some((item) => item.to === group.primary) ? group.primary : items[0].to,
        items,
      },
    ];
  });
}

export function findRoute(path: string): NavItem | undefined {
  return ALL_ROUTES.find((r) => r.to === path);
}
