import { getTelegramVerifyEndpoint } from "../config/runtime";
import type { TelegramWebAppUser } from "../types/telegram";

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function initTelegramWebApp(): TelegramWebAppUser | null {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return null;
  }

  webApp.ready();
  webApp.expand();
  return webApp.initDataUnsafe?.user ?? null;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData?.trim() ?? "";
}

export interface TelegramInitDataVerifyResult {
  ok: boolean;
  message?: string;
}

export async function verifyTelegramInitData(initData: string): Promise<TelegramInitDataVerifyResult> {
  const endpoint = getTelegramVerifyEndpoint();
  if (!endpoint || !initData) {
    return {
      ok: false,
      message: "Проверка Telegram auth пропущена: endpoint или initData не заданы."
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ initData })
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Проверка Telegram auth завершилась с HTTP ${response.status}.`
      };
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      valid?: boolean;
      message?: string;
      error?: string;
    };
    const isVerified = Boolean(payload.ok ?? payload.valid);

    return {
      ok: isVerified,
      message: payload.message || payload.error || (isVerified ? "Проверка пройдена." : "Сервер отклонил initData.")
    };
  } catch {
    return {
      ok: false,
      message: "Сервис проверки Telegram auth недоступен."
    };
  }
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

