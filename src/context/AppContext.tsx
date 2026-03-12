import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getTelegramVerifyConfig } from "../config/runtime";
import { createId, createUuid } from "../lib/id";
import { getTelegramInitData, initTelegramWebApp, verifyTelegramInitData } from "../lib/telegram";
import { hasAdminAccess } from "../security/admin-role";
import type {
  Category,
  Favorite,
  HomepageSection,
  GiveawaySessionStatus,
  Product,
  SellerSettings,
  StoreSettings
} from "../types/entities";
import { createRepository } from "../data/repositories";
import type { AppRepository } from "../data/repositories/contracts";
import type {
  AppState,
  CategoryInput,
  GiveawaySessionInput,
  GiveawaySessionPatch as SessionPatchInput,
  GiveawaySpinInput as SpinInput,
  HomepageSectionInput,
  ProductInput
} from "../data/state";
import { createFallbackBootstrap, makeAppState } from "../data/state";

type SavingKey =
  | "bootstrap"
  | "favorite"
  | "category"
  | "product"
  | "settings_store"
  | "settings_seller"
  | "homepage"
  | "giveaway";

type AuthVerificationStatus =
  | "idle"
  | "verifying"
  | "verified"
  | "failed"
  | "no_endpoint"
  | "unavailable";

interface AppContextValue {
  state: AppState;
  currentProfile: AppState["profiles"][number] | null;
  isAdmin: boolean;
  telegramUserId: number | null;
  repositoryKind: AppRepository["kind"];
  isBootstrapping: boolean;
  bootstrapError: string | null;
  actionError: string | null;
  authVerificationStatus: AuthVerificationStatus;
  authVerificationMessage: string | null;
  adminGuardMessage: string | null;
  isSaving: (key: SavingKey) => boolean;
  clearActionError: () => void;
  reload: () => Promise<void>;
  setSearchQuery: (value: string) => void;
  toggleFavorite: (productId: string) => Promise<void>;
  saveCategory: (input: CategoryInput) => Promise<void>;
  saveHomepageSection: (input: HomepageSectionInput) => Promise<void>;
  deleteHomepageSection: (sectionId: string) => Promise<void>;
  moveHomepageSection: (sectionId: string, direction: -1 | 1) => Promise<void>;
  saveProduct: (input: ProductInput) => Promise<void>;
  toggleProductVisibility: (productId: string) => Promise<void>;
  toggleProductAvailability: (productId: string) => Promise<void>;
  toggleProductGiveaway: (productId: string) => Promise<void>;
  toggleProductFeatured: (productId: string) => Promise<void>;
  updateStoreSettings: (payload: Partial<StoreSettings>) => Promise<void>;
  updateSellerSettings: (payload: Partial<SellerSettings>) => Promise<void>;
  switchProfile: (profileId: string) => void;
  createGiveawaySession: (input: GiveawaySessionInput) => Promise<void>;
  updateGiveawaySession: (sessionId: string, patch: SessionPatchInput) => Promise<void>;
  updateGiveawaySessionStatus: (sessionId: string, status: GiveawaySessionStatus) => Promise<void>;
  attachProductToGiveaway: (sessionId: string, productId: string) => Promise<void>;
  removeGiveawayItem: (itemId: string) => Promise<void>;
  runGiveawaySpin: (input: SpinInput) => Promise<void>;
  canUploadProductImages: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState = makeAppState(createFallbackBootstrap());

function mapError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("FAVORITES_AUTH_REQUIRED")) {
      return "Чтобы сохранять избранное, откройте Mini App из Telegram-аккаунта.";
    }
    return error.message;
  }
  return "Произошла ошибка. Попробуйте ещё раз.";
}

function mergeFavorites(
  existing: Favorite[],
  profileId: string,
  incoming: Favorite[]
): Favorite[] {
  const otherProfiles = existing.filter((favorite) => favorite.profileId !== profileId);
  return [...otherProfiles, ...incoming];
}

