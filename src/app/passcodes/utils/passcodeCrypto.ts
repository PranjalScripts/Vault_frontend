import type { EncryptedField } from "../types";

export const isEncryptedField = (
  value: unknown
): value is EncryptedField => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EncryptedField>;

  return (
    typeof candidate.ciphertext === "string" &&
    candidate.ciphertext.length > 0 &&
    typeof candidate.nonce === "string" &&
    candidate.nonce.length > 0 &&
    typeof candidate.authTag === "string" &&
    candidate.authTag.length > 0
  );
};

export const getPlatformIcon = (platformName: string) => {
  const name = platformName.toLowerCase();

  if (name.includes("instagram") || name.includes("insta")) return "📷";
  if (name.includes("facebook") || name.includes("fb")) return "📘";
  if (name.includes("twitter") || name === "x") return "🐦";
  if (name.includes("linkedin") || name.includes("linked")) return "💼";
  if (name.includes("google") || name.includes("gmail")) return "🔍";
  if (name.includes("amazon")) return "📦";
  if (name.includes("netflix")) return "🎬";
  if (name.includes("spotify")) return "🎵";
  if (name.includes("github") || name.includes("git")) return "💻";
  if (name.includes("bank") || name.includes("finance")) return "🏦";

  return "🔐";
};

export const formatTimeAgo = (dateString: string) => {
  try {
    const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;

    return `${Math.floor(diffInDays / 365)}y ago`;
  } catch {
    return "";
  }
};
