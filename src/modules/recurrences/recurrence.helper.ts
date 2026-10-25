import { createHash } from "node:crypto";
import type { RecurrenceFrequency } from "src/generated/prisma/client";

// Sempre ancorado na data original: 31/jan -> 28/fev -> 31/mar; 29/fev -> 28/fev -> 29/fev.
export function nextOccurrence(
  current: Date,
  anchor: Date,
  frequency: RecurrenceFrequency,
): Date {
  if (frequency === "DAILY" || frequency === "WEEKLY")
    return new Date(
      current.getTime() + (frequency === "DAILY" ? 1 : 7) * 86400000,
    );
  const year = current.getUTCFullYear() + (frequency === "YEARLY" ? 1 : 0);
  const month =
    frequency === "YEARLY" ? anchor.getUTCMonth() : current.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(anchor.getUTCDate(), lastDay),
      anchor.getUTCHours(),
      anchor.getUTCMinutes(),
      anchor.getUTCSeconds(),
      anchor.getUTCMilliseconds(),
    ),
  );
}

export function occurrenceId(recurrenceId: string, date: Date): string {
  return createHash("sha256")
    .update(`${recurrenceId}:${date.toISOString()}`)
    .digest("hex")
    .slice(0, 24);
}
