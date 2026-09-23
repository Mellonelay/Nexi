"use client";

import { useEffect, useState } from "react";

type LocalDateTimeOptions = {
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  fallback?: string;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function localFormatter(dateStyle?: LocalDateTimeOptions["dateStyle"], timeStyle?: LocalDateTimeOptions["timeStyle"]) {
  const key = `${dateStyle ?? ""}|${timeStyle ?? ""}`;
  const cached = formatters.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle, timeStyle });
  formatters.set(key, formatter);
  return formatter;
}

export function useLocalDateTime(
  value: string | number | Date | null | undefined,
  { dateStyle, timeStyle, fallback = "—" }: LocalDateTimeOptions = {},
) {
  const [formatted, setFormatted] = useState(fallback);

  useEffect(() => {
    const raw = value instanceof Date ? value : value == null ? null : new Date(value);
    const next = raw && Number.isFinite(raw.getTime())
      ? localFormatter(dateStyle, timeStyle).format(raw)
      : fallback;
    queueMicrotask(() => setFormatted(next));
  }, [dateStyle, fallback, timeStyle, value]);

  return formatted;
}

export default function LocalDateTime({
  value,
  ...options
}: LocalDateTimeOptions & { value: string | number | Date | null | undefined }) {
  return <>{useLocalDateTime(value, options)}</>;
}
