import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function compactNumber(value: number) {
  return compactFormatter.format(value);
}

export function profileScoreColor(value: number) {
  if (value >= 80) return "#3fb950";
  if (value >= 60) return "#d29922";
  return "#f85149";
}
