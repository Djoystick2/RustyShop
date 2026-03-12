import { createUuid } from "../../lib/id";
import type { Profile } from "../../types/entities";
import type { GiveawaySessionInput, GiveawaySessionPatch } from "../state";
import { createFallbackBootstrap } from "../state";
import { getStorageBucketName, getSupabaseClient } from "../supabase/client";
import type { AppRepository, BootstrapContext } from "./contracts";
import {
  mapCategory,
  mapFavorite,
  mapHomepageSection,
  mapGiveawayItem,
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

async function ensureSingletonRows(client: SupabaseClient) {
  await client.from("store_settings").upsert({ id: "main" }).select("id").maybeSingle();
  await client.from("seller_settings").upsert({ id: "main" }).select("id").maybeSingle();
}

async function resolveProfile(client: SupabaseClient, context: BootstrapContext): Promise<Profile | null> {
  const authResult = await client.auth.getUser();
  const authUserId = authResult.data.user?.id ?? null;

  if (authUserId) {
    const profileByAuth = await client
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!profileByAuth.error && profileByAuth.data) {
      return mapProfile(profileByAuth.data);
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
    .maybeSingle();

  if (!profileByTelegram.error && profileByTelegram.data) {
    return mapProfile(profileByTelegram.data);
  }

  // Attempt lightweight profile creation for environments where policy allows it.
  const displayName = [context.telegramUser?.first_name, context.telegramUser?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const createResult = await client
    .from("profiles")
    .insert({
      telegram_user_id: telegramId,
      display_name: displayName || "Покупатель",
      about: "",
      role: "user",
      avatar_url: ""
    })
    .select("*")
    .maybeSingle();

  if (!createResult.error && createResult.data) {
    return mapProfile(createResult.data);
  }

  return null;
}

async function selectOrderedTable(client: SupabaseClient, table: string, orderBy: string) {
  return client.from(table).select("*").order(orderBy as never, { ascending: true });
}

export function createSupabaseRepository(): AppRepository {
  return {
    kind: "supabase",
    async bootstrap(context) {
      const client = assertClient();
      await ensureSingletonRows(client);

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
        resultsResult
      ] = await Promise.all([
        selectOrderedTable(client, "categories", "sort_order"),
        selectOrderedTable(client, "products", "created_at"),
        selectOrderedTable(client, "product_images", "position"),
        client.from("store_settings").select("*").eq("id", "main").single(),
        client.from("seller_settings").select("*").eq("id", "main").single(),
        selectOrderedTable(client, "homepage_sections", "sort_order"),
        selectOrderedTable(client, "giveaway_sessions", "created_at"),
        selectOrderedTable(client, "giveaway_items", "created_at"),
        selectOrderedTable(client, "giveaway_results", "won_at")
      ]);

      if (categoriesResult.error) {
        throw new Error(formatDbError(categoriesResult.error));
      }
      if (productsResult.error) {
        throw new Error(formatDbError(productsResult.error));
      }
      if (productImagesResult.error) {
        throw new Error(formatDbError(productImagesResult.error));
      }
      if (storeSettingsResult.error) {
        throw new Error(formatDbError(storeSettingsResult.error));
      }
      if (sellerSettingsResult.error) {
        throw new Error(formatDbError(sellerSettingsResult.error));
      }
      if (homepageSectionsResult.error) {
        throw new Error(formatDbError(homepageSectionsResult.error));
      }
      if (sessionsResult.error) {
        throw new Error(formatDbError(sessionsResult.error));
      }
      if (itemsResult.error) {
        throw new Error(formatDbError(itemsResult.error));
      }
      if (resultsResult.error) {
        throw new Error(formatDbError(resultsResult.error));
      }

      const activeProfile = profile ?? buildGuestProfile(context);
      let favorites = createFallbackBootstrap().favorites;
      if (profile) {
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

      return {
        activeProfileId: activeProfile.id,
        profiles: [activeProfile],
        categories: categoriesResult.data.map(mapCategory),
        products: productsResult.data.map(mapProduct),
        productImages: productImagesResult.data.map(mapProductImage),
        favorites,
        storeSettings: mapStoreSettings(storeSettingsResult.data),
        sellerSettings: mapSellerSettings(sellerSettingsResult.data),
        homepageSections: homepageSectionsResult.data.map(mapHomepageSection),
        giveawaySessions: sessionsResult.data.map(mapGiveawaySession),
        giveawayItems: itemsResult.data.map(mapGiveawayItem),
        giveawayResults: resultsResult.data.map(mapGiveawayResult)
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
      const { data, error } = await client
        .from("categories")
        .upsert(toCategoryInsert(category))
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapCategory(data);
    },
    async upsertHomepageSection(section) {
      const client = assertClient();
      const { data, error } = await client
        .from("homepage_sections")
        .upsert({
          id: section.id,
          section_type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          linked_category_id: section.linkedCategoryId,
          linked_product_ids: section.linkedProductIds,
          is_enabled: section.isEnabled,
          sort_order: section.sortOrder
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapHomepageSection(data);
    },
    async deleteHomepageSection(sectionId: string) {
      const client = assertClient();
      const { error } = await client.from("homepage_sections").delete().eq("id", sectionId);
      if (error) {
        throw new Error(formatDbError(error));
      }
    },
    async upsertProduct({ product, imageUrls }) {
      const client = assertClient();
      const { data, error } = await client
        .from("products")
        .upsert(toProductInsert(product))
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      const cleanUrls = imageUrls.map((item) => item.trim()).filter(Boolean);
      const deleteResult = await client.from("product_images").delete().eq("product_id", data.id);
      if (deleteResult.error) {
        throw new Error(formatDbError(deleteResult.error));
      }

      if (cleanUrls.length > 0) {
        const imageInsert = cleanUrls.map((url, index) => ({
          id: createUuid(),
          product_id: data.id,
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
        .eq("product_id", data.id)
        .order("position", { ascending: true });

      if (imagesResult.error) {
        throw new Error(formatDbError(imagesResult.error));
      }

      return {
        product: mapProduct(data),
        productImages: imagesResult.data.map(mapProductImage)
      };
    },
    async updateProductFlags(productId, patch) {
      const client = assertClient();
      const { data, error } = await client
        .from("products")
        .update({
          is_visible: patch.isVisible,
          is_available: patch.isAvailable,
          is_giveaway_eligible: patch.isGiveawayEligible,
          is_featured: patch.isFeatured
        })
        .eq("id", productId)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapProduct(data);
    },
    async updateStoreSettings(patch) {
      const client = assertClient();
      const payload = {
        id: "main",
        ...toStoreSettingsPatch(patch)
      };
      const { data, error } = await client.from("store_settings").upsert(payload).select("*").single();
      if (error || !data) {
        throw new Error(formatDbError(error));
      }
      return mapStoreSettings(data);
    },
    async updateSellerSettings(patch) {
      const client = assertClient();
      const payload = {
        id: "main",
        ...toSellerSettingsPatch(patch)
      };
      const { data, error } = await client.from("seller_settings").upsert(payload).select("*").single();
      if (error || !data) {
        throw new Error(formatDbError(error));
      }
      return mapSellerSettings(data);
    },
    async setFavorite({ profileId, productId, isFavorite }) {
      const client = assertClient();

      if (profileId.startsWith("guest_")) {
        throw new Error("Избранное в Supabase режиме доступно после Telegram авторизации.");
      }

      if (isFavorite) {
        const insertResult = await client
          .from("favorites")
          .upsert({ profile_id: profileId, product_id: productId });
        if (insertResult.error) {
          throw new Error(formatDbError(insertResult.error));
        }
      } else {
        const deleteResult = await client
          .from("favorites")
          .delete()
          .eq("profile_id", profileId)
          .eq("product_id", productId);
        if (deleteResult.error) {
          throw new Error(formatDbError(deleteResult.error));
        }
      }

      const { data, error } = await client
        .from("favorites")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(formatDbError(error));
      }

      return data.map(mapFavorite);
    },
    async uploadProductImages({ productId, files }) {
      const client = assertClient();
      const bucket = getStorageBucketName();

      const existingImages = await client
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
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
        const path = `${productId}/${Date.now()}_${index}_${file.name.replace(/\s+/g, "_")}`;
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
          product_id: productId,
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
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (refreshed.error) {
        throw new Error(formatDbError(refreshed.error));
      }

      return refreshed.data.map(mapProductImage);
    },
    async createGiveawaySession(input: GiveawaySessionInput) {
      const client = assertClient();
      const { data, error } = await client
        .from("giveaway_sessions")
        .insert({
          title: input.title.trim(),
          description: input.description.trim(),
          draw_at: input.drawAt,
          status: "draft"
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapGiveawaySession(data);
    },
    async updateGiveawaySession(sessionId: string, patch: GiveawaySessionPatch) {
      const client = assertClient();
      const { data, error } = await client
        .from("giveaway_sessions")
        .update({
          title: patch.title,
          description: patch.description,
          draw_at: patch.drawAt,
          status: patch.status
        })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapGiveawaySession(data);
    },
    async updateGiveawaySessionStatus(sessionId, status) {
      const client = assertClient();
      const { data, error } = await client
        .from("giveaway_sessions")
        .update({ status })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapGiveawaySession(data);
    },
    async saveGiveawayItem(item) {
      const client = assertClient();
      const { data, error } = await client
        .from("giveaway_items")
        .upsert(
          {
            id: item.id,
            session_id: item.sessionId,
            product_id: item.productId,
            slots: item.slots,
            is_active: item.isActive
          },
          { onConflict: "session_id,product_id" }
        )
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(formatDbError(error));
      }

      return mapGiveawayItem(data);
    },
    async removeGiveawayItem(itemId: string) {
      const client = assertClient();
      const { error } = await client.from("giveaway_items").delete().eq("id", itemId);
      if (error) {
        throw new Error(formatDbError(error));
      }
    },
    async createGiveawayResult(input) {
      const client = assertClient();
      const insertResult = await client
        .from("giveaway_results")
        .insert({
          id: createUuid(),
          session_id: input.sessionId,
          product_id: input.productId,
          profile_id: input.profileId,
          winner_nickname: input.winnerNickname,
          spin_duration_ms: input.spinDurationMs,
          note: input.note?.trim() || ""
        })
        .select("*")
        .single();

      if (insertResult.error || !insertResult.data) {
        throw new Error(formatDbError(insertResult.error));
      }

      let updatedItem: ReturnType<typeof mapGiveawayItem> | null = null;
      const itemResult = await client
        .from("giveaway_items")
        .update({ is_active: false })
        .eq("id", input.giveawayItemId)
        .select("*")
        .maybeSingle();

      if (!itemResult.error && itemResult.data) {
        updatedItem = mapGiveawayItem(itemResult.data);
      }

      const remainingResult = await client
        .from("giveaway_items")
        .select("id")
        .eq("session_id", input.sessionId)
        .eq("is_active", true);

      if (!remainingResult.error && (remainingResult.data?.length ?? 0) === 0) {
        await client
          .from("giveaway_sessions")
          .update({ status: "completed" })
          .eq("id", input.sessionId);
      }

      return {
        result: mapGiveawayResult(insertResult.data),
        updatedItem
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
