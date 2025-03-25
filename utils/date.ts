import { format, parseISO } from "date-fns";

/**
 * Normalizes a date to noon UTC to avoid timezone issues
 * @param date Date object or ISO string
 * @returns Date object normalized to noon UTC
 */
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

/**
 * Formats a date to YYYY-MM-DD format, normalized to UTC
 * @param date Date object or ISO string
 * @returns YYYY-MM-DD formatted string
 */
export function formatDateToYMD(date: Date | string): string {
  const normalized = normalizeDate(date);
  return format(normalized, "yyyy-MM-dd");
}

/**
 * Parses a YYYY-MM-DD string to a normalized Date object
 * @param dateStr YYYY-MM-DD formatted string
 * @returns Date object normalized to noon UTC
 */
export function parseYMDDate(dateStr: string): Date {
  return normalizeDate(dateStr);
}
