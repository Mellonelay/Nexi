import { useEffect, useState } from "react";
import { adminDevtoolsEvents, type AdminDevtoolsEvents } from "./events";

type ApiRequest = AdminDevtoolsEvents["api-request"];

export function AdminRuntimePanel() {
  const [requests, setRequests] = useState<ApiRequest[]>([]);

  useEffect(() => {
    if (!adminDevtoolsEvents) return;
    return adminDevtoolsEvents.on("api-request", ({ payload }) => {
      setRequests((current) => [payload, ...current].slice(0, 10));
    });
  }, []);

  return (
    <section className="space-y-2 p-3 text-sm" aria-label="NEXI Admin API activity">
      <h2 className="font-semibold">Recent Admin API requests</h2>
      {requests.length === 0 ? (
        <p className="text-muted-foreground">No API requests in this session yet.</p>
      ) : (
        <ol className="space-y-1">
          {requests.map((request, index) => (
            <li key={`${request.method}-${request.durationMs}-${index}`}>
              {request.method} · {request.status ?? "No response"} · {request.outcome} ·{" "}
              {request.durationMs} ms
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
