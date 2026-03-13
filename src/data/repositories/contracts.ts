import type { TelegramWebAppUser } from "../../types/telegram";
import type {
  Category,
  Favorite,
  HomepageSection,
  GiveawayItem,
  GiveawayResult,
  GiveawaySession,
  GiveawaySessionStatus,
  Product,
  ProductImage,
  Profile,
  SellerSettings,
  StoreSettings
} from "../../types/entities";
import type {
  BootstrapPayload,
  GiveawaySessionInput,
  GiveawaySessionPatch,
  GiveawaySpinInput
} from "../state";

export type RepositoryKind = "supabase" | "local" | "unavailable";

export interface BootstrapContext {
  telegramUser: TelegramWebAppUser | null;
}

export interface UpsertProductPayload {
  product: Product;
  imageUrls: string[];
}

export interface AppRepository {
  kind: RepositoryKind;
  bootstrap(context: BootstrapContext): Promise<BootstrapPayload>;
  reloadProfile(
    currentProfileId: string,
    context: BootstrapContext
  ): Promise<{ activeProfileId: string; profiles: Profile[] }>;
  upsertCategory(category: Category): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
  upsertHomepageSection(section: HomepageSection): Promise<HomepageSection>;
  deleteHomepageSection(sectionId: string): Promise<void>;
  upsertProduct(payload: UpsertProductPayload): Promise<{ product: Product; productImages: ProductImage[] }>;
  deleteProduct(productId: string): Promise<void>;
  updateProductFlags(
    productId: string,
    patch: Pick<Product, "isVisible" | "isAvailable" | "isGiveawayEligible" | "isFeatured">
  ): Promise<Product>;
  updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings>;
  updateSellerSettings(patch: Partial<SellerSettings>): Promise<SellerSettings>;
  setFavorite(params: { profileId: string; productId: string; isFavorite: boolean }): Promise<Favorite[]>;
  uploadProductImages?(params: { productId: string; files: File[] }): Promise<ProductImage[]>;
  createGiveawaySession(input: GiveawaySessionInput): Promise<GiveawaySession>;
  updateGiveawaySession(sessionId: string, patch: GiveawaySessionPatch): Promise<GiveawaySession>;
  updateGiveawaySessionStatus(
    sessionId: string,
    status: GiveawaySessionStatus
  ): Promise<GiveawaySession>;
  saveGiveawayItem(item: GiveawayItem): Promise<GiveawayItem>;
  removeGiveawayItem(itemId: string): Promise<void>;
  createGiveawayResult(input: GiveawaySpinInput & { profileId: string | null }): Promise<{
    result: GiveawayResult;
    updatedItem: GiveawayItem | null;
  }>;
  listGiveawayResults(): Promise<GiveawayResult[]>;
}
