import { createId } from "../../lib/id";
import type {
  GiveawayEvent,
  GiveawayItem,
  GiveawayParticipant,
  GiveawayResult,
  GiveawaySession,
  GiveawaySessionStatus,
  HomepageSection,
  Product,
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

function normalizeGiveawaySession(session: GiveawaySession): GiveawaySession {
  return {
    ...session,
    mode: session.mode ?? "scenario",
    spinDurationMs:
      typeof session.spinDurationMs === "number" && Number.isFinite(session.spinDurationMs)
        ? session.spinDurationMs
        : 6000
  };
}

function normalizeGiveawayItem(raw: GiveawayItem, products: Product[]): GiveawayItem {
  const product = raw.productId ? products.find((item) => item.id === raw.productId) : null;
  return {
    ...raw,
    itemType: raw.itemType ?? (raw.productId ? "catalog_product" : "special_prize"),
    productId: raw.productId ?? null,
    title: raw.title ?? product?.title ?? "Special prize",
    description: raw.description ?? product?.description ?? "",
    emoji: raw.emoji ?? "",
    imageUrl: raw.imageUrl ?? "",
    slots:
      typeof raw.slots === "number" && Number.isFinite(raw.slots) && raw.slots > 0 ? raw.slots : 1,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt ?? new Date().toISOString()
  };
}

function normalizeGiveawayParticipant(participant: GiveawayParticipant): GiveawayParticipant {
  return {
    ...participant,
    comment: participant.comment ?? "",
    createdAt: participant.createdAt ?? new Date().toISOString()
  };
}

function normalizeGiveawayResult(
  raw: GiveawayResult,
  items: GiveawayItem[],
  products: Product[]
): GiveawayResult {
  const sourceItem = items.find((item) => item.id === raw.giveawayItemId);
  const product = raw.productId ? products.find((item) => item.id === raw.productId) : null;
  return {
    ...raw,
    giveawayItemId: raw.giveawayItemId ?? sourceItem?.id ?? createId("giveaway_item_ref"),
    itemType: raw.itemType ?? sourceItem?.itemType ?? (raw.productId ? "catalog_product" : "special_prize"),
    productId: raw.productId ?? sourceItem?.productId ?? null,
    participantId: raw.participantId ?? null,
    prizeTitle: raw.prizeTitle ?? sourceItem?.title ?? product?.title ?? "Prize",
    note: raw.note ?? ""
  };
}

function normalizeGiveawayEvent(event: GiveawayEvent): GiveawayEvent {
  return {
    ...event,
    createdAt: event.createdAt ?? new Date().toISOString()
  };
}

function appendGiveawayEvent(
  payload: PersistedPayload,
  sessionId: string,
  type: GiveawayEvent["type"],
  message: string
): GiveawayEvent {
  const event: GiveawayEvent = {
    id: createId("giveaway_event"),
    sessionId,
    type,
    message,
    createdAt: new Date().toISOString()
  };
  payload.giveawayEvents = [event, ...payload.giveawayEvents];
  return event;
}

function ensurePayload(): PersistedPayload {
  const fallback = createFallbackBootstrap();
  const parsed = loadStoredPayload();
  if (!parsed) {
    return fallback;
  }

  const products = (parsed.products ?? fallback.products).map((product) => ({
    ...product,
    sku: product.sku ?? "",
    isFeatured: product.isFeatured ?? false
  }));

  const giveawaySessions = (parsed.giveawaySessions ?? fallback.giveawaySessions).map(normalizeGiveawaySession);
  const giveawayItems = (parsed.giveawayItems ?? fallback.giveawayItems).map((item) =>
    normalizeGiveawayItem(item, products)
  );

  return {
    activeProfileId: parsed.activeProfileId || fallback.activeProfileId,
    profiles: parsed.profiles ?? fallback.profiles,
    products,
    productImages: parsed.productImages ?? fallback.productImages,
    categories: (parsed.categories ?? fallback.categories).map((category) => ({
      ...category,
      slug: category.slug ?? "",
      parentCategoryId: category.parentCategoryId ?? null,
      imageUrl: category.imageUrl ?? "",
      bannerUrl: category.bannerUrl ?? ""
    })),
    favorites: parsed.favorites ?? fallback.favorites,
    storeSettings: {
      ...fallback.storeSettings,
      ...parsed.storeSettings,
      heroImageUrl: parsed.storeSettings?.heroImageUrl ?? fallback.storeSettings.heroImageUrl
    },
    sellerSettings: { ...fallback.sellerSettings, ...parsed.sellerSettings },
    homepageSections: (parsed.homepageSections ?? fallback.homepageSections).map((item) => ({
      ...item,
      linkedProductIds: [...item.linkedProductIds]
    })),
    giveawaySessions,
    giveawayItems,
    giveawayParticipants: (parsed.giveawayParticipants ?? fallback.giveawayParticipants).map(
      normalizeGiveawayParticipant
    ),
    giveawayResults: (parsed.giveawayResults ?? fallback.giveawayResults).map((item) =>
      normalizeGiveawayResult(item, giveawayItems, products)
    ),
    giveawayEvents: (parsed.giveawayEvents ?? fallback.giveawayEvents).map(normalizeGiveawayEvent)
  };
}

function buildGiveawayResult(input: GiveawaySpinInput & { profileId: string | null }): GiveawayResult {
  return {
    id: createId("giveaway_result"),
    sessionId: input.sessionId,
    giveawayItemId: input.giveawayItemId,
    itemType: input.itemType,
    productId: input.productId,
    participantId: input.participantId,
    prizeTitle: input.prizeTitle,
    profileId: input.profileId,
    winnerNickname: input.winnerNickname,
    spinDurationMs: input.spinDurationMs,
    wonAt: new Date().toISOString(),
    note: input.note?.trim() || ""
  };
}

function buildCategoryDeleteError(payload: PersistedPayload, categoryId: string): string | null {
  const category = payload.categories.find((item) => item.id === categoryId);
  if (!category) {
    return "Category was not found.";
  }

  if (payload.categories.some((item) => item.parentCategoryId === categoryId)) {
    return "Delete is blocked: move or remove child categories first.";
  }

  if (payload.products.some((item) => item.categoryId === categoryId)) {
    return "Delete is blocked: there are products linked to this category.";
  }

  if (payload.homepageSections.some((item) => item.linkedCategoryId === categoryId)) {
    return "Delete is blocked: storefront sections still reference this category.";
  }

  return null;
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
    async deleteCategory(categoryId) {
      const payload = ensurePayload();
      const deleteError = buildCategoryDeleteError(payload, categoryId);
      if (deleteError) {
        throw new Error(deleteError);
      }

      payload.categories = payload.categories.filter((item) => item.id !== categoryId);
      savePayload(payload);
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
    async deleteProduct(productId) {
      const payload = ensurePayload();
      const hasGiveawayHistory = payload.giveawayResults.some((result) => result.productId === productId);
      if (hasGiveawayHistory) {
        throw new Error("Product cannot be deleted because it is already used in giveaway history.");
      }

      payload.products = payload.products.filter((item) => item.id !== productId);
      payload.productImages = payload.productImages.filter((image) => image.productId !== productId);
      payload.favorites = payload.favorites.filter((favorite) => favorite.productId !== productId);
      payload.giveawayItems = payload.giveawayItems.filter((item) => item.productId !== productId);
      payload.homepageSections = payload.homepageSections.map((section) => ({
        ...section,
        linkedProductIds: section.linkedProductIds.filter((linkedId) => linkedId !== productId)
      }));
      savePayload(payload);
    },
    async updateProductFlags(productId, patch) {
      const payload = ensurePayload();
      let updated = payload.products.find((item) => item.id === productId);
      if (!updated) {
        throw new Error("Product was not found.");
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
      const session: GiveawaySession = {
        id: createId("giveaway"),
        title: input.title.trim(),
        description: input.description.trim(),
        mode: input.mode ?? "scenario",
        status: "draft" as GiveawaySessionStatus,
        drawAt: input.drawAt,
        spinDurationMs:
          typeof input.spinDurationMs === "number" && Number.isFinite(input.spinDurationMs)
            ? Math.max(2000, Math.min(180000, Math.round(input.spinDurationMs)))
            : 6000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      payload.giveawaySessions = [session, ...payload.giveawaySessions];
      appendGiveawayEvent(payload, session.id, "session_created", `Session "${session.title}" created.`);
      savePayload(payload);
      return session;
    },
    async updateGiveawaySession(sessionId: string, patch: GiveawaySessionPatch) {
      const payload = ensurePayload();
      const session = payload.giveawaySessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Giveaway session was not found.");
      }

      const updated: GiveawaySession = {
        ...session,
        ...patch,
        mode: patch.mode ?? session.mode,
        spinDurationMs:
          typeof patch.spinDurationMs === "number" && Number.isFinite(patch.spinDurationMs)
            ? Math.max(2000, Math.min(180000, Math.round(patch.spinDurationMs)))
            : session.spinDurationMs,
        updatedAt: new Date().toISOString()
      };
      payload.giveawaySessions = payload.giveawaySessions.map((item) =>
        item.id === sessionId ? updated : item
      );
      appendGiveawayEvent(payload, sessionId, "session_updated", `Session "${updated.title}" updated.`);
      savePayload(payload);
      return updated;
    },
    async updateGiveawaySessionStatus(sessionId: string, status: GiveawaySessionStatus) {
      const payload = ensurePayload();
      const session = payload.giveawaySessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Giveaway session was not found.");
      }
      const updated = { ...session, status, updatedAt: new Date().toISOString() };
      payload.giveawaySessions = payload.giveawaySessions.map((item) =>
        item.id === sessionId ? updated : item
      );
      appendGiveawayEvent(payload, sessionId, "session_status_changed", `Session moved to ${status}.`);
      if (status === "completed") {
        appendGiveawayEvent(payload, sessionId, "session_completed", `Session "${updated.title}" completed.`);
      }
      savePayload(payload);
      return updated;
    },
    async saveGiveawayItem(item) {
      const payload = ensurePayload();
      const normalized = normalizeGiveawayItem(item, payload.products);
      const conflict =
        normalized.itemType === "catalog_product" && normalized.productId
          ? payload.giveawayItems.find(
              (existing) =>
                existing.sessionId === normalized.sessionId &&
                existing.itemType === "catalog_product" &&
                existing.productId === normalized.productId
            )
          : null;
      const exists = payload.giveawayItems.find((existing) => existing.id === normalized.id) ?? conflict ?? null;

      const saved = exists
        ? { ...exists, ...normalized, createdAt: exists.createdAt }
        : { ...normalized, id: normalized.id || createId("giveaway_item") };

      payload.giveawayItems = exists
        ? payload.giveawayItems.map((existing) => (existing.id === exists.id ? saved : existing))
        : [...payload.giveawayItems, saved];

      appendGiveawayEvent(
        payload,
        saved.sessionId,
        "lot_added",
        `${saved.itemType === "catalog_product" ? "Catalog lot" : "Special prize"} "${saved.title}" saved.`
      );
      savePayload(payload);
      return saved;
    },
    async removeGiveawayItem(itemId: string) {
      const payload = ensurePayload();
      const item = payload.giveawayItems.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }
      if (payload.giveawayResults.some((result) => result.giveawayItemId === itemId)) {
        throw new Error("Lot cannot be deleted because it is already used in giveaway history.");
      }
      payload.giveawayItems = payload.giveawayItems.filter((entry) => entry.id !== itemId);
      appendGiveawayEvent(payload, item.sessionId, "lot_removed", `Lot "${item.title}" removed.`);
      savePayload(payload);
    },
    async saveGiveawayParticipant(participant) {
      const payload = ensurePayload();
      const saved: GiveawayParticipant = {
        ...participant,
        comment: participant.comment?.trim() ?? "",
        createdAt: participant.createdAt ?? new Date().toISOString()
      };
      const exists = payload.giveawayParticipants.some((item) => item.id === saved.id);
      payload.giveawayParticipants = exists
        ? payload.giveawayParticipants.map((item) => (item.id === saved.id ? saved : item))
        : [...payload.giveawayParticipants, saved];
      appendGiveawayEvent(
        payload,
        saved.sessionId,
        "participant_added",
        `Participant "${saved.nickname}" saved.`
      );
      savePayload(payload);
      return saved;
    },
    async removeGiveawayParticipant(participantId: string) {
      const payload = ensurePayload();
      const participant = payload.giveawayParticipants.find((item) => item.id === participantId);
      if (!participant) {
        return;
      }
      if (payload.giveawayResults.some((result) => result.participantId === participantId)) {
        throw new Error("Participant cannot be deleted because results already reference them.");
      }
      payload.giveawayParticipants = payload.giveawayParticipants.filter((item) => item.id !== participantId);
      appendGiveawayEvent(
        payload,
        participant.sessionId,
        "participant_removed",
        `Participant "${participant.nickname}" removed.`
      );
      savePayload(payload);
    },
    async createGiveawayResult(input) {
      const payload = ensurePayload();
      const result = buildGiveawayResult(input);

      payload.giveawayResults = [result, ...payload.giveawayResults];

      const item = payload.giveawayItems.find((candidate) => candidate.id === input.giveawayItemId);
      let updatedItem: GiveawayItem | null = null;
      if (item) {
        updatedItem = { ...item, isActive: false };
        payload.giveawayItems = payload.giveawayItems.map((candidate) =>
          candidate.id === item.id ? updatedItem! : candidate
        );
      }

      const createdEvents = [
        appendGiveawayEvent(payload, input.sessionId, "spin_started", `Spin started for "${input.prizeTitle}".`),
        appendGiveawayEvent(
          payload,
          input.sessionId,
          "result_recorded",
          `${input.winnerNickname || "Unnamed participant"} won "${input.prizeTitle}".`
        )
      ];

      const hasActiveRemaining = payload.giveawayItems.some(
        (candidate) => candidate.sessionId === input.sessionId && candidate.isActive
      );
      let updatedSession: GiveawaySession | null = null;
      if (!hasActiveRemaining) {
        payload.giveawaySessions = payload.giveawaySessions.map((session) => {
          if (session.id !== input.sessionId) {
            return session;
          }
          updatedSession = {
            ...session,
            status: "completed",
            updatedAt: new Date().toISOString()
          };
          return updatedSession;
        });
        createdEvents.push(
          appendGiveawayEvent(payload, input.sessionId, "session_completed", "Session completed after final prize.")
        );
      }

      savePayload(payload);
      return {
        result,
        updatedItem,
        updatedSession,
        createdEvents
      };
    },
    async listGiveawayResults() {
      const payload = ensurePayload();
      return payload.giveawayResults;
    }
  };
}
