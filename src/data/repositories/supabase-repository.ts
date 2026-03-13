import { createUuid } from "../../lib/id";
import type { Profile } from "../../types/entities";
import type { GiveawaySessionInput, GiveawaySessionPatch } from "../state";
import { createFallbackBootstrap } from "../state";
import { getStorageBucketName, getSupabaseClient } from "../supabase/client";
import type { AppRepository, BootstrapContext } from "./contracts";
import {
  mapCategory,
  mapFavorite,
  mapGiveawayEvent,
  mapHomepageSection,
  mapGiveawayItem,
  mapGiveawayParticipant,
  mapGiveawayResult,
  mapGiveawaySession,
  mapProduct,
  mapProductImage,
  mapProfile,
  mapSellerSettings,
  mapStoreSettings,
  toCategoryInsert,
  toProductInsert,
  toSellerSettingsPatch,
  toStoreSettingsPatch
} from "./mappers";

type SupabaseClient = any;

function formatStorageError(error: { message?: string } | null, bucket: string): string {
  const message = error?.message?.toLowerCase() ?? "";
  if (!message) {
    return `Не удалось выполнить storage-операцию для bucket "${bucket}".`;
  }
  if (message.includes("bucket not found")) {
    return `Bucket "${bucket}" не найден. Проверьте VITE_SUPABASE_STORAGE_BUCKET и настройки Supabase Storage.`;
  }
  if (message.includes("row-level security")) {
    return `Нет прав на storage-операцию в bucket "${bucket}". Проверьте storage policies.`;
  }
  return error?.message || `Ошибка storage bucket "${bucket}".`;
}

function assertClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase не настроен. Проверьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
  }
  return client;
}

function formatDbError(error: { message: string } | null): string {
  return error?.message || "Ошибка запроса к базе данных.";
}

function buildGuestProfile(context: BootstrapContext): Profile {
  const fullName = [context.telegramUser?.first_name, context.telegramUser?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: "guest_local",
    telegramUserId: context.telegramUser?.id ?? null,
    displayName: fullName || "Гость ярмарки",
    avatarUrl: "",
    role: "user",
    about: "Профиль работает в гостевом режиме."
  };
}

function isAuthBootstrapError(error: unknown): boolean {
  const raw = error as { status?: number | string; code?: string; message?: string } | null;
  if (!raw) {
    return false;
  }

  const status = Number(raw.status ?? Number.NaN);
  if (status === 401 || status === 403) {
    return true;
  }

  const code = (raw.code ?? "").toString().toUpperCase();
  if (code === "401" || code === "403") {
    return true;
  }

  const message = (raw.message ?? "").toLowerCase();
  return (
    message.includes("not authorized") ||
    message.includes("unauthorized") ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("jwt")
  );
}

function isSingleObjectCoerceError(error: unknown): boolean {
  const raw = error as { code?: string; message?: string } | null;
  if (!raw) {
    return false;
  }

  const message = (raw.message ?? "").toLowerCase();
  return (
    message.includes("cannot coerce the result to a single json object") ||
    message.includes("json object requested") ||
    raw.code === "PGRST116"
  );
}

function isUuid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function assertUuid(value: string | null | undefined, fieldName: string): string {
  if (!isUuid(value)) {
    throw new Error(`Invalid ${fieldName}: backend expects UUID.`);
  }
  return value as string;
}

function unwrapOptionalRow(
  data: any[] | null,
  error: { message: string; code?: string } | null,
  options?: {
    context?: string;
    onMultiple?: "first" | "error";
  }
): any | null {
  if (error) {
    if (isSingleObjectCoerceError(error) && options?.onMultiple === "first") {
      return data?.[0] ?? null;
    }
    throw new Error(formatDbError(error));
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    if (options?.onMultiple === "first") {
      console.warn(
        `[supabase-repository] Multiple rows returned in ${options.context ?? "single-row query"}, using first row.`
      );
      return rows[0];
    }
    throw new Error(`Expected one row in ${options?.context ?? "single-row query"}, got ${rows.length}.`);
  }

  return rows[0];
}

