import crypto from "node:crypto";

type JsonRecord = Record<string, unknown>;

function respondJson(res: any, status: number, payload: JsonRecord) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.json(payload);
}

function toComparableHashBuffer(hex: string): Buffer | null {
  const normalized = hex.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    return null;
  }
  return Buffer.from(normalized, "hex");
}

function buildDataCheckString(searchParams: URLSearchParams): string {
  const pairs: string[] = [];
  searchParams.forEach((value, key) => {
    if (key === "hash") {
      return;
    }
    pairs.push(`${key}=${value}`);
  });
  pairs.sort((a, b) => a.localeCompare(b));
  return pairs.join("\n");
}

function verifyInitDataSignature(initData: string, botToken: string): {
  ok: boolean;
  authDate: number;
  user: unknown;
  reason?: string;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { ok: false, authDate: 0, user: null, reason: "missing_hash" };
  }

  const providedHash = toComparableHashBuffer(hash);
  if (!providedHash) {
    return { ok: false, authDate: 0, user: null, reason: "invalid_hash_format" };
  }

  const dataCheckString = buildDataCheckString(params);
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHashHex = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  const calculatedHash = Buffer.from(calculatedHashHex, "hex");

  if (
    providedHash.length !== calculatedHash.length ||
    !crypto.timingSafeEqual(providedHash, calculatedHash)
  ) {
    return { ok: false, authDate: 0, user: null, reason: "hash_mismatch" };
  }

  const authDateRaw = params.get("auth_date");
  const authDate = Number(authDateRaw ?? 0);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    return { ok: false, authDate: 0, user: null, reason: "invalid_auth_date" };
  }

  const userRaw = params.get("user");
  let user: unknown = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }

  return {
    ok: true,
    authDate,
    user
  };
}

function isFresh(authDate: number, maxAgeSec: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate <= maxAgeSec;
}

function readInitDataFromBody(req: any): string {
  const body = req.body;
  if (!body) {
    return "";
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      return String(parsed.initData ?? parsed.init_data ?? "").trim();
    } catch {
      return "";
    }
  }

  return String(body.initData ?? body.init_data ?? "").trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    respondJson(res, 405, {
      ok: false,
      verified: false,
      error: "method_not_allowed",
      message: "Use POST /api/telegram/verify."
    });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  if (!botToken) {
    respondJson(res, 500, {
      ok: false,
      verified: false,
      error: "server_not_configured",
      message: "TELEGRAM_BOT_TOKEN is not configured."
    });
    return;
  }

  const maxAgeSecRaw = process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC?.trim();
  const maxAgeSecParsed = Number(maxAgeSecRaw || "86400");
  const maxAgeSec =
    Number.isFinite(maxAgeSecParsed) && maxAgeSecParsed > 0 ? Math.floor(maxAgeSecParsed) : 86400;

  const initData = readInitDataFromBody(req);
  if (!initData) {
    respondJson(res, 400, {
      ok: false,
      verified: false,
      error: "missing_init_data",
      message: "initData is required."
    });
    return;
  }

  const verification = verifyInitDataSignature(initData, botToken);
  if (!verification.ok) {
    respondJson(res, 401, {
      ok: false,
      verified: false,
      error: verification.reason || "invalid_init_data",
      message: "Telegram initData signature is invalid."
    });
    return;
  }

  if (!isFresh(verification.authDate, maxAgeSec)) {
    respondJson(res, 401, {
      ok: false,
      verified: false,
      error: "auth_date_expired",
      message: "Telegram initData is expired."
    });
    return;
  }

  respondJson(res, 200, {
    ok: true,
    verified: true,
    authDate: verification.authDate,
    user: verification.user,
    message: "Telegram initData verified."
  });
}
