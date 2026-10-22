import type { HealthCheck, KycReview, SupportTicket, Withdrawal } from "../types";

export type OverviewWorkRoute = "/kyc" | "/withdrawals" | "/support" | "/health";

export interface OverviewWorkItem {
  id: string;
  category: string;
  label: string;
  status: string;
  to: OverviewWorkRoute;
}

export function buildOverviewWorkItems(input: {
  kyc: KycReview[];
  withdrawals: Withdrawal[];
  tickets: SupportTicket[];
  health: HealthCheck[];
  access: { kyc: boolean; withdrawals: boolean; support: boolean; health: boolean };
}): OverviewWorkItem[] {
  return [
    ...(input.access.kyc
      ? input.kyc
          .filter((review) => review.status === "pending" || review.status === "more_info")
          .map((review) => ({
            id: `kyc:${review.id}`,
            category: "KYC review",
            label: `Review ${review.documentType.replaceAll("_", " ")}`,
            status: review.status,
            to: "/kyc" as const,
          }))
      : []),
    ...(input.access.withdrawals
      ? input.withdrawals
          .filter((withdrawal) => withdrawal.status === "pending")
          .map((withdrawal) => ({
            id: `withdrawal:${withdrawal.id}`,
            category: "Withdrawal",
            label: `${withdrawal.amount} ${withdrawal.asset}`,
            status: withdrawal.status,
            to: "/withdrawals" as const,
          }))
      : []),
    ...(input.access.support
      ? input.tickets
          .filter((ticket) => ticket.status === "open" || ticket.status === "escalated")
          .map((ticket) => ({
            id: `ticket:${ticket.id}`,
            category: "Support",
            label: ticket.subject,
            status: ticket.status,
            to: "/support" as const,
          }))
      : []),
    ...(input.access.health
      ? input.health
          .filter((check) => check.status !== "ok")
          .map((check) => ({
            id: `health:${check.id}`,
            category: "System health",
            label: check.name,
            status: check.status,
            to: "/health" as const,
          }))
      : []),
  ];
}
