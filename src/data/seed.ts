import type {
  Category,
  Favorite,
  GiveawayItem,
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

export const fallbackProfiles: Profile[] = [
  {
    id: "profile_user_demo",
    telegramUserId: null,
    displayName: "Р“РѕСЃС‚СЊ СЏСЂРјР°СЂРєРё",
    avatarUrl: imagePlaceholder("РџРѕРєСѓРїР°С‚РµР»СЊ", "#ffe6c7"),
    role: "user",
    about: "Р›СЋР±Р»СЋ Р°РІС‚РѕСЂСЃРєРёРµ РІРµС‰Рё Рё СЂСѓС‡РЅСѓСЋ СЂР°Р±РѕС‚Сѓ."
  },
  {
    id: "profile_admin_demo",
    telegramUserId: null,
    displayName: "РњР°СЃС‚РµСЂ РћР»СЊРіР°",
    avatarUrl: imagePlaceholder("РњР°СЃС‚РµСЂ", "#ffd9a1"),
    role: "admin",
    about: "РЎРѕР·РґР°СЋ СѓСЋС‚РЅС‹Рµ РёР·РґРµР»РёСЏ РёР· РЅР°С‚СѓСЂР°Р»СЊРЅС‹С… РјР°С‚РµСЂРёР°Р»РѕРІ."
  }
];

export const fallbackCategories: Category[] = [
  {
    id: "cat_home",
    slug: "home",
    parentCategoryId: null,
    name: "РЈСЋС‚ РґР»СЏ РґРѕРјР°",
    description: "РЎРІРµС‡Рё, С‚РµРєСЃС‚РёР»СЊ Рё РґРµРєРѕСЂ СЂСѓС‡РЅРѕР№ СЂР°Р±РѕС‚С‹.",
    emoji: "рџЏ ",
    imageUrl: imagePlaceholder("Р”РѕРј", "#ffe4ca"),
    bannerUrl: imagePlaceholder("РЈСЋС‚ РґР»СЏ РґРѕРјР°", "#fff0df"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_home_candles",
    slug: "candles",
    parentCategoryId: "cat_home",
    name: "РЎРІРµС‡Рё",
    description: "РђСЂРѕРјР°С‚С‹, РєРµСЂР°РјРёРєР° Рё РјСЏРіРєРёР№ СЃРІРµС‚ РґР»СЏ РІРµС‡РµСЂРѕРІ.",
    emoji: "рџ•Ї",
    imageUrl: imagePlaceholder("РЎРІРµС‡Рё", "#ffd8b8"),
    bannerUrl: imagePlaceholder("РЎРІРµС‡Рё", "#ffe9d1"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_home_textile",
    slug: "textile",
    parentCategoryId: "cat_home",
    name: "РўРµРєСЃС‚РёР»СЊ",
    description: "РџР»РµРґС‹ Рё С‚Р°РєС‚РёР»СЊРЅС‹Рµ Р°РєС†РµРЅС‚С‹ РґР»СЏ РґРѕРјР°.",
    emoji: "рџ§¶",
    imageUrl: imagePlaceholder("РўРµРєСЃС‚РёР»СЊ", "#ffe8c8"),
    bannerUrl: imagePlaceholder("РўРµРєСЃС‚РёР»СЊ", "#fff1dd"),
    sortOrder: 2,
    isVisible: true
  },
  {
    id: "cat_toys",
    slug: "toys",
    parentCategoryId: null,
    name: "РРіСЂСѓС€РєРё",
    description: "РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё Рё РїРѕРґРІРµСЃС‹ РґР»СЏ РґРµС‚СЃРєРѕР№.",
    emoji: "рџ§ё",
    imageUrl: imagePlaceholder("РРіСЂСѓС€РєРё", "#ffd2ad"),
    bannerUrl: imagePlaceholder("РРіСЂСѓС€РєРё", "#ffe6cb"),
    sortOrder: 2,
    isVisible: true
  },
  {
    id: "cat_toys_soft",
    slug: "soft-toys",
    parentCategoryId: "cat_toys",
    name: "РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё",
    description: "Р’СЏР·Р°РЅС‹Рµ Рё С‚РµРєСЃС‚РёР»СЊРЅС‹Рµ РіРµСЂРѕРё РґР»СЏ РїРѕРґР°СЂРєР°.",
    emoji: "рџђ°",
    imageUrl: imagePlaceholder("РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё", "#ffd7b8"),
    bannerUrl: imagePlaceholder("РњСЏРіРєРёРµ РёРіСЂСѓС€РєРё", "#ffead5"),
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_jewelry",
    slug: "jewelry",
    parentCategoryId: null,
    name: "РЈРєСЂР°С€РµРЅРёСЏ",
    description: "РђРІС‚РѕСЂСЃРєРёРµ СЃРµСЂСЊРіРё Рё РєСѓР»РѕРЅС‹.",
    emoji: "рџ’Ќ",
    imageUrl: imagePlaceholder("РЈРєСЂР°С€РµРЅРёСЏ", "#ffd5aa"),
    bannerUrl: imagePlaceholder("РЈРєСЂР°С€РµРЅРёСЏ", "#ffe7ca"),
    sortOrder: 3,
    isVisible: true
  }
];

export const fallbackProducts: Product[] = [
  {
    id: "prod_candle_luna",
    categoryId: "cat_home_candles",
    sku: "CNDL-LUNA-001",
    title: "РЎРІРµС‡Р° В«Р›СѓРЅР° Рё Р’Р°РЅРёР»СЊВ»",
    description:
      "РЎРѕРµРІС‹Р№ РІРѕСЃРє РІ РєРµСЂР°РјРёС‡РµСЃРєРѕР№ Р±Р°РЅРѕС‡РєРµ, РјСЏРіРєРёР№ Р°СЂРѕРјР°С‚ Рё РґРѕР»РіРѕРµ РіРѕСЂРµРЅРёРµ.",
    priceText: "1 250 в‚Ѕ",
    status: "new",
    materials: ["СЃРѕРµРІС‹Р№ РІРѕСЃРє", "РєРµСЂР°РјРёРєР°", "СЌС„РёСЂРЅС‹Рµ РјР°СЃР»Р°"],
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
    title: "РџР»РµРґ В«РћР±Р»Р°РєРѕВ»",
    description: "РњСЏРіРєРёР№ РІСЏР·Р°РЅС‹Р№ РїР»РµРґ РґР»СЏ СѓСЋС‚РЅС‹С… РІРµС‡РµСЂРѕРІ.",
    priceText: "4 900 в‚Ѕ",
    status: "popular",
    materials: ["РјРµСЂРёРЅРѕСЃ", "С…Р»РѕРїРѕРє"],
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
    title: "Р—Р°Р№РєР° В«РџР»РѕРјР±РёСЂВ»",
    description: "Р’СЏР·Р°РЅР°СЏ РјСЏРіРєР°СЏ РёРіСЂСѓС€РєР° СЃ РіРёРїРѕР°Р»Р»РµСЂРіРµРЅРЅС‹Рј РЅР°РїРѕР»РЅРёС‚РµР»РµРј.",
    priceText: "2 300 в‚Ѕ",
    status: "popular",
    materials: ["РїР»СЋС€РµРІР°СЏ РїСЂСЏР¶Р°", "РЅР°РїРѕР»РЅРёС‚РµР»СЊ"],
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
    title: "РЎРµСЂСЊРіРё В«РЇРЅС‚Р°СЂРЅС‹Р№ СЃРІРµС‚В»",
    description: "Р›РµРіРєРёРµ СЃРµСЂСЊРіРё СЃ СЂСѓС‡РЅРѕР№ СЂРѕСЃРїРёСЃСЊСЋ.",
    priceText: "1 800 в‚Ѕ",
    status: "new",
    materials: ["РїРѕР»РёРјРµСЂРЅР°СЏ РіР»РёРЅР°", "С„СѓСЂРЅРёС‚СѓСЂР° РёР· СЃС‚Р°Р»Рё"],
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
    url: imagePlaceholder("РЎРІРµС‡Р°", "#ffd8b8"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_plaid_1",
    productId: "prod_plaid_cloud",
    url: imagePlaceholder("РџР»РµРґ", "#ffe1bf"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_bunny_1",
    productId: "prod_bunny",
    url: imagePlaceholder("Р—Р°Р№РєР°", "#ffd2ad"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_amber_1",
    productId: "prod_amber_earrings",
    url: imagePlaceholder("РЎРµСЂСЊРіРё", "#ffd5aa"),
    isPrimary: true,
    position: 1
  }
];

export const fallbackFavorites: Favorite[] = [];

export const fallbackStoreSettings: StoreSettings = {
  id: "main",
  storeName: "РЇСЂРјР°СЂРєР° РјР°СЃС‚РµСЂР°",
  brandSlogan: "РўРµРїР»С‹Рµ РІРµС‰Рё СЃ РґСѓС€РѕР№ Рё С…Р°СЂР°РєС‚РµСЂРѕРј",
  heroBadge: "Р СѓС‡РЅР°СЏ СЂР°Р±РѕС‚Р°",
  heroImageUrl: "",
  mascotEmoji: "рџ¦Љ",
  storeDescription: "РџРµСЂСЃРѕРЅР°Р»СЊРЅС‹Р№ РјР°РіР°Р·РёРЅ СѓСЋС‚РЅС‹С… РІРµС‰РµР№ СЂСѓС‡РЅРѕР№ СЂР°Р±РѕС‚С‹.",
  welcomeText: "Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ! Р—РґРµСЃСЊ РєР°Р¶РґР°СЏ РІРµС‰СЊ СЃРґРµР»Р°РЅР° СЃ Р·Р°Р±РѕС‚РѕР№.",
  infoBlock: "РћС‚РїСЂР°РІРєР° РїРѕ Р РѕСЃСЃРёРё Рё РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ РёРЅРґРёРІРёРґСѓР°Р»СЊРЅРѕРіРѕ Р·Р°РєР°Р·Р°.",
  promoTitle: "РЎРµР·РѕРЅРЅР°СЏ РїРѕРґР±РѕСЂРєР°",
  promoText: "РћСЃРµРЅРЅРёРµ РЅРѕРІРёРЅРєРё СѓР¶Рµ РІ РІРёС‚СЂРёРЅРµ: СЃРІРµС‡Рё, РїР»РµРґС‹ Рё РјР°Р»РµРЅСЊРєРёРµ РїРѕРґР°СЂРєРё.",
  adminTelegramIds: [],
  updatedAt: now
};

export const fallbackSellerSettings: SellerSettings = {
  id: "main",
  sellerName: "РћР»СЊРіР°",
  avatarUrl: imagePlaceholder("РћР»СЊРіР°", "#ffe3bf"),
  shortBio: "РњР°СЃС‚РµСЂ handmade РёР· РљР°Р·Р°РЅРё.",
  brandStory:
    "РќР°С‡РёРЅР°Р»Р° СЃ РЅРµР±РѕР»СЊС€РёС… РїРѕРґР°СЂРєРѕРІ РґР»СЏ РґСЂСѓР·РµР№, Р° С‚РµРїРµСЂСЊ СЃРѕР·РґР°СЋ СѓСЋС‚РЅС‹Рµ СЃРµСЂРёРё РґР»СЏ РґРѕРјР° Рё РїСЂР°Р·РґРЅРёРєРѕРІ.",
  philosophy:
    "РњРЅРµ РІР°Р¶РЅРѕ, С‡С‚РѕР±С‹ РІРµС‰СЊ Р±С‹Р»Р° РЅРµ РїСЂРѕСЃС‚Рѕ РєСЂР°СЃРёРІРѕР№, Р° РІС‹Р·С‹РІР°Р»Р° С‡СѓРІСЃС‚РІРѕ С‚РµРїР»Р° Рё СЂР°РґРѕСЃС‚Рё РєР°Р¶РґС‹Р№ РґРµРЅСЊ.",
  materialsFocus: "РќР°С‚СѓСЂР°Р»СЊРЅС‹Рµ Рё С‚Р°РєС‚РёР»СЊРЅРѕ РїСЂРёСЏС‚РЅС‹Рµ РјР°С‚РµСЂРёР°Р»С‹: С…Р»РѕРїРѕРє, РІРѕСЃРє, РєРµСЂР°РјРёРєР°, РґРµСЂРµРІРѕ.",
  telegramUsername: "your_seller_username",
  telegramLink: "",
  contactText: "РќР°РїРёС€РёС‚Рµ РІ Telegram, РѕС‚РІРµС‡Р°СЋ РѕР±С‹С‡РЅРѕ РІ С‚РµС‡РµРЅРёРµ С‡Р°СЃР°.",
  aboutSeller: "Р Р°Р±РѕС‚Р°СЋ РІ РґРѕРјР°С€РЅРµРј Р°С‚РµР»СЊРµ Рё РґРµР»Р°СЋ РЅРµР±РѕР»СЊС€РёРµ Р°РІС‚РѕСЂСЃРєРёРµ СЃРµСЂРёРё.",
  city: "РљР°Р·Р°РЅСЊ",
  purchaseMessageTemplate: "Р—РґСЂР°РІСЃС‚РІСѓР№С‚Рµ! РҐРѕС‡Сѓ РїСЂРёРѕР±СЂРµСЃС‚Рё С‚РѕРІР°СЂ: {product}",
  purchaseButtonLabel: "РџСЂРёРѕР±СЂРµСЃС‚Рё",
  updatedAt: now
};

export const fallbackHomepageSections: HomepageSection[] = [
  {
    id: "section_hero",
    type: "hero",
    title: "Р“Р»Р°РІРЅР°СЏ",
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
    title: "РќРѕРІРёРЅРєРё",
    subtitle: "РЎРІРµР¶РёРµ СЂР°Р±РѕС‚С‹ РјР°СЃС‚РµСЂР°",
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
    title: "Р РµРєРѕРјРµРЅРґСѓРµРј",
    subtitle: "РџРѕРґР±РѕСЂРєР° РЅРµРґРµР»Рё",
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
    title: "РЈС‡Р°СЃС‚РІСѓСЋС‚ РІ СЂРѕР·С‹РіСЂС‹С€Рµ",
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
    title: "РџРѕРґР±РѕСЂРєР° РєР°С‚РµРіРѕСЂРёРё",
    subtitle: "РЈСЋС‚ РґР»СЏ РґРѕРјР°",
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
    title: "Рћ РјР°СЃС‚РµСЂРµ",
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
    title: "РџСЂРѕРјРѕ-Р±Р»РѕРє",
    subtitle: "",
    content: "РЎРѕР±РµСЂСѓ РїРѕРґР°СЂРѕС‡РЅС‹Р№ РЅР°Р±РѕСЂ РїРѕРґ РІР°С€ Р±СЋРґР¶РµС‚ Рё РїРѕРІРѕРґ.",
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
    title: "РЎРµР·РѕРЅРЅР°СЏ РїРѕРґР±РѕСЂРєР°",
    subtitle: "РўРµРїР»С‹Рµ Р°РєС†РµРЅС‚С‹ СЃРµР·РѕРЅР°",
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
    title: "Р’РµСЃРµРЅРЅРёР№ СЂРѕР·С‹РіСЂС‹С€",
    description: "Р РѕР·С‹РіСЂС‹С€ СѓСЋС‚РЅС‹С… РїРѕРґР°СЂРєРѕРІ РґР»СЏ РїРѕРґРїРёСЃС‡РёРєРѕРІ.",
    status: "draft",
    drawAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    spinDurationMs: 6000,
    createdAt: now,
    updatedAt: now
  }
];

export const fallbackGiveawayItems: GiveawayItem[] = [
  {
    id: "giveaway_item_1",
    sessionId: "giveaway_session_spring",
    productId: "prod_candle_luna",
    slots: 1,
    isActive: true
  }
];

export const fallbackGiveawayResults: GiveawayResult[] = [];