export function AppProvider({ children }: PropsWithChildren) {
  const repositoryRef = useRef(createRepository());
  const repository = repositoryRef.current;

  const [state, setState] = useState<AppState>(initialState);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authVerificationStatus, setAuthVerificationStatus] =
    useState<AuthVerificationStatus>("idle");
  const [authVerificationMessage, setAuthVerificationMessage] = useState<string | null>(null);
  const [savingMap, setSavingMap] = useState<Record<SavingKey, boolean>>({
    bootstrap: false,
    favorite: false,
    category: false,
    product: false,
    settings_store: false,
    settings_seller: false,
    homepage: false,
    giveaway: false
  });

  const telegramUser = useMemo(() => initTelegramWebApp(), []);
  const telegramUserId = telegramUser?.id ?? null;

  const runWithSaving = useCallback(async <T,>(key: SavingKey, action: () => Promise<T>) => {
    setSavingMap((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await action();
      return result;
    } finally {
      setSavingMap((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const reload = useCallback(async () => {
    setBootstrapError(null);
    setIsBootstrapping(true);
    await runWithSaving("bootstrap", async () => {
      try {
        const payload = await repository.bootstrap({ telegramUser });
        setState(makeAppState(payload));
      } catch (error) {
        setBootstrapError(mapError(error));
      } finally {
        setIsBootstrapping(false);
      }
    });
  }, [repository, runWithSaving, telegramUser]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (repository.kind !== "supabase") {
      setAuthVerificationStatus("idle");
      setAuthVerificationMessage(null);
      return;
    }

    const verifyConfig = getTelegramVerifyConfig();
    const initData = getTelegramInitData();

    if (verifyConfig.source === "fallback") {
      setAuthVerificationStatus("no_endpoint");
      setAuthVerificationMessage(
        `VITE_TELEGRAM_AUTH_VERIFY_URL не задан, используем fallback ${verifyConfig.endpoint}.`
      );
    }

    if (!initData) {
      setAuthVerificationStatus("unavailable");
      setAuthVerificationMessage("Telegram initData недоступен в текущем окружении.");
      return;
    }

    let cancelled = false;
    setAuthVerificationStatus("verifying");
    setAuthVerificationMessage(null);

    void (async () => {
      try {
        const result = await verifyTelegramInitData(initData);
        if (cancelled) {
          return;
        }
        setAuthVerificationStatus(result.ok ? "verified" : "failed");
        const endpointSuffix =
          result.endpointSource === "fallback" ? " (через same-origin fallback)" : "";
        setAuthVerificationMessage(result.message ? `${result.message}${endpointSuffix}` : null);
      } catch {
        if (!cancelled) {
          setAuthVerificationStatus("failed");
          setAuthVerificationMessage("Проверка Telegram авторизации не удалась.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [repository.kind, telegramUserId]);

  const currentProfile =
    state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0] ?? null;
  const hasRoleAccess = hasAdminAccess(currentProfile, state.storeSettings, telegramUserId);

  const adminGuardMessage = useMemo(() => {
    if (!hasRoleAccess) {
      return "Недостаточно прав для admin-действий.";
    }

    if (repository.kind === "unavailable") {
      return "Admin-действия недоступны: runtime конфигурация не завершена.";
    }

    if (repository.kind === "local") {
      return null;
    }

    if (authVerificationStatus === "verified") {
      return null;
    }

    if (authVerificationStatus === "no_endpoint") {
      return "Используется fallback verify endpoint /api/telegram/verify.";
    }

    if (authVerificationStatus === "unavailable") {
      return "Admin-действия недоступны: Telegram initData не получен.";
    }

    if (authVerificationStatus === "verifying") {
      return "Дождитесь завершения Telegram verify для admin-действий.";
    }

    return authVerificationMessage || "Admin-доступ заблокирован проверкой Telegram auth.";
  }, [authVerificationMessage, authVerificationStatus, hasRoleAccess, repository.kind]);

  const isAdmin =
    hasRoleAccess &&
    (repository.kind === "supabase"
      ? authVerificationStatus === "verified"
      : repository.kind === "local");

  const clearActionError = useCallback(() => setActionError(null), []);

  const guardAdminAction = useCallback(() => {
    if (isAdmin) {
      return true;
    }
    setActionError(adminGuardMessage ?? "Недостаточно прав для admin-действия.");
    return false;
  }, [adminGuardMessage, isAdmin]);

  const setSearchQuery = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const switchProfile = useCallback((profileId: string) => {
    setState((prev) => ({ ...prev, activeProfileId: profileId }));
  }, []);

  const saveCategory = useCallback(
    async (input: CategoryInput) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      const category: Category = {
        id: input.id ?? (repository.kind === "supabase" ? createUuid() : createId("cat")),
        name: input.name.trim(),
        description: input.description.trim(),
        emoji: input.emoji.trim() || "🧵",
        sortOrder: input.sortOrder,
        isVisible: input.isVisible
      };

      try {
        const saved = await runWithSaving("category", () => repository.upsertCategory(category));
        setState((prev) => {
          const exists = prev.categories.some((item) => item.id === saved.id);
          const categories = exists
            ? prev.categories.map((item) => (item.id === saved.id ? saved : item))
            : [...prev.categories, saved];
          return {
            ...prev,
            categories: categories.slice().sort((a, b) => a.sortOrder - b.sortOrder)
          };
        });
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const saveHomepageSection = useCallback(
    async (input: HomepageSectionInput) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      const existing = input.id ? state.homepageSections.find((item) => item.id === input.id) : null;
      const nextSection: HomepageSection = {
        id: input.id ?? (repository.kind === "supabase" ? createUuid() : createId("home_section")),
        type: input.type,
        title: input.title.trim(),
        subtitle: input.subtitle.trim(),
        content: input.content.trim(),
        linkedCategoryId: input.linkedCategoryId,
        linkedProductIds: input.linkedProductIds,
        isEnabled: input.isEnabled,
        sortOrder: input.sortOrder,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const saved = await runWithSaving("homepage", () => repository.upsertHomepageSection(nextSection));
        setState((prev) => {
          const exists = prev.homepageSections.some((item) => item.id === saved.id);
          const homepageSections = exists
            ? prev.homepageSections.map((item) => (item.id === saved.id ? saved : item))
            : [...prev.homepageSections, saved];
          return {
            ...prev,
            homepageSections: homepageSections.slice().sort((a, b) => a.sortOrder - b.sortOrder)
          };
        });
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, state.homepageSections]
  );

  const deleteHomepageSection = useCallback(
    async (sectionId: string) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        await runWithSaving("homepage", () => repository.deleteHomepageSection(sectionId));
        setState((prev) => ({
          ...prev,
          homepageSections: prev.homepageSections.filter((item) => item.id !== sectionId)
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const moveHomepageSection = useCallback(
    async (sectionId: string, direction: -1 | 1) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      const sorted = [...state.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = sorted.findIndex((item) => item.id === sectionId);
      if (currentIndex === -1) {
        return;
      }
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= sorted.length) {
        return;
      }

      const first = sorted[currentIndex];
      const second = sorted[targetIndex];
      const updatedFirst: HomepageSection = {
        ...first,
        sortOrder: second.sortOrder,
        updatedAt: new Date().toISOString()
      };
      const updatedSecond: HomepageSection = {
        ...second,
        sortOrder: first.sortOrder,
        updatedAt: new Date().toISOString()
      };

      try {
        await runWithSaving("homepage", async () => {
          await repository.upsertHomepageSection(updatedFirst);
          await repository.upsertHomepageSection(updatedSecond);
        });
        setState((prev) => ({
          ...prev,
          homepageSections: prev.homepageSections
            .map((item) => {
              if (item.id === updatedFirst.id) {
                return updatedFirst;
              }
              if (item.id === updatedSecond.id) {
                return updatedSecond;
              }
              return item;
            })
            .sort((a, b) => a.sortOrder - b.sortOrder)
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, state.homepageSections]
  );

  const saveProduct = useCallback(
    async (input: ProductInput) => {
      if (!guardAdminAction()) {
        return;
      }
      if (!input.title.trim() || !input.categoryId) {
        return;
      }

      setActionError(null);
      const existing = input.id ? state.products.find((item) => item.id === input.id) : null;
      const product: Product = {
        id: input.id ?? (repository.kind === "supabase" ? createUuid() : createId("prod")),
        categoryId: input.categoryId,
        title: input.title.trim(),
        description: input.description.trim(),
        priceText: input.priceText.trim() || "Цена по запросу",
        status: input.status,
        materials: input.materials,
        isVisible: input.isVisible,
        isAvailable: input.isAvailable,
        isGiveawayEligible: input.isGiveawayEligible,
        isFeatured: input.isFeatured,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const payload = await runWithSaving("product", () =>
          repository.upsertProduct({ product, imageUrls: input.imageUrls })
        );

        setState((prev) => {
          const products = prev.products.some((item) => item.id === payload.product.id)
            ? prev.products.map((item) => (item.id === payload.product.id ? payload.product : item))
            : [...prev.products, payload.product];
          const imagesWithoutProduct = prev.productImages.filter(
            (image) => image.productId !== payload.product.id
          );
          return {
            ...prev,
            products,
            productImages: [...imagesWithoutProduct, ...payload.productImages]
          };
        });

        if (input.imageFiles?.length && repository.uploadProductImages) {
          const uploaded = await runWithSaving("product", () =>
            repository.uploadProductImages!({
              productId: payload.product.id,
              files: input.imageFiles ?? []
            })
          );
          setState((prev) => {
            const imagesWithoutProduct = prev.productImages.filter(
              (image) => image.productId !== payload.product.id
            );
            return {
              ...prev,
              productImages: [...imagesWithoutProduct, ...uploaded]
            };
          });
        }
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, state.products]
  );

  const updateProductFlags = useCallback(
    async (
      productId: string,
      patch: Pick<Product, "isVisible" | "isAvailable" | "isGiveawayEligible" | "isFeatured">
    ) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const updated = await runWithSaving("product", () =>
          repository.updateProductFlags(productId, patch)
        );
        setState((prev) => ({
          ...prev,
          products: prev.products.map((item) => (item.id === updated.id ? updated : item))
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const toggleProductVisibility = useCallback(
    async (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        return;
      }
      await updateProductFlags(productId, {
        isVisible: !product.isVisible,
        isAvailable: product.isAvailable,
        isGiveawayEligible: product.isGiveawayEligible,
        isFeatured: product.isFeatured
      });
    },
    [state.products, updateProductFlags]
  );

  const toggleProductAvailability = useCallback(
    async (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        return;
      }
      await updateProductFlags(productId, {
        isVisible: product.isVisible,
        isAvailable: !product.isAvailable,
        isGiveawayEligible: product.isGiveawayEligible,
        isFeatured: product.isFeatured
      });
    },
    [state.products, updateProductFlags]
  );

  const toggleProductGiveaway = useCallback(
    async (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        return;
      }
      await updateProductFlags(productId, {
        isVisible: product.isVisible,
        isAvailable: product.isAvailable,
        isGiveawayEligible: !product.isGiveawayEligible,
        isFeatured: product.isFeatured
      });
    },
    [state.products, updateProductFlags]
  );

  const toggleProductFeatured = useCallback(
    async (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        return;
      }
      await updateProductFlags(productId, {
        isVisible: product.isVisible,
        isAvailable: product.isAvailable,
        isGiveawayEligible: product.isGiveawayEligible,
        isFeatured: !product.isFeatured
      });
    },
    [state.products, updateProductFlags]
  );

  const updateStoreSettings = useCallback(
    async (payload: Partial<StoreSettings>) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const saved = await runWithSaving("settings_store", () =>
          repository.updateStoreSettings(payload)
        );
        setState((prev) => ({ ...prev, storeSettings: saved }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const updateSellerSettings = useCallback(
    async (payload: Partial<SellerSettings>) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const saved = await runWithSaving("settings_seller", () =>
          repository.updateSellerSettings(payload)
        );
        setState((prev) => ({ ...prev, sellerSettings: saved }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!currentProfile) {
        return;
      }
      setActionError(null);
      const profileId = currentProfile.id;
      const isFavorite = state.favorites.some(
        (favorite) => favorite.profileId === profileId && favorite.productId === productId
      );

      const optimistic = isFavorite
        ? state.favorites.filter(
            (favorite) => !(favorite.profileId === profileId && favorite.productId === productId)
          )
        : [
            ...state.favorites,
            {
              id: createId("fav"),
              profileId,
              productId,
              createdAt: new Date().toISOString()
            }
          ];

      setState((prev) => ({ ...prev, favorites: optimistic }));

      try {
        const savedFavorites = await runWithSaving("favorite", () =>
          repository.setFavorite({ profileId, productId, isFavorite: !isFavorite })
        );
        setState((prev) => ({
          ...prev,
          favorites: mergeFavorites(prev.favorites, profileId, savedFavorites)
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, favorites: state.favorites }));
        const message = mapError(error);
        const looksLikeAuthFavoriteError =
          message.includes("FAVORITES_AUTH_REQUIRED") ||
          (message.toLowerCase().includes("supabase") && message.toLowerCase().includes("telegram"));
        setActionError(
          looksLikeAuthFavoriteError
            ? "Чтобы сохранять избранное, откройте Mini App из Telegram-аккаунта."
            : message
        );
      }
    },
    [currentProfile, repository, runWithSaving, state.favorites]
  );

  const createGiveawaySession = useCallback(
    async (input: GiveawaySessionInput) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const session = await runWithSaving("giveaway", () => repository.createGiveawaySession(input));
        setState((prev) => ({
          ...prev,
          giveawaySessions: [session, ...prev.giveawaySessions]
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const updateGiveawaySession = useCallback(
    async (sessionId: string, patch: SessionPatchInput) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const updated = await runWithSaving("giveaway", () =>
          repository.updateGiveawaySession(sessionId, patch)
        );
        setState((prev) => ({
          ...prev,
          giveawaySessions: prev.giveawaySessions.map((session) =>
            session.id === updated.id ? updated : session
          )
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const updateGiveawaySessionStatus = useCallback(
    async (sessionId: string, status: GiveawaySessionStatus) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const updated = await runWithSaving("giveaway", () =>
          repository.updateGiveawaySessionStatus(sessionId, status)
        );
        setState((prev) => ({
          ...prev,
          giveawaySessions: prev.giveawaySessions.map((session) =>
            session.id === updated.id ? updated : session
          )
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const attachProductToGiveaway = useCallback(
    async (sessionId: string, productId: string) => {
      if (!guardAdminAction()) {
        return;
      }
      const existing = state.giveawayItems.find(
        (item) => item.sessionId === sessionId && item.productId === productId
      );
      setActionError(null);

      try {
        const saved = await runWithSaving("giveaway", () =>
          repository.saveGiveawayItem({
            id: existing?.id ?? (repository.kind === "supabase" ? createUuid() : createId("giveaway_item")),
            sessionId,
            productId,
            slots: existing?.slots ?? 1,
            isActive: true
          })
        );

        setState((prev) => {
          const exists = prev.giveawayItems.some((item) => item.id === saved.id);
          return {
            ...prev,
            giveawayItems: exists
              ? prev.giveawayItems.map((item) => (item.id === saved.id ? saved : item))
              : [...prev.giveawayItems, saved]
          };
        });
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, state.giveawayItems]
  );

  const removeGiveawayItem = useCallback(
    async (itemId: string) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        await runWithSaving("giveaway", () => repository.removeGiveawayItem(itemId));
        setState((prev) => ({
          ...prev,
          giveawayItems: prev.giveawayItems.filter((item) => item.id !== itemId)
        }));
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving]
  );

  const runGiveawaySpin = useCallback(
    async (input: SpinInput) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        const payload = await runWithSaving("giveaway", () =>
          repository.createGiveawayResult({
            ...input,
            profileId: currentProfile?.id ?? null
          })
        );

        setState((prev) => {
          const nextItems =
            payload.updatedItem === null
              ? prev.giveawayItems
              : prev.giveawayItems.map((item) =>
                  item.id === payload.updatedItem!.id ? payload.updatedItem! : item
                );

          const hasRemaining = nextItems.some(
            (item) => item.sessionId === input.sessionId && item.isActive
          );

          const nextSessions = hasRemaining
            ? prev.giveawaySessions
            : prev.giveawaySessions.map((session) =>
                session.id === input.sessionId
                  ? {
                      ...session,
                      status: "completed" as const,
                      updatedAt: new Date().toISOString()
                    }
                  : session
              );

          return {
            ...prev,
            giveawayItems: nextItems,
            giveawayResults: [payload.result, ...prev.giveawayResults],
            giveawaySessions: nextSessions
          };
        });
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [currentProfile?.id, guardAdminAction, repository, runWithSaving]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      currentProfile,
      isAdmin,
      telegramUserId,
      repositoryKind: repository.kind,
      isBootstrapping,
      bootstrapError,
      actionError,
      authVerificationStatus,
      authVerificationMessage,
      adminGuardMessage,
      isSaving: (key) => Boolean(savingMap[key]),
      clearActionError,
      reload,
      setSearchQuery,
      toggleFavorite,
      saveCategory,
      saveHomepageSection,
      deleteHomepageSection,
      moveHomepageSection,
      saveProduct,
      toggleProductVisibility,
      toggleProductAvailability,
      toggleProductGiveaway,
      toggleProductFeatured,
      updateStoreSettings,
      updateSellerSettings,
      switchProfile,
      createGiveawaySession,
      updateGiveawaySession,
      updateGiveawaySessionStatus,
      attachProductToGiveaway,
      removeGiveawayItem,
      runGiveawaySpin,
      canUploadProductImages: Boolean(repository.uploadProductImages)
    }),
    [
      actionError,
      adminGuardMessage,
      authVerificationMessage,
      authVerificationStatus,
      attachProductToGiveaway,
      bootstrapError,
      clearActionError,
      createGiveawaySession,
      updateGiveawaySession,
      currentProfile,
      isAdmin,
      isBootstrapping,
      reload,
      repository.kind,
      repository.uploadProductImages,
      saveCategory,
      saveHomepageSection,
      deleteHomepageSection,
      moveHomepageSection,
      saveProduct,
      savingMap,
      setSearchQuery,
      state,
      switchProfile,
      telegramUserId,
      toggleFavorite,
      toggleProductAvailability,
      toggleProductFeatured,
      toggleProductGiveaway,
      toggleProductVisibility,
      updateGiveawaySessionStatus,
      removeGiveawayItem,
      runGiveawaySpin,
      updateSellerSettings,
      updateStoreSettings
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
