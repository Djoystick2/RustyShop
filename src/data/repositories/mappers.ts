import type { Database } from "../../types/db";
import type {
  Category,
  Favorite,
  HomepageSection,
  GiveawayItem,
  GiveawayResult,
  GiveawaySession,
  Product,
  ProductImage,
  Profile,
  SellerSettings,
  StoreSettings
} from "../../types/entities";

type PublicTables = Database["public"]["Tables"];

export function mapProfile(row: PublicTables["profiles"]["Row"]): Profile {
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    about: row.about
  };
}

export function mapCategory(row: PublicTables["categories"]["Row"]): Category {
  return {
    id: row.id,
    slug: row.slug ?? "",
    parentCategoryId: row.parent_category_id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    imageUrl: row.image_url,
    bannerUrl: row.banner_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible
  };
}

export function mapProduct(row: PublicTables["products"]["Row"]): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    sku: row.sku,
    title: row.title,
    description: row.description,
    priceText: row.price_text,
    status: row.status,
    materials: row.materials,
    isVisible: row.is_visible,
    isAvailable: row.is_available,
    isGiveawayEligible: row.is_giveaway_eligible,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapProductImage(row: PublicTables["product_images"]["Row"]): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    isPrimary: row.is_primary,
    position: row.position
  };
}

export function mapFavorite(row: PublicTables["favorites"]["Row"]): Favorite {
  return {
    id: `${row.profile_id}_${row.product_id}`,
    profileId: row.profile_id,
    productId: row.product_id,
    createdAt: row.created_at
  };
}

export function mapStoreSettings(row: PublicTables["store_settings"]["Row"]): StoreSettings {
  return {
    id: row.id,
    storeName: row.store_name,
    brandSlogan: row.brand_slogan,
    heroBadge: row.hero_badge,
    heroImageUrl: row.hero_image_url,
    mascotEmoji: row.mascot_emoji,
    storeDescription: row.store_description,
    welcomeText: row.welcome_text,
    infoBlock: row.info_block,
    promoTitle: row.promo_title,
    promoText: row.promo_text,
    adminTelegramIds: row.admin_telegram_ids,
    updatedAt: row.updated_at
  };
}

export function mapSellerSettings(row: PublicTables["seller_settings"]["Row"]): SellerSettings {
  return {
    id: row.id,
    sellerName: row.seller_name,
    avatarUrl: row.avatar_url,
    shortBio: row.short_bio,
    brandStory: row.brand_story,
    philosophy: row.philosophy,
    materialsFocus: row.materials_focus,
    telegramUsername: row.telegram_username,
    telegramLink: row.telegram_link,
    contactText: row.contact_text,
    aboutSeller: row.about_seller,
    city: row.city,
    purchaseMessageTemplate: row.purchase_message_template,
    purchaseButtonLabel: row.purchase_button_label,
    updatedAt: row.updated_at
  };
}

export function mapHomepageSection(row: PublicTables["homepage_sections"]["Row"]): HomepageSection {
  return {
    id: row.id,
    type: row.section_type as HomepageSection["type"],
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    linkedCategoryId: row.linked_category_id,
    linkedProductIds: row.linked_product_ids,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapGiveawaySession(row: PublicTables["giveaway_sessions"]["Row"]): GiveawaySession {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    drawAt: row.draw_at,
    spinDurationMs: row.spin_duration_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapGiveawayItem(row: PublicTables["giveaway_items"]["Row"]): GiveawayItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    productId: row.product_id,
    slots: row.slots,
    isActive: row.is_active
  };
}

export function mapGiveawayResult(row: PublicTables["giveaway_results"]["Row"]): GiveawayResult {
  return {
    id: row.id,
    sessionId: row.session_id,
    productId: row.product_id,
    profileId: row.profile_id,
    winnerNickname: row.winner_nickname,
    spinDurationMs: row.spin_duration_ms,
    wonAt: row.won_at,
    note: row.note
  };
}

export function toCategoryInsert(category: Category): PublicTables["categories"]["Insert"] {
  return {
    id: category.id,
    slug: category.slug || null,
    parent_category_id: category.parentCategoryId,
    name: category.name,
    description: category.description,
    emoji: category.emoji,
    image_url: category.imageUrl,
    banner_url: category.bannerUrl,
    sort_order: category.sortOrder,
    is_visible: category.isVisible
  };
}

export function toProductInsert(product: Product): PublicTables["products"]["Insert"] {
  return {
    id: product.id,
    category_id: product.categoryId,
    sku: product.sku,
    title: product.title,
    description: product.description,
    price_text: product.priceText,
    status: product.status,
    materials: product.materials,
    is_visible: product.isVisible,
    is_available: product.isAvailable,
    is_giveaway_eligible: product.isGiveawayEligible,
    is_featured: product.isFeatured
  };
}

export function toStoreSettingsPatch(
  patch: Partial<StoreSettings>
): PublicTables["store_settings"]["Update"] {
  return {
    store_name: patch.storeName,
    brand_slogan: patch.brandSlogan,
    hero_badge: patch.heroBadge,
    hero_image_url: patch.heroImageUrl,
    mascot_emoji: patch.mascotEmoji,
    store_description: patch.storeDescription,
    welcome_text: patch.welcomeText,
    info_block: patch.infoBlock,
    promo_title: patch.promoTitle,
    promo_text: patch.promoText,
    admin_telegram_ids: patch.adminTelegramIds
  };
}

export function toSellerSettingsPatch(
  patch: Partial<SellerSettings>
): PublicTables["seller_settings"]["Update"] {
  return {
    seller_name: patch.sellerName,
    avatar_url: patch.avatarUrl,
    short_bio: patch.shortBio,
    brand_story: patch.brandStory,
    philosophy: patch.philosophy,
    materials_focus: patch.materialsFocus,
    telegram_username: patch.telegramUsername,
    telegram_link: patch.telegramLink,
    contact_text: patch.contactText,
    about_seller: patch.aboutSeller,
    city: patch.city,
    purchase_message_template: patch.purchaseMessageTemplate,
    purchase_button_label: patch.purchaseButtonLabel
  };
}
