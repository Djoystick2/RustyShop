import {
  getTelegramVerifyConfig,
  type TelegramVerifyEndpointSource
} from "../config/runtime";
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
  endpoint: string;
  endpointSource: TelegramVerifyEndpointSource;
  statusCode?: number;
  message?: string;
}

export async function verifyTelegramInitData(initData: string): Promise<TelegramInitDataVerifyResult> {
  const verifyConfig = getTelegramVerifyConfig();
  const { endpoint, source } = verifyConfig;

  if (!initData) {
    return {
      ok: false,
      endpoint,
      endpointSource: source,
      message: "Проверка Telegram auth пропущена: initData не передан."
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

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      verified?: boolean;
      message?: string;
      error?: string;
    };

    const verified = Boolean(payload.ok ?? payload.verified);
    if (!response.ok || !verified) {
      return {
        ok: false,
        endpoint,
        endpointSource: source,
        statusCode: response.status,
        message:
          payload.message ||
          payload.error ||
          `Проверка Telegram auth завершилась с HTTP ${response.status}.`
      };
    }

    return {
      ok: true,
      endpoint,
      endpointSource: source,
      statusCode: response.status,
      message: payload.message || "Проверка Telegram auth пройдена."
    };
  } catch {
    return {
      ok: false,
      endpoint,
      endpointSource: source,
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

