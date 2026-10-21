import { EventClient } from "@tanstack/devtools-event-client";

export type AdminDevtoolsEvents = {
  "api-request": {
    method: string;
    status: number | null;
    outcome: "success" | "http-error" | "network-error" | "response-error";
    durationMs: number;
  };
};

export const adminDevtoolsEvents =
  typeof window === "undefined"
    ? null
    : new EventClient<AdminDevtoolsEvents>({
        pluginId: "nexi-admin-runtime",
        enabled: import.meta.env.DEV,
      });
