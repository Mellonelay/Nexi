import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Environment, RoleId } from "../types";
import { hasPermission, ROLES } from "../config/roles";
import type { Permission } from "../types";
import type { AdminDataProvider } from "../data/provider";

interface AdminSession {
  actorId: string | null;
  environment: Environment;
  setEnvironment: (e: Environment) => void;
  roleId: RoleId;
  roleLabel: string;
  setRoleId: (r: RoleId) => void;
  actorName: string;
  identityStatus: "local" | "loading" | "ready" | "unavailable";
  effectivePermissions: Permission[];
  can: (p: Permission) => boolean;
}

const Ctx = createContext<AdminSession | null>(null);

export function AdminSessionProvider({
  children,
  provider,
}: {
  children: ReactNode;
  provider: AdminDataProvider;
}) {
  const isLiveProvider = Boolean(provider.getAdminIdentity);
  const [environment, setEnvironment] = useState<Environment>("SANDBOX");
  const [actorId, setActorId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<RoleId>("super_admin");
  const [roleLabel, setRoleLabel] = useState(
    isLiveProvider ? "Loading identity…" : ROLES.super_admin.label,
  );
  const [actorName, setActorName] = useState(
    isLiveProvider ? "Loading identity…" : ROLES.super_admin.label,
  );
  const [effectivePermissions, setEffectivePermissions] = useState<Permission[]>([]);
  const [identityReady, setIdentityReady] = useState(!isLiveProvider);
  const [identityStatus, setIdentityStatus] = useState<AdminSession["identityStatus"]>(
    isLiveProvider ? "loading" : "local",
  );

  useEffect(() => {
    let active = true;
    if (!provider.getAdminIdentity) {
      setEffectivePermissions([]);
      setIdentityReady(true);
      setIdentityStatus("local");
      return () => {
        active = false;
      };
    }
    setIdentityReady(false);
    setIdentityStatus("loading");
    provider
      .getAdminIdentity()
      .then((identity) => {
        if (!active) return;
        setActorId(identity.id);
        if (identity.roleId && identity.roleId in ROLES) {
          setRoleId(identity.roleId);
        }
        setActorName(identity.email || identity.roleLabel || "Unassigned admin");
        setRoleLabel(
          identity.roleLabel ??
            (identity.roleId && identity.roleId in ROLES
              ? ROLES[identity.roleId].label
              : "Unassigned"),
        );
        setEffectivePermissions(identity.effectivePermissions);
        setEnvironment(identity.environment ?? "SANDBOX");
        setIdentityReady(true);
        setIdentityStatus("ready");
      })
      .catch(() => {
        if (active) {
          setActorName("Identity unavailable");
          setRoleLabel("Identity unavailable");
          setIdentityReady(true);
          setIdentityStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [provider]);

  const value = useMemo<AdminSession>(() => {
    return {
      actorId,
      environment,
      setEnvironment,
      roleId,
      roleLabel: isLiveProvider ? roleLabel : ROLES[roleId].label,
      setRoleId,
      actorName,
      identityStatus,
      effectivePermissions,
      can: (p) =>
        identityReady &&
        (provider.getAdminIdentity ? effectivePermissions.includes(p) : hasPermission(roleId, p)),
    };
  }, [
    actorName,
    actorId,
    effectivePermissions,
    environment,
    identityReady,
    identityStatus,
    isLiveProvider,
    provider,
    roleId,
    roleLabel,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminSession(): AdminSession {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return v;
}
