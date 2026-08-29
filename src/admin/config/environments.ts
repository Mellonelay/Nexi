import type { Environment } from "../types";

export const ENVIRONMENTS: Environment[] = ["DEVELOPMENT", "SANDBOX", "PRODUCTION"];

export const ENV_LABEL: Record<Environment, string> = {
  DEVELOPMENT: "DEV",
  SANDBOX: "SBX",
  PRODUCTION: "PROD",
};

export const ENV_TONE: Record<Environment, "info" | "warning" | "destructive"> = {
  DEVELOPMENT: "info",
  SANDBOX: "warning",
  PRODUCTION: "destructive",
};
