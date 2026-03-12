import type { Profile, StoreSettings } from "../types/entities";

export function hasAdminAccess(
  profile: Profile | null,
  storeSettings: StoreSettings,
  trustedTelegramUserId: number | null
): boolean {
  if (!profile) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  if (trustedTelegramUserId !== null) {
    return storeSettings.adminTelegramIds.includes(trustedTelegramUserId);
  }

  // Local fallback for development outside Telegram container.
  if (import.meta.env.DEV) {
    return false;
  }

  return false;
}