function unwrapMutationRow(
  data: any[] | null,
  error: { message: string; code?: string } | null,
  options?: {
    noRowMessage?: string;
    manyRowsMessage?: string;
  }
): any {
  if (error) {
    throw new Error(formatDbError(error));
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    throw new Error(options?.noRowMessage || "Запись не найдена или недоступна для текущего пользователя.");
  }

  if (rows.length > 1) {
    throw new Error(
      options?.manyRowsMessage || `Expected exactly one row from mutation query, got ${rows.length}.`
    );
  }

  return rows[0];
}

async function resolveProfile(client: SupabaseClient, context: BootstrapContext): Promise<Profile | null> {
  const authResult = await client.auth.getUser();
  const authUserId = authResult.data.user?.id ?? null;

  if (authUserId) {
    const profileByAuth = await client
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .limit(2);

    const profileRow = unwrapOptionalRow(profileByAuth.data, profileByAuth.error, {
      context: "profiles by auth_user_id",
      onMultiple: "first"
    });

    if (profileRow) {
      return mapProfile(profileRow);
    }
  }

  const telegramId = context.telegramUser?.id ?? null;
  if (!telegramId) {
    return null;
  }

  const profileByTelegram = await client
    .from("profiles")
    .select("*")
    .eq("telegram_user_id", telegramId)
    .limit(2);

  const profileRow = unwrapOptionalRow(profileByTelegram.data, profileByTelegram.error, {
    context: "profiles by telegram_user_id",
    onMultiple: "first"
  });

  if (profileRow) {
    return mapProfile(profileRow);
  }

  return null;
}

async function selectOrderedTable(client: SupabaseClient, table: string, orderBy: string) {
  return client.from(table).select("*").order(orderBy as never, { ascending: true });
}

async function insertGiveawayEvent(
  client: SupabaseClient,
  params: {
    sessionId: string;
    type:
      | "session_created"
      | "session_updated"
      | "session_status_changed"
      | "lot_added"
      | "lot_removed"
      | "participant_added"
      | "participant_removed"
      | "spin_started"
      | "result_recorded"
      | "session_completed";
    message: string;
  }
) {
  const insertResult = await client
    .from("giveaway_events")
    .insert({
      id: createUuid(),
      session_id: params.sessionId,
      event_type: params.type,
      message: params.message
    })
    .select("*");

  return mapGiveawayEvent(
    unwrapMutationRow(insertResult.data, insertResult.error, {
      noRowMessage: "Giveaway event was not saved."
    })
  );
}

