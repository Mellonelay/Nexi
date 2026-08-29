import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MonitorSmartphone,
  LayoutTemplate,
  Menu as MenuIcon,
  Languages,
  Flag,
  Coins,
  Network,
  Radio,
  CandlestickChart,
  Timer,
  Scale,
  TrendingUp,
  Wallet,
  BookOpen,
  ArrowDownToLine,
  ArrowUpToLine,
  GitCompare,
  Pickaxe,
  Landmark,
  LifeBuoy,
  MessageSquare,
  Megaphone,
  GraduationCap,
  Bell,
  UserCog,
  KeyRound,
  CheckCheck,
  ScrollText,
  Activity,
  Wrench,
  FlaskConical,
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
  sandboxOnly?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        to: "/overview",
        label: "Operations Overview",
        icon: LayoutDashboard,
        permission: "overview.view",
      },
    ],
  },
  {
    id: "identity",
    label: "Identity",
    items: [
      { to: "/users", label: "Users", icon: Users, permission: "users.view" },
      { to: "/kyc", label: "KYC Reviews", icon: ShieldCheck, permission: "kyc.view" },
      { to: "/sessions", label: "Sessions", icon: MonitorSmartphone, permission: "sessions.view" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        to: "/frontend-control",
        label: "Frontend Control",
        icon: LayoutTemplate,
        permission: "frontend.view",
      },
      { to: "/navigation", label: "Navigation", icon: MenuIcon, permission: "navigation.view" },
      {
        to: "/localization",
        label: "Localization",
        icon: Languages,
        permission: "localization.view",
      },
      { to: "/feature-flags", label: "Feature Flags", icon: Flag, permission: "flags.view" },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    items: [
      { to: "/assets", label: "Assets", icon: Coins, permission: "assets.view" },
      { to: "/networks", label: "Networks", icon: Network, permission: "networks.view" },
      { to: "/market-feeds", label: "Market Feeds", icon: Radio, permission: "feeds.view" },
      {
        to: "/spot",
        label: "Spot Administration",
        icon: CandlestickChart,
        permission: "spot.view",
      },
      { to: "/binary", label: "Binary Administration", icon: Timer, permission: "binary.view" },
      { to: "/settlements", label: "Settlements", icon: Scale, permission: "settlements.view" },
      { to: "/exposure", label: "Exposure", icon: TrendingUp, permission: "exposure.view" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { to: "/wallets", label: "Wallets", icon: Wallet, permission: "wallets.view" },
      { to: "/ledger", label: "Ledger", icon: BookOpen, permission: "ledger.view" },
      { to: "/deposits", label: "Deposits", icon: ArrowDownToLine, permission: "deposits.view" },
      {
        to: "/withdrawals",
        label: "Withdrawals",
        icon: ArrowUpToLine,
        permission: "withdrawals.view",
      },
      {
        to: "/reconciliation",
        label: "Reconciliation",
        icon: GitCompare,
        permission: "reconciliation.view",
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    items: [
      { to: "/mining", label: "Mining", icon: Pickaxe, permission: "mining.view" },
      { to: "/loans", label: "Loans", icon: Landmark, permission: "loans.view" },
    ],
  },
  {
    id: "comms",
    label: "Communication",
    items: [
      { to: "/support", label: "Support", icon: LifeBuoy, permission: "support.view" },
      { to: "/messages", label: "Messages", icon: MessageSquare, permission: "messages.view" },
      {
        to: "/announcements",
        label: "Announcements",
        icon: Megaphone,
        permission: "announcements.view",
      },
      { to: "/learn", label: "Learn Content", icon: GraduationCap, permission: "learn.view" },
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        permission: "notifications.view",
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { to: "/admins", label: "Admin Accounts", icon: UserCog, permission: "admins.view" },
      { to: "/roles", label: "Roles & Permissions", icon: KeyRound, permission: "roles.view" },
      { to: "/approvals", label: "Approvals", icon: CheckCheck, permission: "approvals.view" },
      { to: "/audit", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
      { to: "/health", label: "System Health", icon: Activity, permission: "health.view" },
      { to: "/maintenance", label: "Maintenance", icon: Wrench, permission: "maintenance.view" },
      {
        to: "/sandbox",
        label: "Sandbox Controls",
        icon: FlaskConical,
        permission: "sandbox.view",
        sandboxOnly: true,
      },
    ],
  },
];

export const ALL_ROUTES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function findRoute(path: string): NavItem | undefined {
  return ALL_ROUTES.find((r) => r.to === path);
}
