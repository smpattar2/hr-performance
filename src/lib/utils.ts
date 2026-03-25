import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getRatingLabel(score: number): string {
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Exceeds Expectations";
  if (score >= 2.5) return "Meets Expectations";
  if (score >= 1.5) return "Below Expectations";
  return "Needs Improvement";
}

export function getRatingColor(score: number): string {
  if (score >= 4.5) return "text-emerald-600 bg-emerald-50";
  if (score >= 3.5) return "text-blue-600 bg-blue-50";
  if (score >= 2.5) return "text-amber-600 bg-amber-50";
  if (score >= 1.5) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ON_TRACK":
    case "COMPLETED":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "AT_RISK":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "BEHIND":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

export function calculateFinalScore(
  selfRating: number | null,
  tlRating: number | null,
  mgmtRating: number | null
): number | null {
  if (selfRating == null || tlRating == null || mgmtRating == null) return null;
  // Weights: Self 20%, TL 40%, Management 40%
  return selfRating * 0.2 + tlRating * 0.4 + mgmtRating * 0.4;
}
