import type {
  Category,
  Favorite,
  GiveawayEvent,
  GiveawayItem,
  GiveawayParticipant,
  GiveawayResult,
  GiveawaySession,
  HomepageSection,
  Product,
  ProductImage,
  Profile,
  SellerSettings,
  StoreSettings
} from "../types/entities";

function imagePlaceholder(label: string, bgColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <text x="50%" y="50%" text-anchor="middle" font-family="Verdana" font-size="28" fill="#5c3d2e">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const now = new Date().toISOString();
const nextWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString();

export const fallbackProfiles: Profile[] = [
  {
    id: "profile_user_demo",
    telegramUserId: null,
    displayName: "Demo Buyer",
    avatarUrl: imagePlaceholder("Buyer", "#ffe6c7"),
    role: "user",
    about: "Likes handmade goods and giveaway drops."
  },
  {
    id: "profile_admin_demo",
    telegramUserId: null,
    displayName: "Admin Maker",
    avatarUrl: imagePlaceholder("Admin", "#ffd9a1"),
    role: "admin",
    about: "Runs the catalog, store settings and giveaway sessions."
  }
];

export const fallbackCategories: Category[] = [
  {
    id: "cat_home",
    slug: "home",
    parentCategoryId: null,
    name: "Home",
    description: "Decor, candles and small cozy goods.",
    emoji: "home",
    imageUrl: imagePlaceholder("Home", "#ffe4ca"),
    bannerUrl: imagePlaceholder("Home Banner", "#fff0df"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_home_candles",
    slug: "candles",
    parentCategoryId: "cat_home",
    name: "Candles",
    description: "Wax candles and soft evening light.",
    emoji: "candle",
    imageUrl: imagePlaceholder("Candles", "#ffd8b8"),
    bannerUrl: imagePlaceholder("Candles Banner", "#ffe9d1"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_home_textile",
    slug: "textile",
    parentCategoryId: "cat_home",
    name: "Textile",
    description: "Plaids, covers and other soft goods.",
    emoji: "thread",
    imageUrl: imagePlaceholder("Textile", "#ffe8c8"),
    bannerUrl: imagePlaceholder("Textile Banner", "#fff1dd"),
    sortOrder: 2,
    isVisible: true
  },
  {
    id: "cat_toys",
    slug: "toys",
    parentCategoryId: null,
    name: "Toys",
    description: "Handmade toys and gifts.",
    emoji: "toy",
    imageUrl: imagePlaceholder("Toys", "#ffd2ad"),
    bannerUrl: imagePlaceholder("Toys Banner", "#ffe6cb"),
    sortOrder: 2,
    isVisible: true
  },
  {
    id: "cat_toys_soft",
    slug: "soft-toys",
    parentCategoryId: "cat_toys",
    name: "Soft Toys",
    description: "Soft characters and giftable plush items.",
    emoji: "bear",
    imageUrl: imagePlaceholder("Soft Toys", "#ffd7b8"),
    bannerUrl: imagePlaceholder("Soft Toys Banner", "#ffead5"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_jewelry",
    slug: "jewelry",
    parentCategoryId: null,
    name: "Jewelry",
    description: "Ceramic earrings and small accessories.",
    emoji: "gem",
    imageUrl: imagePlaceholder("Jewelry", "#ffd5aa"),
    bannerUrl: imagePlaceholder("Jewelry Banner", "#ffe7ca"),
    sortOrder: 3,
    isVisible: true
  }
];

export const fallbackProducts: Product[] = [
  {
    id: "prod_candle_luna",
    categoryId: "cat_home_candles",
    sku: "CNDL-LUNA-001",
    title: "Luna Candle",
    description: "Soy candle in a ceramic jar with vanilla scent.",
    priceText: "1 250 RUB",
    status: "new",
    materials: ["Soy wax", "Ceramic", "Fragrance oils"],
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: true,
    isFeatured: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod_plaid_cloud",
    categoryId: "cat_home_textile",
    sku: "TEXT-CLOUD-002",
    title: "Cloud Plaid",
    description: "Soft plaid for cozy evenings.",
    priceText: "4 900 RUB",
    status: "popular",
    materials: ["Merino", "Cotton"],
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: false,
    isFeatured: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod_bunny",
    categoryId: "cat_toys_soft",
    sku: "TOY-BUNNY-003",
    title: "Plush Bunny",
    description: "Soft bunny toy with hypoallergenic filling.",
    priceText: "2 300 RUB",
    status: "popular",
    materials: ["Plush yarn", "Soft filler"],
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: true,
    isFeatured: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod_amber_earrings",
    categoryId: "cat_jewelry",
    sku: "JWL-AMBER-004",
    title: "Amber Light Earrings",
    description: "Ceramic earrings with warm enamel finish.",
    priceText: "1 800 RUB",
    status: "new",
    materials: ["Ceramic", "Steel fittings"],
    isVisible: true,
    isAvailable: false,
    isGiveawayEligible: false,
    isFeatured: false,
    createdAt: now,
    updatedAt: now
  }
];

export const fallbackProductImages: ProductImage[] = [
  {
    id: "img_candle_1",
    productId: "prod_candle_luna",
    url: imagePlaceholder("Luna Candle", "#ffd8b8"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_plaid_1",
    productId: "prod_plaid_cloud",
    url: imagePlaceholder("Cloud Plaid", "#ffe1bf"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_bunny_1",
    productId: "prod_bunny",
    url: imagePlaceholder("Plush Bunny", "#ffd2ad"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_amber_1",
    productId: "prod_amber_earrings",
    url: imagePlaceholder("Amber Earrings", "#ffd5aa"),
    isPrimary: true,
    position: 1
  }
];

export const fallbackFavorites: Favorite[] = [];

export const fallbackStoreSettings: StoreSettings = {
  id: "main",
  storeName: "RustyShop Handmade",
  brandSlogan: "Warm things with a small-batch feel",
  heroBadge: "Handmade",
  heroImageUrl: "",
  mascotEmoji: "fox",
  storeDescription: "A compact storefront for cozy handmade goods.",
  welcomeText: "Welcome to a small handmade shop.",
  infoBlock: "Ships with care and supports custom requests.",
  promoTitle: "Season Pick",
  promoText: "Candles, plaids and soft gift ideas are in focus this week.",
  adminTelegramIds: [],
  updatedAt: now
};

export const fallbackSellerSettings: SellerSettings = {
  id: "main",
  sellerName: "RustyLand",
  avatarUrl: imagePlaceholder("RustyLand", "#ffe3bf"),
  shortBio: "Handmade maker from Kazan.",
  brandStory: "Started with gifts for friends and grew into a small studio.",
  philosophy: "Useful, tactile and warm items that feel personal.",
  materialsFocus: "Natural textiles, wax, ceramic and wood accents.",
  telegramUsername: "your_seller_username",
  telegramLink: "",
  contactText: "Write in Telegram to discuss details.",
  aboutSeller: "Works in a small studio and produces short runs.",
  city: "Kazan",
  purchaseMessageTemplate: "Hello. I want to buy: {product}",
  purchaseButtonLabel: "Buy",
  updatedAt: now
};

export const fallbackHomepageSections: HomepageSection[] = [
  {
    id: "section_hero",
    type: "hero",
    title: "Main Hero",
    subtitle: "",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_new",
    type: "new_arrivals",
    title: "New Arrivals",
    subtitle: "Fresh handmade items",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 20,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_featured",
    type: "recommended",
    title: "Recommended",
    subtitle: "Selection of the week",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 30,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_giveaway",
    type: "giveaway",
    title: "Giveaway",
    subtitle: "",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 40,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_category_pick",
    type: "category_pick",
    title: "Category Pick",
    subtitle: "Home",
    content: "",
    linkedCategoryId: "cat_home",
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 50,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_about",
    type: "about",
    title: "About",
    subtitle: "",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 60,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_promo",
    type: "promo",
    title: "Promo Block",
    subtitle: "",
    content: "A compact promo block for seasonal highlights.",
    linkedCategoryId: null,
    linkedProductIds: [],
    isEnabled: true,
    sortOrder: 70,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "section_seasonal",
    type: "seasonal_pick",
    title: "Seasonal Pick",
    subtitle: "Soft accents for the season",
    content: "",
    linkedCategoryId: null,
    linkedProductIds: ["prod_candle_luna", "prod_plaid_cloud"],
    isEnabled: true,
    sortOrder: 80,
    createdAt: now,
    updatedAt: now
  }
];

export const fallbackGiveawaySessions: GiveawaySession[] = [
  {
    id: "giveaway_session_spring",
    title: "Spring Scenario Giveaway",
    description: "Scenario-mode session with multiple lots and saved history.",
    mode: "scenario",
    status: "draft",
    drawAt: nextWeek,
    spinDurationMs: 6000,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "giveaway_session_quick_archive",
    title: "Quick Weekend Drop",
    description: "Completed quick giveaway example for archive view.",
    mode: "quick",
    status: "completed",
    drawAt: yesterday,
    spinDurationMs: 4000,
    createdAt: twoDaysAgo,
    updatedAt: yesterday
  }
];

export const fallbackGiveawayItems: GiveawayItem[] = [
  {
    id: "giveaway_item_1",
    sessionId: "giveaway_session_spring",
    itemType: "catalog_product",
    productId: "prod_candle_luna",
    title: "Luna Candle",
    description: "Catalog prize from the product list.",
    emoji: "gift",
    imageUrl: imagePlaceholder("Luna Candle", "#ffd8b8"),
    slots: 1,
    isActive: true,
    createdAt: now
  },
  {
    id: "giveaway_item_2",
    sessionId: "giveaway_session_spring",
    itemType: "special_prize",
    productId: null,
    title: "Free Gift Wrap",
    description: "Special prize without product binding.",
    emoji: "wrap",
    imageUrl: "",
    slots: 1,
    isActive: true,
    createdAt: now
  },
  {
    id: "giveaway_item_3",
    sessionId: "giveaway_session_quick_archive",
    itemType: "catalog_product",
    productId: "prod_bunny",
    title: "Plush Bunny",
    description: "Archived catalog prize.",
    emoji: "toy",
    imageUrl: imagePlaceholder("Plush Bunny", "#ffd2ad"),
    slots: 1,
    isActive: false,
    createdAt: twoDaysAgo
  }
];

export const fallbackGiveawayParticipants: GiveawayParticipant[] = [
  {
    id: "giveaway_participant_1",
    sessionId: "giveaway_session_spring",
    nickname: "@demo_winner",
    comment: "Seed participant",
    createdAt: now
  },
  {
    id: "giveaway_participant_2",
    sessionId: "giveaway_session_spring",
    nickname: "@lucky_follower",
    comment: "",
    createdAt: now
  },
  {
    id: "giveaway_participant_3",
    sessionId: "giveaway_session_quick_archive",
    nickname: "@archive_user",
    comment: "Won in demo archive session",
    createdAt: twoDaysAgo
  }
];

export const fallbackGiveawayResults: GiveawayResult[] = [
  {
    id: "giveaway_result_1",
    sessionId: "giveaway_session_quick_archive",
    giveawayItemId: "giveaway_item_3",
    itemType: "catalog_product",
    productId: "prod_bunny",
    participantId: "giveaway_participant_3",
    prizeTitle: "Plush Bunny",
    profileId: null,
    winnerNickname: "@archive_user",
    spinDurationMs: 4000,
    wonAt: yesterday,
    note: "Quick demo win"
  }
];

export const fallbackGiveawayEvents: GiveawayEvent[] = [
  {
    id: "giveaway_event_1",
    sessionId: "giveaway_session_spring",
    type: "session_created",
    message: "Scenario giveaway session created.",
    createdAt: now
  },
  {
    id: "giveaway_event_2",
    sessionId: "giveaway_session_spring",
    type: "lot_added",
    message: "Catalog prize Luna Candle added.",
    createdAt: now
  },
  {
    id: "giveaway_event_3",
    sessionId: "giveaway_session_spring",
    type: "lot_added",
    message: "Special prize Free Gift Wrap added.",
    createdAt: now
  },
  {
    id: "giveaway_event_4",
    sessionId: "giveaway_session_spring",
    type: "participant_added",
    message: "Participant @demo_winner added.",
    createdAt: now
  },
  {
    id: "giveaway_event_5",
    sessionId: "giveaway_session_quick_archive",
    type: "session_created",
    message: "Quick giveaway session created.",
    createdAt: twoDaysAgo
  },
  {
    id: "giveaway_event_6",
    sessionId: "giveaway_session_quick_archive",
    type: "spin_started",
    message: "Spin started for Plush Bunny.",
    createdAt: yesterday
  },
  {
    id: "giveaway_event_7",
    sessionId: "giveaway_session_quick_archive",
    type: "result_recorded",
    message: "@archive_user won Plush Bunny.",
    createdAt: yesterday
  },
  {
    id: "giveaway_event_8",
    sessionId: "giveaway_session_quick_archive",
    type: "session_completed",
    message: "Quick giveaway session completed.",
    createdAt: yesterday
  }
];
