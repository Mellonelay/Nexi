import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Environment, RoleId } from "../types";
import { hasPermission, ROLES } from "../config/roles";
import type { Permission } from "../types";
import { localProvider } from "../data/local-mock-provider";
import type { AdminDataProvider } from "../data/provider";

interface AdminSession {
  environment: Environment;
  setEnvironment: (e: Environment) => void;
  roleId: RoleId;
  setRoleId: (r: RoleId) => void;
  actorName: string;
  effectivePermissions: Permission[];
  can: (p: Permission) => boolean;
}

const Ctx = createContext<AdminSession | null>(null);

export function AdminSessionProvider({
  children,
  provider = localProvider,
}: {
  children: ReactNode;
  provider?: AdminDataProvider;
}) {
  const [environment, setEnvironment] = useState<Environment>("SANDBOX");
  const [roleId, setRoleId] = useState<RoleId>("super_admin");
  const [actorName, setActorName] = useState(ROLES.super_admin.label);
  const [effectivePermissions, setEffectivePermissions] = useState<Permission[]>([]);
  const [identityReady, setIdentityReady] = useState(!provider.getAdminIdentity);

  useEffect(() => {
    let active = true;
    if (!provider.getAdminIdentity) {
      setEffectivePermissions([]);
      setIdentityReady(true);
      return () => {
        active = false;
      };
    }
    setIdentityReady(false);
    provider
      .getAdminIdentity()
      .then((identity) => {
        if (!active) return;
        if (identity.roleId && identity.roleId in ROLES) {
          setRoleId(identity.roleId);
          setActorName(identity.email || identity.roleLabel || identity.roleId);
        }
        setEffectivePermissions(identity.effectivePermissions);
        setIdentityReady(true);
      })
      .catch(() => {
        if (active) setIdentityReady(true);
      });
    return () => {
      active = false;
    };
  }, [provider]);

  const value = useMemo<AdminSession>(() => {
    return {
      environment,
      setEnvironment,
      roleId,
      setRoleId,
      actorName,
      effectivePermissions,
      can: (p) =>
        identityReady &&
        (provider.getAdminIdentity ? effectivePermissions.includes(p) : hasPermission(roleId, p)),
    };
  }, [actorName, effectivePermissions, environment, identityReady, provider, roleId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminSession(): AdminSession {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return v;
}
