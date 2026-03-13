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
import {
  resolveTelegramRuntimeContext,
  verifyTelegramInitData
} from "../lib/telegram";
import { hasAdminAccess } from "../security/admin-role";
import type {
  Category,
  Favorite,
  HomepageSection,
  GiveawaySessionStatus,
  Product,
  Profile,
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
import type { TelegramWebAppUser } from "../types/telegram";

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

type TelegramBridgeStatus = "loading" | "ready";

interface TelegramBridgeInfo {
  status: TelegramBridgeStatus;
  hasBridge: boolean;
  bridgeSource: "window" | "script" | "none";
  hasInitData: boolean;
  initDataSource: "webapp" | "url" | "none";
  verifyRequestSent: boolean;
}

interface AppContextValue {
  state: AppState;
  currentProfile: Profile | null;
  isAdmin: boolean;
  telegramUserId: number | null;
  telegramBridgeInfo: TelegramBridgeInfo;
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
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductVisibility: (productId: string) => Promise<void>;
  toggleProductAvailability: (productId: string) => Promise<void>;
  toggleProductFeatured: (productId: string) => Promise<void>;
  updateStoreSettings: (payload: Partial<StoreSettings>) => Promise<void>;
  updateSellerSettings: (payload: Partial<SellerSettings>) => Promise<void>;
  switchProfile: (profileId: string) => void;
  createGiveawaySession: (input: GiveawaySessionInput) => Promise<boolean>;
  updateGiveawaySession: (sessionId: string, patch: SessionPatchInput) => Promise<boolean>;
  updateGiveawaySessionStatus: (sessionId: string, status: GiveawaySessionStatus) => Promise<boolean>;
  attachProductToGiveaway: (sessionId: string, productId: string) => Promise<boolean>;
  removeGiveawayItem: (itemId: string) => Promise<boolean>;
  runGiveawaySpin: (input: SpinInput) => Promise<boolean>;
  canUploadProductImages: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState = makeAppState(createFallbackBootstrap());

function mapError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("FAVORITES_AUTH_REQUIRED")) {
      return "Чтобы сохранять избранное, откройте Mini App из Telegram-аккаунта.";
    }
    if (error.message.toLowerCase().includes("cannot coerce the result to a single json object")) {
      return "Операция не выполнена: запись не найдена или недоступна для текущих прав.";
    }
    if (error.message.toLowerCase().includes("invalid input syntax for type uuid")) {
      return "Операция не выполнена: профиль не синхронизирован с backend UUID.";
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

function isUuid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  const [verifyRequestSent, setVerifyRequestSent] = useState(false);
  const [telegramBridgeStatus, setTelegramBridgeStatus] = useState<TelegramBridgeStatus>("loading");
  const [telegramBridgeFound, setTelegramBridgeFound] = useState(false);
  const [telegramBridgeSource, setTelegramBridgeSource] = useState<"window" | "script" | "none">("none");
  const [telegramInitData, setTelegramInitData] = useState("");
  const [telegramInitDataSource, setTelegramInitDataSource] =
    useState<"webapp" | "url" | "none">("none");
  const [telegramUser, setTelegramUser] = useState<TelegramWebAppUser | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    setTelegramBridgeStatus("loading");

    void (async () => {
      const runtime = await resolveTelegramRuntimeContext();
      if (cancelled) {
        return;
      }

      setTelegramBridgeFound(runtime.hasBridge);
      setTelegramBridgeSource(runtime.bridgeSource);
      setTelegramInitData(runtime.initData);
      setTelegramInitDataSource(runtime.initDataSource);
      setTelegramUser(runtime.user);
      setTelegramBridgeStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
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

  const syncSupabaseState = useCallback(async () => {
    if (repository.kind !== "supabase") {
      return;
    }

    const payload = await repository.bootstrap({ telegramUser });
    setState((prev) => ({
      ...makeAppState(payload),
      searchQuery: prev.searchQuery
    }));
  }, [repository, telegramUser]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (repository.kind !== "supabase") {
      setAuthVerificationStatus("idle");
      setAuthVerificationMessage(null);
      setVerifyRequestSent(false);
      return;
    }

    const verifyConfig = getTelegramVerifyConfig();
    if (telegramBridgeStatus === "loading") {
      setAuthVerificationStatus("verifying");
      setAuthVerificationMessage("Подключаем Telegram bridge...");
      return;
    }

    const initData = telegramInitData.trim();

    if (!initData && telegramBridgeFound) {
      setAuthVerificationStatus("unavailable");
      setAuthVerificationMessage("Telegram bridge найден, но initData пустой.");
      return;
    }

    if (!initData && !telegramBridgeFound) {
      setAuthVerificationStatus("unavailable");
      setAuthVerificationMessage(
        "Telegram bridge не найден или не инициализирован в текущем окружении."
      );
      return;
    }

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
    setVerifyRequestSent(true);

    void (async () => {
      try {
        const result = await verifyTelegramInitData(initData);
        if (cancelled) {
          return;
        }
        if (!result.ok && verifyConfig.source === "fallback" && result.statusCode === 404) {
          setAuthVerificationStatus("no_endpoint");
        } else {
          setAuthVerificationStatus(result.ok ? "verified" : "failed");
        }
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
  }, [repository.kind, telegramBridgeFound, telegramBridgeStatus, telegramInitData]);

  const currentProfile =
    state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0] ?? null;
  const telegramBridgeInfo = useMemo<TelegramBridgeInfo>(
    () => ({
      status: telegramBridgeStatus,
      hasBridge: telegramBridgeFound,
      bridgeSource: telegramBridgeSource,
      hasInitData: Boolean(telegramInitData.trim()),
      initDataSource: telegramInitDataSource,
      verifyRequestSent
    }),
    [
      telegramBridgeFound,
      telegramBridgeSource,
      telegramBridgeStatus,
      telegramInitData,
      telegramInitDataSource,
      verifyRequestSent
    ]
  );
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
        await syncSupabaseState();
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!guardAdminAction()) {
        return;
      }
      setActionError(null);
      try {
        await runWithSaving("product", () => repository.deleteProduct(productId));
        setState((prev) => ({
          ...prev,
          products: prev.products.filter((item) => item.id !== productId),
          productImages: prev.productImages.filter((image) => image.productId !== productId),
          favorites: prev.favorites.filter((favorite) => favorite.productId !== productId),
          giveawayItems: prev.giveawayItems.filter((item) => item.productId !== productId),
          homepageSections: prev.homepageSections.map((section) => ({
            ...section,
            linkedProductIds: section.linkedProductIds.filter((linkedId) => linkedId !== productId)
          }))
        }));
        await syncSupabaseState();
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
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
        await syncSupabaseState();
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
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
        await syncSupabaseState();
      } catch (error) {
        setActionError(mapError(error));
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
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
        return false;
      }
      setActionError(null);
      try {
        const session = await runWithSaving("giveaway", () => repository.createGiveawaySession(input));
        setState((prev) => ({
          ...prev,
          giveawaySessions: [session, ...prev.giveawaySessions]
        }));
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const updateGiveawaySession = useCallback(
    async (sessionId: string, patch: SessionPatchInput) => {
      if (!guardAdminAction()) {
        return false;
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
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const updateGiveawaySessionStatus = useCallback(
    async (sessionId: string, status: GiveawaySessionStatus) => {
      if (!guardAdminAction()) {
        return false;
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
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const attachProductToGiveaway = useCallback(
    async (sessionId: string, productId: string) => {
      if (!guardAdminAction()) {
        return false;
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
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [guardAdminAction, repository, runWithSaving, state.giveawayItems, syncSupabaseState]
  );

  const removeGiveawayItem = useCallback(
    async (itemId: string) => {
      if (!guardAdminAction()) {
        return false;
      }
      setActionError(null);
      try {
        await runWithSaving("giveaway", () => repository.removeGiveawayItem(itemId));
        setState((prev) => ({
          ...prev,
          giveawayItems: prev.giveawayItems.filter((item) => item.id !== itemId)
        }));
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const runGiveawaySpin = useCallback(
    async (input: SpinInput) => {
      if (!guardAdminAction()) {
        return false;
      }
      setActionError(null);
      try {
        const profileId = isUuid(currentProfile?.id) ? currentProfile.id : null;
        const payload = await runWithSaving("giveaway", () =>
          repository.createGiveawayResult({
            ...input,
            profileId
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
        await syncSupabaseState();
        return true;
      } catch (error) {
        setActionError(mapError(error));
        return false;
      }
    },
    [currentProfile?.id, guardAdminAction, repository, runWithSaving, syncSupabaseState]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      currentProfile,
      isAdmin,
      telegramUserId,
      telegramBridgeInfo,
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
      deleteProduct,
      toggleProductVisibility,
      toggleProductAvailability,
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
      telegramBridgeInfo,
      saveCategory,
      saveHomepageSection,
      deleteHomepageSection,
      moveHomepageSection,
      saveProduct,
      deleteProduct,
      savingMap,
      setSearchQuery,
      state,
      switchProfile,
      telegramUserId,
      toggleFavorite,
      toggleProductAvailability,
      toggleProductFeatured,
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
