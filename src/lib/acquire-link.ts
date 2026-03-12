import type { SellerSettings } from "../types/entities";

function normalizeTelegramLink(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("https://t.me/") || trimmed.startsWith("http://t.me/")) {
    return trimmed.replace("http://", "https://");
  }

  if (trimmed.startsWith("@")) {
    return `https://t.me/${trimmed.slice(1)}`;
  }

  if (/^[a-zA-Z0-9_]{5,}$/.test(trimmed)) {
    return `https://t.me/${trimmed}`;
  }

  if (trimmed.startsWith("tg://")) {
    return trimmed;
  }

  return null;
}

function appendTextQuery(url: string, encodedMessage: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}text=${encodedMessage}`;
}

function resolveSellerTelegramLink(seller: SellerSettings): string | null {
  const directLink = normalizeTelegramLink(seller.telegramLink);
  if (directLink) {
    return directLink;
  }

  const username = seller.telegramUsername.replace("@", "").trim();
  if (username) {
    return `https://t.me/${username}`;
  }

  return null;
}

function buildPurchaseMessage(template: string, productTitle: string): string {
  const safeTemplate = template.trim();
  if (!safeTemplate) {
    return `Здравствуйте! Хочу приобрести товар: ${productTitle}`;
  }

  if (!safeTemplate.includes("{product}")) {
    return `${safeTemplate} ${productTitle}`.trim();
  }

  return safeTemplate.replaceAll("{product}", productTitle);
}

export function hasSellerContact(seller: SellerSettings): boolean {
  return Boolean(resolveSellerTelegramLink(seller));
}

export function buildAcquireLink(seller: SellerSettings, productTitle: string): string | null {
  const message = buildPurchaseMessage(seller.purchaseMessageTemplate, productTitle);
  const encoded = encodeURIComponent(message);
  const targetLink = resolveSellerTelegramLink(seller);
  if (!targetLink) {
    return null;
  }
  return appendTextQuery(targetLink, encoded);
}

export function buildSellerContactLink(seller: SellerSettings, message: string): string | null {
  const encoded = encodeURIComponent(message);
  const targetLink = resolveSellerTelegramLink(seller);
  if (!targetLink) {
    return null;
  }
  return appendTextQuery(targetLink, encoded);
}