export function createSupabaseRepository(): AppRepository {
  return {
    kind: "supabase",
    async bootstrap(context) {
      const client = assertClient();
      const fallback = createFallbackBootstrap();

      const profile = await resolveProfile(client, context);

      const [
        categoriesResult,
        productsResult,
        productImagesResult,
        storeSettingsResult,
        sellerSettingsResult,
        homepageSectionsResult,
        sessionsResult,
        itemsResult,
        participantsResult,
        resultsResult,
        eventsResult
      ] = await Promise.all([
        selectOrderedTable(client, "categories", "sort_order"),
        selectOrderedTable(client, "products", "created_at"),
        selectOrderedTable(client, "product_images", "position"),
        client.from("store_settings").select("*").eq("id", "main").limit(2),
        client.from("seller_settings").select("*").eq("id", "main").limit(2),
        selectOrderedTable(client, "homepage_sections", "sort_order"),
        selectOrderedTable(client, "giveaway_sessions", "created_at"),
        selectOrderedTable(client, "giveaway_items", "created_at"),
        selectOrderedTable(client, "giveaway_participants", "created_at"),
        selectOrderedTable(client, "giveaway_results", "won_at"),
        selectOrderedTable(client, "giveaway_events", "created_at")
      ]);

      if (categoriesResult.error && !isAuthBootstrapError(categoriesResult.error)) {
        throw new Error(formatDbError(categoriesResult.error));
      }
      if (productsResult.error && !isAuthBootstrapError(productsResult.error)) {
        throw new Error(formatDbError(productsResult.error));
      }
      if (productImagesResult.error && !isAuthBootstrapError(productImagesResult.error)) {
        throw new Error(formatDbError(productImagesResult.error));
      }
      if (storeSettingsResult.error && !isAuthBootstrapError(storeSettingsResult.error)) {
        throw new Error(formatDbError(storeSettingsResult.error));
      }
      if (sellerSettingsResult.error && !isAuthBootstrapError(sellerSettingsResult.error)) {
        throw new Error(formatDbError(sellerSettingsResult.error));
      }
      if (homepageSectionsResult.error && !isAuthBootstrapError(homepageSectionsResult.error)) {
        throw new Error(formatDbError(homepageSectionsResult.error));
      }
      if (sessionsResult.error && !isAuthBootstrapError(sessionsResult.error)) {
        throw new Error(formatDbError(sessionsResult.error));
      }
      if (itemsResult.error && !isAuthBootstrapError(itemsResult.error)) {
        throw new Error(formatDbError(itemsResult.error));
      }
      if (participantsResult.error && !isAuthBootstrapError(participantsResult.error)) {
        throw new Error(formatDbError(participantsResult.error));
      }
      if (resultsResult.error && !isAuthBootstrapError(resultsResult.error)) {
        throw new Error(formatDbError(resultsResult.error));
      }
      if (eventsResult.error && !isAuthBootstrapError(eventsResult.error)) {
        throw new Error(formatDbError(eventsResult.error));
      }

      const activeProfile = profile ?? buildGuestProfile(context);

      let favorites = fallback.favorites;
      if (profile && isUuid(profile.id)) {
        const favoritesResult = await client
          .from("favorites")
          .select("*")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false });

        if (!favoritesResult.error && favoritesResult.data) {
          favorites = favoritesResult.data.map(mapFavorite);
        } else {
          favorites = [];
        }
      } else {
        favorites = [];
      }

      const storeSettingsRow = storeSettingsResult.error
        ? null
        : unwrapOptionalRow(storeSettingsResult.data, null, {
            context: "store_settings main",
            onMultiple: "first"
          });
      const sellerSettingsRow = sellerSettingsResult.error
        ? null
        : unwrapOptionalRow(sellerSettingsResult.data, null, {
            context: "seller_settings main",
            onMultiple: "first"
          });

      return {
        activeProfileId: activeProfile.id,
        profiles: [activeProfile],
        categories: categoriesResult.error
          ? fallback.categories
          : (categoriesResult.data ?? []).map(mapCategory),
        products: productsResult.error ? fallback.products : (productsResult.data ?? []).map(mapProduct),
        productImages: productImagesResult.error
          ? fallback.productImages
          : (productImagesResult.data ?? []).map(mapProductImage),
        favorites,
        storeSettings: storeSettingsRow ? mapStoreSettings(storeSettingsRow) : fallback.storeSettings,
        sellerSettings: sellerSettingsRow ? mapSellerSettings(sellerSettingsRow) : fallback.sellerSettings,
        homepageSections: homepageSectionsResult.error
          ? fallback.homepageSections
          : (homepageSectionsResult.data ?? []).map(mapHomepageSection),
        giveawaySessions: sessionsResult.error
          ? fallback.giveawaySessions
          : (sessionsResult.data ?? []).map(mapGiveawaySession),
        giveawayItems: itemsResult.error
          ? fallback.giveawayItems
          : (itemsResult.data ?? []).map(mapGiveawayItem),
        giveawayParticipants: participantsResult.error
          ? fallback.giveawayParticipants
          : (participantsResult.data ?? []).map(mapGiveawayParticipant),
        giveawayResults: resultsResult.error
          ? fallback.giveawayResults
          : (resultsResult.data ?? []).map(mapGiveawayResult),
        giveawayEvents: eventsResult.error
          ? fallback.giveawayEvents
          : (eventsResult.data ?? []).map(mapGiveawayEvent)
      };
    },
    async reloadProfile(currentProfileId, context) {
      const client = assertClient();
      const profile = await resolveProfile(client, context);
      if (profile) {
        return {
          activeProfileId: profile.id,
          profiles: [profile]
        };
      }

      const guest = buildGuestProfile(context);
      return {
        activeProfileId: currentProfileId || guest.id,
        profiles: [guest]
      };
    },
    async upsertCategory(category) {
      const client = assertClient();
      const categoryId = assertUuid(category.id, "category.id");
      const safeParentCategoryId = isUuid(category.parentCategoryId) ? category.parentCategoryId : null;
      const { data, error } = await client
        .from("categories")
        .upsert(
          toCategoryInsert({
            ...category,
            id: categoryId,
            parentCategoryId: safeParentCategoryId
          })
        )
        .select("*");

      return mapCategory(
        unwrapMutationRow(data, error, {
          noRowMessage: "Категория не сохранена: запись недоступна или не создана."
        })
      );
    },
    async deleteCategory(categoryId) {
      const client = assertClient();
      const safeCategoryId = assertUuid(categoryId, "category.id");

      const [childrenResult, productsResult, sectionsResult] = await Promise.all([
        client.from("categories").select("id").eq("parent_category_id", safeCategoryId).limit(1),
        client.from("products").select("id").eq("category_id", safeCategoryId).limit(1),
        client.from("homepage_sections").select("id").eq("linked_category_id", safeCategoryId).limit(1)
      ]);

      if (childrenResult.error) {
        throw new Error(formatDbError(childrenResult.error));
      }
      if (productsResult.error) {
        throw new Error(formatDbError(productsResult.error));
      }
      if (sectionsResult.error) {
        throw new Error(formatDbError(sectionsResult.error));
      }

      if ((childrenResult.data ?? []).length > 0) {
        throw new Error("РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ, РїРѕРєР° Сѓ РЅРµС‘ РµСЃС‚СЊ РїРѕРґРєР°С‚РµРіРѕСЂРёРё.");
      }
      if ((productsResult.data ?? []).length > 0) {
        throw new Error("РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ, РїРѕРєР° Рє РЅРµР№ РїСЂРёРІСЏР·Р°РЅС‹ С‚РѕРІР°СЂС‹.");
      }
      if ((sectionsResult.data ?? []).length > 0) {
        throw new Error("РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ, РїРѕРєР° РѕРЅР° РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РІ storefront-СЃРµРєС†РёРё.");
      }

      const { error } = await client.from("categories").delete().eq("id", safeCategoryId);
      if (error) {
        throw new Error(formatDbError(error));
      }
    },
    async upsertHomepageSection(section) {
      const client = assertClient();
      const sectionId = assertUuid(section.id, "homepageSection.id");
      const safeLinkedCategoryId = isUuid(section.linkedCategoryId) ? section.linkedCategoryId : null;
      const safeLinkedProductIds = section.linkedProductIds.filter((id) => isUuid(id));

      const { data, error } = await client
        .from("homepage_sections")
        .upsert({
          id: sectionId,
          section_type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          linked_category_id: safeLinkedCategoryId,
          linked_product_ids: safeLinkedProductIds,
          is_enabled: section.isEnabled,
          sort_order: section.sortOrder
        })
        .select("*");

      return mapHomepageSection(
        unwrapMutationRow(data, error, {
          noRowMessage: "Секция витрины не сохранена: запись недоступна или не создана."
        })
      );
    },
    async deleteHomepageSection(sectionId: string) {
      const client = assertClient();
      const safeSectionId = assertUuid(sectionId, "homepageSection.id");
      const { error } = await client.from("homepage_sections").delete().eq("id", safeSectionId);
      if (error) {
        throw new Error(formatDbError(error));
      }
    },
    async upsertProduct({ product, imageUrls }) {
      const client = assertClient();
      const productId = assertUuid(product.id, "product.id");
      const categoryId = assertUuid(product.categoryId, "product.categoryId");

      const { data, error } = await client
        .from("products")
        .upsert(
          toProductInsert({
            ...product,
            id: productId,
            categoryId
          })
        )
        .select("*");

      const savedProduct = unwrapMutationRow(data, error, {
        noRowMessage: "Товар не сохранен: запись недоступна или не создана."
      });

      const cleanUrls = imageUrls.map((item) => item.trim()).filter(Boolean);
      const deleteResult = await client.from("product_images").delete().eq("product_id", savedProduct.id);
      if (deleteResult.error) {
        throw new Error(formatDbError(deleteResult.error));
      }

      if (cleanUrls.length > 0) {
        const imageInsert = cleanUrls.map((url, index) => ({
          id: createUuid(),
          product_id: savedProduct.id,
          url,
          is_primary: index === 0,
          position: index + 1
        }));

        const insertResult = await client.from("product_images").insert(imageInsert);
        if (insertResult.error) {
          throw new Error(formatDbError(insertResult.error));
        }
      }

      const imagesResult = await client
        .from("product_images")
        .select("*")
        .eq("product_id", savedProduct.id)
        .order("position", { ascending: true });

      if (imagesResult.error) {
        throw new Error(formatDbError(imagesResult.error));
      }

      return {
        product: mapProduct(savedProduct),
        productImages: imagesResult.data.map(mapProductImage)
      };
    },
    async deleteProduct(productId) {
      const client = assertClient();
      const safeProductId = assertUuid(productId, "product.id");

      const giveawayHistory = await client
        .from("giveaway_results")
        .select("id")
        .eq("product_id", safeProductId)
        .limit(1);

      if (giveawayHistory.error) {
        throw new Error(formatDbError(giveawayHistory.error));
      }

      if ((giveawayHistory.data ?? []).length > 0) {
        throw new Error("Нельзя удалить товар, который уже участвовал в результатах розыгрыша.");
      }

      const imageRows = await client
        .from("product_images")
        .select("storage_path")
        .eq("product_id", safeProductId);

      if (imageRows.error) {
        throw new Error(formatDbError(imageRows.error));
      }

      const bucket = getStorageBucketName();
      const storagePaths = (imageRows.data ?? [])
        .map((row: { storage_path: string | null }) => row.storage_path)
        .filter((path: string | null): path is string => Boolean(path));

      if (storagePaths.length > 0) {
        const storageResult = await client.storage.from(bucket).remove(storagePaths);
        if (storageResult.error) {
          throw new Error(formatStorageError(storageResult.error, bucket));
        }
      }

      const giveawayItemsDelete = await client
        .from("giveaway_items")
        .delete()
        .eq("product_id", safeProductId);

      if (giveawayItemsDelete.error) {
        throw new Error(formatDbError(giveawayItemsDelete.error));
      }

      const deleteResult = await client.from("products").delete().eq("id", safeProductId);
      if (deleteResult.error) {
        throw new Error(formatDbError(deleteResult.error));
      }

      const homepageSections = await client
        .from("homepage_sections")
        .select("id, linked_product_ids");

      if (homepageSections.error) {
        throw new Error(formatDbError(homepageSections.error));
      }

      const impactedSections = (homepageSections.data ?? []).filter((section: { id: string; linked_product_ids: string[] | null }) =>
        (section.linked_product_ids ?? []).includes(safeProductId)
      );

      for (const section of impactedSections) {
        const nextIds = (section.linked_product_ids ?? []).filter(
          (linkedId: string) => linkedId !== safeProductId
        );
        const updateSection = await client
          .from("homepage_sections")
          .update({ linked_product_ids: nextIds })
          .eq("id", section.id);

        if (updateSection.error) {
          throw new Error(formatDbError(updateSection.error));
        }
      }
    },
    async updateProductFlags(productId, patch) {
      const client = assertClient();
      const safeProductId = assertUuid(productId, "product.id");
      const { data, error } = await client
        .from("products")
        .update({
          is_visible: patch.isVisible,
          is_available: patch.isAvailable,
          is_giveaway_eligible: patch.isGiveawayEligible,
          is_featured: patch.isFeatured
        })
        .eq("id", safeProductId)
        .select("*");

      return mapProduct(
        unwrapMutationRow(data, error, {
          noRowMessage: "Не удалось изменить товар: он не найден или нет прав на обновление."
        })
      );
    },
    async updateStoreSettings(patch) {
      const client = assertClient();
      const payload = {
        id: "main",
        ...toStoreSettingsPatch(patch)
      };
      const { data, error } = await client.from("store_settings").upsert(payload).select("*");
      return mapStoreSettings(
        unwrapMutationRow(data, error, {
          noRowMessage: "Настройки магазина не сохранены: запись недоступна или нет прав."
        })
      );
    },
    async updateSellerSettings(patch) {
      const client = assertClient();
      const payload = {
        id: "main",
        ...toSellerSettingsPatch(patch)
      };
      const { data, error } = await client.from("seller_settings").upsert(payload).select("*");
      return mapSellerSettings(
        unwrapMutationRow(data, error, {
          noRowMessage: "Настройки продавца не сохранены: запись недоступна или нет прав."
        })
      );
    },
    async setFavorite({ profileId, productId, isFavorite }) {
      const client = assertClient();

      if (profileId.startsWith("guest_") || !isUuid(profileId)) {
        throw new Error("FAVORITES_AUTH_REQUIRED");
      }

      const safeProfileId = assertUuid(profileId, "favorite.profileId");
      const safeProductId = assertUuid(productId, "favorite.productId");

      if (isFavorite) {
        const insertResult = await client
          .from("favorites")
          .upsert({ profile_id: safeProfileId, product_id: safeProductId });
        if (insertResult.error) {
          throw new Error(formatDbError(insertResult.error));
        }
      } else {
        const deleteResult = await client
          .from("favorites")
          .delete()
          .eq("profile_id", safeProfileId)
          .eq("product_id", safeProductId);
        if (deleteResult.error) {
          throw new Error(formatDbError(deleteResult.error));
        }
      }

      const { data, error } = await client
        .from("favorites")
        .select("*")
        .eq("profile_id", safeProfileId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(formatDbError(error));
      }

      return data.map(mapFavorite);
    },
    async uploadProductImages({ productId, files }) {
      const client = assertClient();
      const safeProductId = assertUuid(productId, "product.id");
      const bucket = getStorageBucketName();

      const existingImages = await client
        .from("product_images")
        .select("*")
        .eq("product_id", safeProductId)
        .order("position", { ascending: true });

      if (existingImages.error) {
        throw new Error(formatDbError(existingImages.error));
      }

      const startPosition = existingImages.data.length + 1;

      const rows: Array<{
        id: string;
        product_id: string;
        url: string;
        storage_path: string;
        is_primary: boolean;
        position: number;
      }> = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const path = `${safeProductId}/${Date.now()}_${index}_${file.name.replace(/\s+/g, "_")}`;
        const uploadResult = await client.storage.from(bucket).upload(path, file, {
          upsert: false,
          contentType: file.type || undefined
        });

        if (uploadResult.error) {
          throw new Error(formatStorageError(uploadResult.error, bucket));
        }

        const urlResult = client.storage.from(bucket).getPublicUrl(path);
        rows.push({
          id: createUuid(),
          product_id: safeProductId,
          url: urlResult.data.publicUrl,
          storage_path: path,
          is_primary: existingImages.data.length === 0 && index === 0,
          position: startPosition + index
        });
      }

      if (rows.length > 0) {
        const insertResult = await client.from("product_images").insert(rows);
        if (insertResult.error) {
          throw new Error(formatDbError(insertResult.error));
        }
      }

      const refreshed = await client
        .from("product_images")
        .select("*")
        .eq("product_id", safeProductId)
        .order("position", { ascending: true });

      if (refreshed.error) {
        throw new Error(formatDbError(refreshed.error));
      }

      return refreshed.data.map(mapProductImage);
    },
    async createGiveawaySession(input: GiveawaySessionInput) {
      const client = assertClient();
      const spinDurationMs =
        typeof input.spinDurationMs === "number" && Number.isFinite(input.spinDurationMs)
          ? Math.max(2000, Math.min(180000, Math.round(input.spinDurationMs)))
          : 6000;

      const { data, error } = await client
        .from("giveaway_sessions")
        .insert({
          title: input.title.trim(),
          description: input.description.trim(),
          mode: input.mode ?? "scenario",
          draw_at: input.drawAt,
          status: "draft",
          spin_duration_ms: spinDurationMs
        })
        .select("*");

      const session = mapGiveawaySession(
        unwrapMutationRow(data, error, {
          noRowMessage: "Сессия розыгрыша не создана: нет прав или запись недоступна."
        })
      );
      await insertGiveawayEvent(client, {
        sessionId: session.id,
        type: "session_created",
        message: `Session "${session.title}" created.`
      });
      return session;
    },
    async updateGiveawaySession(sessionId: string, patch: GiveawaySessionPatch) {
      const client = assertClient();
      const safeSessionId = assertUuid(sessionId, "giveawaySession.id");

      const nextPatch: Record<string, unknown> = {
        title: patch.title,
        description: patch.description,
        mode: patch.mode,
        draw_at: patch.drawAt,
        status: patch.status
      };

      if (typeof patch.spinDurationMs === "number" && Number.isFinite(patch.spinDurationMs)) {
        nextPatch.spin_duration_ms = Math.max(2000, Math.min(180000, Math.round(patch.spinDurationMs)));
      }

      const { data, error } = await client
        .from("giveaway_sessions")
        .update(nextPatch)
        .eq("id", safeSessionId)
        .select("*");

      const session = mapGiveawaySession(
        unwrapMutationRow(data, error, {
          noRowMessage: "Сессия розыгрыша не обновлена: запись не найдена или нет прав."
        })
      );
      await insertGiveawayEvent(client, {
        sessionId: session.id,
        type: "session_updated",
        message: `Session "${session.title}" updated.`
      });
      return session;
    },
    async updateGiveawaySessionStatus(sessionId, status) {
      const client = assertClient();
      const safeSessionId = assertUuid(sessionId, "giveawaySession.id");
      const { data, error } = await client
        .from("giveaway_sessions")
        .update({ status })
        .eq("id", safeSessionId)
        .select("*");

      const session = mapGiveawaySession(
        unwrapMutationRow(data, error, {
          noRowMessage: "Статус сессии не обновлен: запись не найдена или нет прав."
        })
      );
      await insertGiveawayEvent(client, {
        sessionId: session.id,
        type: status === "completed" ? "session_completed" : "session_status_changed",
        message: `Session moved to ${status}.`
      });
      return session;
    },
    async saveGiveawayItem(item) {
      const client = assertClient();
      const safeItemId = assertUuid(item.id, "giveawayItem.id");
      const safeSessionId = assertUuid(item.sessionId, "giveawayItem.sessionId");
      const safeProductId = isUuid(item.productId) ? item.productId : null;

      const { data, error } = await client
        .from("giveaway_items")
        .upsert(
          {
            id: safeItemId,
            session_id: safeSessionId,
            item_type: item.itemType,
            product_id: safeProductId,
            title: item.title,
            description: item.description,
            emoji: item.emoji,
            image_url: item.imageUrl,
            slots: item.slots,
            is_active: item.isActive
          },
          item.itemType === "catalog_product" && safeProductId
            ? { onConflict: "session_id,product_id" }
            : undefined
        )
        .select("*");

      const saved = mapGiveawayItem(
        unwrapMutationRow(data, error, {
          noRowMessage: "Лот не сохранен: запись недоступна или нет прав."
        })
      );
      await insertGiveawayEvent(client, {
        sessionId: saved.sessionId,
        type: "lot_added",
        message: `Lot "${saved.title}" saved.`
      });
      return saved;
    },
    async removeGiveawayItem(itemId: string) {
      const client = assertClient();
      const safeItemId = assertUuid(itemId, "giveawayItem.id");
      const itemLookup = await client.from("giveaway_items").select("*").eq("id", safeItemId).limit(2);
      const itemRow = unwrapOptionalRow(itemLookup.data, itemLookup.error, {
        context: "giveaway item by id",
        onMultiple: "first"
      });
      if (!itemRow) {
        return;
      }

      const resultLookup = await client
        .from("giveaway_results")
        .select("id")
        .eq("giveaway_item_id", safeItemId)
        .limit(1);

      if (resultLookup.error) {
        throw new Error(formatDbError(resultLookup.error));
      }
      if ((resultLookup.data ?? []).length > 0) {
        throw new Error("Lot cannot be deleted because it is already present in giveaway history.");
      }

      const { error } = await client.from("giveaway_items").delete().eq("id", safeItemId);
      if (error) {
        throw new Error(formatDbError(error));
      }
      await insertGiveawayEvent(client, {
        sessionId: itemRow.session_id,
        type: "lot_removed",
        message: `Lot "${itemRow.title}" removed.`
      });
    },
    async saveGiveawayParticipant(participant) {
      const client = assertClient();
      const safeParticipantId = assertUuid(participant.id, "giveawayParticipant.id");
      const safeSessionId = assertUuid(participant.sessionId, "giveawayParticipant.sessionId");
      const { data, error } = await client
        .from("giveaway_participants")
        .upsert({
          id: safeParticipantId,
          session_id: safeSessionId,
          nickname: participant.nickname,
          comment: participant.comment
        })
        .select("*");

      const saved = mapGiveawayParticipant(
        unwrapMutationRow(data, error, {
          noRowMessage: "Participant was not saved."
        })
      );
      await insertGiveawayEvent(client, {
        sessionId: saved.sessionId,
        type: "participant_added",
        message: `Participant "${saved.nickname}" saved.`
      });
      return saved;
    },
    async removeGiveawayParticipant(participantId: string) {
      const client = assertClient();
      const safeParticipantId = assertUuid(participantId, "giveawayParticipant.id");
      const participantLookup = await client
        .from("giveaway_participants")
        .select("*")
        .eq("id", safeParticipantId)
        .limit(2);
      const participantRow = unwrapOptionalRow(participantLookup.data, participantLookup.error, {
        context: "giveaway participant by id",
        onMultiple: "first"
      });
      if (!participantRow) {
        return;
      }

      const resultLookup = await client
        .from("giveaway_results")
        .select("id")
        .eq("participant_id", safeParticipantId)
        .limit(1);

      if (resultLookup.error) {
        throw new Error(formatDbError(resultLookup.error));
      }
      if ((resultLookup.data ?? []).length > 0) {
        throw new Error("Participant cannot be deleted because giveaway history already references them.");
      }

      const { error } = await client.from("giveaway_participants").delete().eq("id", safeParticipantId);
      if (error) {
        throw new Error(formatDbError(error));
      }
      await insertGiveawayEvent(client, {
        sessionId: participantRow.session_id,
        type: "participant_removed",
        message: `Participant "${participantRow.nickname}" removed.`
      });
    },
    async createGiveawayResult(input) {
      const client = assertClient();
      const safeSessionId = assertUuid(input.sessionId, "giveawayResult.sessionId");
      const safeGiveawayItemId = assertUuid(input.giveawayItemId, "giveawayResult.giveawayItemId");
      const safeProductId = isUuid(input.productId) ? input.productId : null;
      const safeParticipantId = isUuid(input.participantId) ? input.participantId : null;
      const safeProfileId = isUuid(input.profileId) ? input.profileId : null;

      const insertResult = await client
        .from("giveaway_results")
        .insert({
          id: createUuid(),
          session_id: safeSessionId,
          giveaway_item_id: safeGiveawayItemId,
          item_type: input.itemType,
          product_id: safeProductId,
          participant_id: safeParticipantId,
          prize_title: input.prizeTitle,
          profile_id: safeProfileId,
          winner_nickname: input.winnerNickname,
          spin_duration_ms: input.spinDurationMs,
          note: input.note?.trim() || ""
        })
        .select("*");

      const resultRow = unwrapMutationRow(insertResult.data, insertResult.error, {
        noRowMessage: "Результат розыгрыша не сохранен: нет прав или запись не создана."
      });

      const itemResult = await client
        .from("giveaway_items")
        .update({ is_active: false })
        .eq("id", safeGiveawayItemId)
        .select("*");

      const itemRow = unwrapMutationRow(itemResult.data, itemResult.error, {
        noRowMessage: "Лот не обновлен после спина: запись не найдена или недоступна."
      });

      const remainingResult = await client
        .from("giveaway_items")
        .select("id")
        .eq("session_id", safeSessionId)
        .eq("is_active", true);

      if (remainingResult.error) {
        throw new Error(formatDbError(remainingResult.error));
      }

      const createdEvents = [
        await insertGiveawayEvent(client, {
          sessionId: safeSessionId,
          type: "spin_started",
          message: `Spin started for "${input.prizeTitle}".`
        }),
        await insertGiveawayEvent(client, {
          sessionId: safeSessionId,
          type: "result_recorded",
          message: `${input.winnerNickname || "Unnamed participant"} won "${input.prizeTitle}".`
        })
      ];

      let updatedSession = null;
      if ((remainingResult.data?.length ?? 0) === 0) {
        const completeResult = await client
          .from("giveaway_sessions")
          .update({ status: "completed" })
          .eq("id", safeSessionId)
          .select("*");

        updatedSession = mapGiveawaySession(
          unwrapMutationRow(completeResult.data, completeResult.error, {
            noRowMessage: "Session status was not updated after final spin."
          })
        );
        createdEvents.push(
          await insertGiveawayEvent(client, {
            sessionId: safeSessionId,
            type: "session_completed",
            message: `Session "${updatedSession.title}" completed.`
          })
        );
      }

      return {
        result: mapGiveawayResult(resultRow),
        updatedItem: mapGiveawayItem(itemRow),
        updatedSession,
        createdEvents
      };
    },
    async listGiveawayResults() {
      const client = assertClient();
      const { data, error } = await client
        .from("giveaway_results")
        .select("*")
        .order("won_at", { ascending: false });

      if (error) {
        throw new Error(formatDbError(error));
      }

      return data.map(mapGiveawayResult);
    }
  };
}
