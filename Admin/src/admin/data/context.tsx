import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminDataProvider } from "./provider";
import { NexiAdminApiProvider } from "./nexi-api-provider";

export function createConfiguredAdminProvider(): AdminDataProvider {
  return new NexiAdminApiProvider({
    baseUrl:
      import.meta.env.VITE_ADMIN_API_BASE_URL ??
      (import.meta.env.DEV ? "http://127.0.0.1:3200" : "https://api.nexitrading.app"),
    getToken: async () => sessionStorage.getItem("nexi.admin.access_token") ?? "",
    getRefreshToken: async () => sessionStorage.getItem("nexi.admin.refresh_token") ?? "",
    setTokens: (accessToken, refreshToken) => {
      sessionStorage.setItem("nexi.admin.access_token", accessToken);
      sessionStorage.setItem("nexi.admin.refresh_token", refreshToken);
    },
  });
}

const configuredProvider = createConfiguredAdminProvider();

export function getConfiguredAdminProvider(): AdminDataProvider {
  return configuredProvider;
}
const AdminDataContext = createContext<AdminDataProvider>(configuredProvider);

export function AdminDataProviderScope({
  children,
  provider = configuredProvider,
}: {
  children: ReactNode;
  provider?: AdminDataProvider;
}) {
  return <AdminDataContext.Provider value={provider}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataProvider {
  return useContext(AdminDataContext);
}

/** Force re-render when the provider notifies (any mutation). */
export function useProviderRevision(): number {
  const provider = useAdminData();
  const [revision, setRevision] = useState(0);
  useEffect(() => provider.subscribe(() => setRevision((value) => value + 1)), [provider]);
  return revision;
}

/** Simple async loader hook with loading/error state, revalidates on provider updates. */
import { useCallback } from "react";
export function useAdminQuery<T>(
  fetcher: (p: AdminDataProvider) => Promise<T>,
  deps: unknown[] = [],
): {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refresh: () => void;
} {
  const provider = useAdminData();
  const rev = useProviderRevision();
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher(provider)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(undefined);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, rev, tick, ...deps]);

  return { data, loading, error, refresh };
}
