import { createId } from "../../lib/id";
import type {
  GiveawayResult,
  GiveawaySessionStatus,
  HomepageSection,
  ProductImage
} from "../../types/entities";
import type { AppRepository, BootstrapContext } from "./contracts";
import type {
  BootstrapPayload,
  GiveawaySessionInput,
  GiveawaySessionPatch,
  GiveawaySpinInput
} from "../state";
import { createFallbackBootstrap } from "../state";

const STORAGE_KEY = "rustyland_local_repository_v3";

interface PersistedPayload extends BootstrapPayload {}

function loadStoredPayload(): PersistedPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedPayload;
  } catch {
    return null;
  }
}

function savePayload(payload: PersistedPayload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function ensurePayload(): PersistedPayload {
  const fallback = createFallbackBootstrap();
  const parsed = loadStoredPayload();
  if (!parsed) {
    return fallback;
  }

  return {
    activeProfileId: parsed.activeProfileId || fallback.activeProfileId,
    profiles: parsed.profiles ?? fallback.profiles,
    products: (parsed.products ?? fallback.products).map((product) => ({
      ...product,
      isFeatured: product.isFeatured ?? false
    })),
    productImages: parsed.productImages ?? fallback.productImages,
    categories: parsed.categories ?? fallback.categories,
    favorites: parsed.favorites ?? fallback.favorites,
    storeSettings: { ...fallback.storeSettings, ...parsed.storeSettings },
    sellerSettings: { ...fallback.sellerSettings, ...parsed.sellerSettings },
    homepageSections: (parsed.homepageSections ?? fallback.homepageSections).map((item) => ({
      ...item,
      linkedProductIds: [...item.linkedProductIds]
    })),
    giveawaySessions: (parsed.giveawaySessions ?? fallback.giveawaySessions).map((session) => ({
      ...session,
      spinDurationMs:
        typeof session.spinDurationMs === "number" && Number.isFinite(session.spinDurationMs)
          ? session.spinDurationMs
          : 6000
    })),
    giveawayItems: parsed.giveawayItems ?? fallback.giveawayItems,
    giveawayResults: parsed.giveawayResults ?? fallback.giveawayResults
  };
}

function resolveActiveProfile(payload: PersistedPayload, context: BootstrapContext): string {
  if (!context.telegramUser) {
    return payload.activeProfileId || payload.profiles[0]?.id || "";
  }

  const byTelegram = payload.profiles.find((profile) => profile.telegramUserId === context.telegramUser?.id);
  if (byTelegram) {
    return byTelegram.id;
  }

  return payload.activeProfileId || payload.profiles[0]?.id || "";
}

function refreshProductImages(payload: PersistedPayload, productId: string, imageUrls: string[]) {
  const cleanUrls = imageUrls.map((item) => item.trim()).filter(Boolean);
  payload.productImages = payload.productImages.filter((image) => image.productId !== productId);
  const newImages: ProductImage[] = cleanUrls.map((url, index) => ({
    id: createId("img"),
    productId,
    url,
    isPrimary: index === 0,
    position: index + 1
  }));
  payload.productImages.push(...newImages);
  return newImages;
}

function buildGiveawayResult(input: GiveawaySpinInput & { profileId: string | null }): GiveawayResult {
  return {
    id: createId("giveaway_result"),
    sessionId: input.sessionId,
    productId: input.productId,
    profileId: input.profileId,
    winnerNickname: input.winnerNickname,
    spinDurationMs: input.spinDurationMs,
    wonAt: new Date().toISOString(),
    note: input.note?.trim() || ""
  };
}

export function createLocalRepository(): AppRepository {
  return {
    kind: "local",
    async bootstrap(context) {
      const payload = ensurePayload();
      payload.activeProfileId = resolveActiveProfile(payload, context);
      savePayload(payload);
      return payload;
    },
    async reloadProfile(currentProfileId, context) {
      const payload = ensurePayload();
      const activeProfileId = currentProfileId || resolveActiveProfile(payload, context);
      return {
        activeProfileId,
        profiles: payload.profiles
      };
    },
    async upsertCategory(category) {
      const payload = ensurePayload();
      const exists = payload.categories.some((item) => item.id === category.id);
      payload.categories = exists
        ? payload.categories.map((item) => (item.id === category.id ? category : item))
        : [...payload.categories, category];
      savePayload(payload);
      return category;
    },
    async upsertHomepageSection(section: HomepageSection) {
      const payload = ensurePayload();
      const exists = payload.homepageSections.some((item) => item.id === section.id);
      payload.homepageSections = exists
        ? payload.homepageSections.map((item) => (item.id === section.id ? section : item))
        : [...payload.homepageSections, section];
      savePayload(payload);
      return section;
    },
    async deleteHomepageSection(sectionId: string) {
      const payload = ensurePayload();
      payload.homepageSections = payload.homepageSections.filter((item) => item.id !== sectionId);
      savePayload(payload);
    },
    async upsertProduct({ product, imageUrls }) {
      const payload = ensurePayload();
      const exists = payload.products.some((item) => item.id === product.id);
      payload.products = exists
        ? payload.products.map((item) => (item.id === product.id ? product : item))
        : [...payload.products, product];
      const images = refreshProductImages(payload, product.id, imageUrls);
      savePayload(payload);
      return { product, productImages: images };
    },
    async updateProductFlags(productId, patch) {
      const payload = ensurePayload();
      let updated = payload.products.find((item) => item.id === productId);
      if (!updated) {
        throw new Error("Товар не найден");
      }

      updated = {
        ...updated,
        ...patch,
        updatedAt: new Date().toISOString()
      };

      payload.products = payload.products.map((item) => (item.id === productId ? updated! : item));
      savePayload(payload);
      return updated;
    },
    async updateStoreSettings(patch) {
      const payload = ensurePayload();
      payload.storeSettings = {
        ...payload.storeSettings,
        ...patch,
        updatedAt: new Date().toISOString()
      };
      savePayload(payload);
      return payload.storeSettings;
    },
    async updateSellerSettings(patch) {
      const payload = ensurePayload();
      payload.sellerSettings = {
        ...payload.sellerSettings,
        ...patch,
        updatedAt: new Date().toISOString()
      };
      savePayload(payload);
      return payload.sellerSettings;
    },
    async setFavorite({ profileId, productId, isFavorite }) {
      const payload = ensurePayload();
      const exists = payload.favorites.some(
        (favorite) => favorite.profileId === profileId && favorite.productId === productId
      );

      if (isFavorite && !exists) {
        payload.favorites.push({
          id: createId("fav"),
          profileId,
          productId,
          createdAt: new Date().toISOString()
        });
      }

      if (!isFavorite && exists) {
        payload.favorites = payload.favorites.filter(
          (favorite) => !(favorite.profileId === profileId && favorite.productId === productId)
        );
      }

      savePayload(payload);
      return payload.favorites.filter((favorite) => favorite.profileId === profileId);
    },
    async createGiveawaySession(input: GiveawaySessionInput) {
      const payload = ensurePayload();
      const session = {
        id: createId("giveaway"),
        title: input.title.trim(),
        description: input.description.trim(),
        status: "draft" as GiveawaySessionStatus,
        drawAt: input.drawAt,
        spinDurationMs:
          typeof input.spinDurationMs === "number" && Number.isFinite(input.spinDurationMs)
            ? Math.max(2000, Math.min(12000, Math.round(input.spinDurationMs)))
            : 6000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      payload.giveawaySessions = [session, ...payload.giveawaySessions];
      savePayload(payload);
      return session;
    },
    async updateGiveawaySession(sessionId: string, patch: GiveawaySessionPatch) {
      const payload = ensurePayload();
      const session = payload.giveawaySessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Сессия розыгрыша не найдена");
      }

      const updated = {
        ...session,
        ...patch,
        spinDurationMs:
          typeof patch.spinDurationMs === "number" && Number.isFinite(patch.spinDurationMs)
            ? Math.max(2000, Math.min(12000, Math.round(patch.spinDurationMs)))
            : session.spinDurationMs,
        updatedAt: new Date().toISOString()
      };
      payload.giveawaySessions = payload.giveawaySessions.map((item) =>
        item.id === sessionId ? updated : item
      );
      savePayload(payload);
      return updated;
    },
    async updateGiveawaySessionStatus(sessionId: string, status: GiveawaySessionStatus) {
      const payload = ensurePayload();
      const session = payload.giveawaySessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Сессия розыгрыша не найдена");
      }
      const updated = { ...session, status, updatedAt: new Date().toISOString() };
      payload.giveawaySessions = payload.giveawaySessions.map((item) =>
        item.id === sessionId ? updated : item
      );
      savePayload(payload);
      return updated;
    },
    async saveGiveawayItem(item) {
      const payload = ensurePayload();
      const exists = payload.giveawayItems.find(
        (existing) => existing.sessionId === item.sessionId && existing.productId === item.productId
      );
      if (exists) {
        const updated = { ...exists, ...item };
        payload.giveawayItems = payload.giveawayItems.map((existing) =>
          existing.id === exists.id ? updated : existing
        );
        savePayload(payload);
        return updated;
      }

      const created = {
        ...item,
        id: item.id || createId("giveaway_item")
      };
      payload.giveawayItems.push(created);
      savePayload(payload);
      return created;
    },
    async removeGiveawayItem(itemId: string) {
      const payload = ensurePayload();
      payload.giveawayItems = payload.giveawayItems.filter((item) => item.id !== itemId);
      savePayload(payload);
    },
    async createGiveawayResult(input) {
      const payload = ensurePayload();
      const result = buildGiveawayResult(input);

      payload.giveawayResults = [result, ...payload.giveawayResults];
      const item = payload.giveawayItems.find((candidate) => candidate.id === input.giveawayItemId);
      let updatedItem: (typeof item) | null = null;
      if (item) {
        updatedItem = { ...item, isActive: false };
        payload.giveawayItems = payload.giveawayItems.map((candidate) =>
          candidate.id === item.id ? updatedItem! : candidate
        );
      }

      const activeRemaining = payload.giveawayItems.some(
        (candidate) => candidate.sessionId === input.sessionId && candidate.isActive
      );
      if (!activeRemaining) {
        payload.giveawaySessions = payload.giveawaySessions.map((session) =>
          session.id === input.sessionId
            ? { ...session, status: "completed", updatedAt: new Date().toISOString() }
            : session
        );
      }

      savePayload(payload);
      return {
        result,
        updatedItem
      };
    },
    async listGiveawayResults() {
      const payload = ensurePayload();
      return payload.giveawayResults;
    }
  };
}
