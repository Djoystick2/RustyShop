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
    displayName: "Гость ярмарки",
    avatarUrl: imagePlaceholder("Покупатель", "#ffe6c7"),
    role: "user",
    about: "Люблю авторские вещи и ручную работу."
  },
  {
    id: "profile_admin_demo",
    telegramUserId: null,
    displayName: "Мастер Ольга",
    avatarUrl: imagePlaceholder("Мастер", "#ffd9a1"),
    role: "admin",
    about: "Создаю уютные изделия из натуральных материалов."
  }
];

export const fallbackCategories: Category[] = [
  {
    id: "cat_home",
    name: "Уют для дома",
    description: "Свечи, текстиль и декор ручной работы.",
    emoji: "🏠",
    sortOrder: 1,
    isVisible: true
  },
  {
    id: "cat_toys",
    name: "Игрушки",
    description: "Мягкие игрушки и подвесы для детской.",
    emoji: "🧸",
    sortOrder: 2,
    isVisible: true
  },
  {
    id: "cat_jewelry",
    name: "Украшения",
    description: "Авторские серьги и кулоны.",
    emoji: "💍",
    sortOrder: 3,
    isVisible: true
  }
];

export const fallbackProducts: Product[] = [
  {
    id: "prod_candle_luna",
    categoryId: "cat_home",
    title: "Свеча «Луна и Ваниль»",
    description: "Соевый воск в керамической баночке, мягкий аромат и долгое горение.",
    priceText: "1 250 ₽",
    status: "new",
    materials: ["соевый воск", "керамика", "эфирные масла"],
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: true,
    isFeatured: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod_plaid_cloud",
    categoryId: "cat_home",
    title: "Плед «Облако»",
    description: "Мягкий вязаный плед для уютных вечеров.",
    priceText: "4 900 ₽",
    status: "popular",
    materials: ["меринос", "хлопок"],
    isVisible: true,
    isAvailable: true,
    isGiveawayEligible: false,
    isFeatured: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod_bunny",
    categoryId: "cat_toys",
    title: "Зайка «Пломбир»",
    description: "Вязаная мягкая игрушка с гипоаллергенным наполнителем.",
    priceText: "2 300 ₽",
    status: "popular",
    materials: ["плюшевая пряжа", "наполнитель"],
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
    title: "Серьги «Янтарный свет»",
    description: "Легкие серьги с ручной росписью.",
    priceText: "1 800 ₽",
    status: "new",
    materials: ["полимерная глина", "фурнитура из стали"],
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
    url: imagePlaceholder("Свеча", "#ffd8b8"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_plaid_1",
    productId: "prod_plaid_cloud",
    url: imagePlaceholder("Плед", "#ffe1bf"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_bunny_1",
    productId: "prod_bunny",
    url: imagePlaceholder("Зайка", "#ffd2ad"),
    isPrimary: true,
    position: 1
  },
  {
    id: "img_amber_1",
    productId: "prod_amber_earrings",
    url: imagePlaceholder("Серьги", "#ffd5aa"),
    isPrimary: true,
    position: 1
  }
];

export const fallbackFavorites: Favorite[] = [];

export const fallbackStoreSettings: StoreSettings = {
  id: "main",
  storeName: "Ярмарка мастера",
  brandSlogan: "Теплые вещи с душой и характером",
  heroBadge: "Ручная работа",
  mascotEmoji: "🦊",
  storeDescription: "Персональный магазин уютных вещей ручной работы.",
  welcomeText: "Добро пожаловать! Здесь каждая вещь сделана с заботой.",
  infoBlock: "Отправка по России и возможность индивидуального заказа.",
  promoTitle: "Сезонная подборка",
  promoText: "Осенние новинки уже в витрине: свечи, пледы и маленькие подарки.",
  adminTelegramIds: [],
  updatedAt: now
};

export const fallbackSellerSettings: SellerSettings = {
  id: "main",
  sellerName: "Ольга",
  avatarUrl: imagePlaceholder("Ольга", "#ffe3bf"),
  shortBio: "Мастер handmade из Казани.",
  brandStory:
    "Начинала с небольших подарков для друзей, а теперь создаю уютные серии для дома и праздников.",
  philosophy:
    "Мне важно, чтобы вещь была не просто красивой, а вызывала чувство тепла и радости каждый день.",
  materialsFocus: "Натуральные и тактильно приятные материалы: хлопок, воск, керамика, дерево.",
  telegramUsername: "your_seller_username",
  telegramLink: "",
  contactText: "Напишите в Telegram, отвечаю обычно в течение часа.",
  aboutSeller: "Работаю в домашнем ателье и делаю небольшие авторские серии.",
  city: "Казань",
  purchaseMessageTemplate: "Здравствуйте! Хочу приобрести товар: {product}",
  purchaseButtonLabel: "Приобрести",
  updatedAt: now
};

export const fallbackHomepageSections: HomepageSection[] = [
  {
    id: "section_hero",
    type: "hero",
    title: "Главная",
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
    title: "Новинки",
    subtitle: "Свежие работы мастера",
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
    title: "Рекомендуем",
    subtitle: "Подборка недели",
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
    title: "Участвуют в розыгрыше",
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
    title: "Подборка категории",
    subtitle: "Уют для дома",
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
    title: "О мастере",
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
    title: "Промо-блок",
    subtitle: "",
    content: "Соберу подарочный набор под ваш бюджет и повод.",
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
    title: "Сезонная подборка",
    subtitle: "Теплые акценты сезона",
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
    title: "Весенний розыгрыш",
    description: "Розыгрыш уютных подарков для подписчиков.",
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
