import {
  getTelegramVerifyConfig,
  type TelegramVerifyEndpointSource
} from "../config/runtime";
import type { TelegramWebAppUser } from "../types/telegram";

const TELEGRAM_WEBAPP_SDK_URL = "https://telegram.org/js/telegram-web-app.js";
const TELEGRAM_BRIDGE_WAIT_TIMEOUT_MS = 1500;
const TELEGRAM_BRIDGE_POLL_INTERVAL_MS = 80;

type InitDataSource = "webapp" | "url" | "none";
type BridgeSource = "window" | "script" | "none";

let telegramSdkLoadPromise: Promise<void> | null = null;

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

function safeInitTelegramWebApp(webApp: ReturnType<typeof getTelegramWebApp>) {
  if (!webApp) {
    return;
  }
  try {
    if (typeof webApp.ready === "function") {
      webApp.ready();
    }
    if (typeof webApp.expand === "function") {
      webApp.expand();
    }
  } catch {
    // Telegram bridge errors should not break initial render.
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readTelegramInitDataFromQueryString(raw: string): string {
  if (!raw) {
    return "";
  }

  const normalized = raw.startsWith("?") || raw.startsWith("#") ? raw.slice(1) : raw;
  if (!normalized) {
    return "";
  }

  const queryIndex = normalized.indexOf("?");
  const query = queryIndex >= 0 ? normalized.slice(queryIndex + 1) : normalized;
  const params = new URLSearchParams(query);
  const encoded = params.get("tgWebAppData")?.trim() ?? "";
  if (!encoded) {
    return "";
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function readTelegramInitDataFromLocation(): string {
  const fromHash = readTelegramInitDataFromQueryString(window.location.hash);
  if (fromHash) {
    return fromHash;
  }
  return readTelegramInitDataFromQueryString(window.location.search);
}

function parseTelegramUserFromInitData(initData: string): TelegramWebAppUser | null {
  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const rawUser = params.get("user");
  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as TelegramWebAppUser;
    if (typeof user?.id !== "number") {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

async function ensureTelegramSdkScriptLoaded() {
  if (getTelegramWebApp()) {
    return;
  }

  if (telegramSdkLoadPromise) {
    await telegramSdkLoadPromise;
    return;
  }

  telegramSdkLoadPromise = new Promise<void>((resolve) => {
    const onDone = () => resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_WEBAPP_SDK_URL}"]`
    );

    if (existing) {
      existing.addEventListener("load", onDone, { once: true });
      existing.addEventListener("error", onDone, { once: true });
      window.setTimeout(onDone, 1200);
      return;
    }

    const script = document.createElement("script");
    script.src = TELEGRAM_WEBAPP_SDK_URL;
    script.async = true;
    script.onload = onDone;
    script.onerror = onDone;
    document.head.appendChild(script);
    window.setTimeout(onDone, 1200);
  });

  await telegramSdkLoadPromise;
}

async function waitForTelegramBridge(timeoutMs = TELEGRAM_BRIDGE_WAIT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const webApp = getTelegramWebApp();
    if (webApp) {
      return webApp;
    }
    await wait(TELEGRAM_BRIDGE_POLL_INTERVAL_MS);
  }
  return getTelegramWebApp();
}

export interface TelegramRuntimeContext {
  hasBridge: boolean;
  bridgeSource: BridgeSource;
  initData: string;
  initDataSource: InitDataSource;
  user: TelegramWebAppUser | null;
}

export function initTelegramWebApp(): TelegramWebAppUser | null {
  const webApp = getTelegramWebApp();
  safeInitTelegramWebApp(webApp);
  if (webApp?.initDataUnsafe?.user) {
    return webApp.initDataUnsafe.user;
  }

  const initData = webApp?.initData?.trim() ?? readTelegramInitDataFromLocation();
  return parseTelegramUserFromInitData(initData);
}

export async function resolveTelegramRuntimeContext(): Promise<TelegramRuntimeContext> {
  let webApp = getTelegramWebApp();
  let bridgeSource: BridgeSource = webApp ? "window" : "none";

  if (!webApp) {
    await ensureTelegramSdkScriptLoaded();
    webApp = await waitForTelegramBridge();
    if (webApp) {
      bridgeSource = "script";
    }
  }

  safeInitTelegramWebApp(webApp);

  const webAppInitData = webApp?.initData?.trim() ?? "";
  const urlInitData = readTelegramInitDataFromLocation();
  const initData = webAppInitData || urlInitData;
  const initDataSource: InitDataSource = webAppInitData ? "webapp" : urlInitData ? "url" : "none";
  const user = webApp?.initDataUnsafe?.user ?? parseTelegramUserFromInitData(initData);

  return {
    hasBridge: Boolean(webApp),
    bridgeSource,
    initData,
    initDataSource,
    user
  };
}

export function getTelegramInitData(): string {
  const webAppInitData = getTelegramWebApp()?.initData?.trim() ?? "";
  if (webAppInitData) {
    return webAppInitData;
  }
  return readTelegramInitDataFromLocation();
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
