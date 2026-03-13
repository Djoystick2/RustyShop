import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminPanel } from "../components/admin/AdminPanel";
import { ProductMiniCard } from "../components/products/ProductMiniCard";
import { useAppContext } from "../context/AppContext";
import { buildSellerContactLink, hasSellerContact } from "../lib/acquire-link";
import { getPrimaryProductImage } from "../lib/product-utils";
import { openTelegramLink } from "../lib/telegram";

const authStatusLabel: Record<string, string> = {
  idle: "не запускалась",
  verifying: "проверяем",
  verified: "подтверждена",
  failed: "ошибка проверки",
  no_endpoint: "нет verify endpoint",
  unavailable: "initData недоступен"
};

const themeModeLabel: Record<ThemeMode, string> = {
  system: "Как в устройстве",
  light: "Светлая",
  dark: "Тёмная"
};

type ThemeMode = "system" | "light" | "dark";

const PROFILE_THEME_STORAGE_KEY = "rustyshop-theme-mode";

export function ProfilePage() {
  const {
    adminGuardMessage,
    authVerificationStatus,
    currentProfile,
    isAdmin,
    reload,
    state,
    switchProfile,
    telegramUserId,
    telegramBridgeInfo,
    repositoryKind,
    isSaving
  } = useAppContext();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const stored = window.localStorage.getItem(PROFILE_THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PROFILE_THEME_STORAGE_KEY, themeMode);

    if (themeMode === "system") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }

    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  const sellerContactLink = buildSellerContactLink(
    state.sellerSettings,
    "Здравствуйте! Хочу уточнить детали заказа."
  );
  const hasContact = hasSellerContact(state.sellerSettings);
  const expectsAdminHub = currentProfile?.role === "admin";

  const favoriteProducts = useMemo(
    () =>
      state.products.filter((product) =>
        state.favorites.some(
          (favorite) => favorite.profileId === currentProfile?.id && favorite.productId === product.id
        )
      ),
    [currentProfile?.id, state.favorites, state.products]
  );

  const activeGiveaway = useMemo(
    () => state.giveawaySessions.find((session) => session.status === "active") ?? null,
    [state.giveawaySessions]
  );

  if (!currentProfile) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h1>Профиль недоступен</h1>
          <p>Не удалось определить активный профиль.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page stack-lg profile-page">
      <section className="card stack profile-page__hero">
        <div className="profile-row">
          {currentProfile.avatarUrl ? (
            <img className="avatar profile-page__avatar" src={currentProfile.avatarUrl} alt={currentProfile.displayName} />
          ) : (
            <div className="avatar avatar_placeholder profile-page__avatar" />
          )}
          <div className="stack-sm profile-page__hero-copy">
            <p className="hero__eyebrow">{isAdmin ? "Центр управления RustyShop" : "Личный кабинет"}</p>
            <h1>{isAdmin ? "Профиль администратора" : currentProfile.displayName}</h1>
            <p>
              {isAdmin
                ? "Компактный admin hub: тексты, товары, розыгрыш и живой storefront-сценарий без лишних переходов."
                : currentProfile.about || "Здесь собраны избранное, связи с мастером и быстрые переходы по магазину."}
            </p>
            <div className="profile-page__meta">
              {isAdmin ? <span className="badge badge_soft">{state.products.length} товаров</span> : null}
              <span className="badge badge_soft">{state.categories.length} категорий</span>
              <span className="badge badge_soft">
                {isAdmin ? `Активный розыгрыш: ${activeGiveaway ? "есть" : "нет"}` : `Избранное: ${favoriteProducts.length}`}
              </span>
              {isAdmin ? (
                <span className="badge badge_soft">
                  Скрыто: {state.products.filter((product) => !product.isVisible).length}
                </span>
              ) : null}
              <span className="badge badge_soft">Тема: {themeModeLabel[themeMode]}</span>
            </div>
          </div>
        </div>

        {expectsAdminHub && !isAdmin ? (
          <div className="profile-page__notice">
            <div className="stack-sm">
              <strong>Админ-панель пока недоступна</strong>
              <span>{adminGuardMessage || "Подтвердите Telegram-сессию, чтобы открыть управление."}</span>
            </div>
            <button type="button" className="btn btn_secondary btn_compact" onClick={() => void reload()}>
              Обновить статус
            </button>
          </div>
        ) : null}

        <div className="profile-page__hero-actions">
          <div className="toolbar">
            <Link to="/" className="btn btn_secondary btn_compact">
              Главная
            </Link>
            <Link to="/catalog" className="btn btn_secondary btn_compact">
              Каталог
            </Link>
            <Link to="/about" className="btn btn_secondary btn_compact">
              О мастере
            </Link>
            {isAdmin ? (
              <Link to="/giveaway" className="btn btn_primary btn_compact">
                Розыгрыш
              </Link>
            ) : hasContact && sellerContactLink ? (
              <button
                type="button"
                className="btn btn_primary btn_compact"
                onClick={() => openTelegramLink(sellerContactLink)}
              >
                Написать продавцу
              </button>
            ) : null}
          </div>

          <div className="profile-theme-card">
            <div className="stack-sm">
              <p className="hero__eyebrow">Режим интерфейса</p>
              <strong>Тема</strong>
            </div>
            <div className="segmented-control" role="group" aria-label="Тема интерфейса">
              {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`segmented-control__item${themeMode === mode ? " segmented-control__item_active" : ""}`}
                  onClick={() => setThemeMode(mode)}
                  aria-pressed={themeMode === mode}
                >
                  {mode === "system" ? "Auto" : mode === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isAdmin ? (
        <AdminPanel />
      ) : (
        <>
          <section className="card stack profile-page__section">
            <div className="row-between row-wrap">
              <div className="stack-sm">
                <p className="hero__eyebrow">Личный раздел</p>
                <h2 className="section-title">Избранное</h2>
              </div>
              <span className="badge badge_soft">{favoriteProducts.length} товаров</span>
            </div>
            {isSaving("favorite") ? <small>Синхронизируем избранное...</small> : null}
            {favoriteProducts.length === 0 ? (
              <p>Пока нет избранных товаров. Сохраняйте понравившиеся работы и возвращайтесь к ним здесь.</p>
            ) : (
              <div className="shelf-row">
                {favoriteProducts.map((product) => (
                  <ProductMiniCard
                    key={product.id}
                    product={product}
                    sellerSettings={state.sellerSettings}
                    imageUrl={getPrimaryProductImage(product.id, state.productImages)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="admin-grid profile-page__user-grid">
            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Покупка и заказы</p>
              <h2 className="section-title">Как оформить заказ</h2>
              <p>Перейдите в каталог, выберите изделие и используйте кнопку покупки или свяжитесь с мастером напрямую.</p>
              <div className="toolbar">
                <Link to="/catalog" className="btn btn_secondary btn_compact">
                  Перейти в каталог
                </Link>
                {hasContact && sellerContactLink ? (
                  <button
                    type="button"
                    className="btn btn_primary btn_compact"
                    onClick={() => openTelegramLink(sellerContactLink)}
                  >
                    Написать продавцу
                  </button>
                ) : null}
              </div>
            </article>

            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">О мастере</p>
              <h2 className="section-title">История и контакты</h2>
              <p>{state.sellerSettings.shortBio || state.sellerSettings.aboutSeller}</p>
              <div className="toolbar">
                <Link to="/about" className="btn btn_secondary btn_compact">
                  Открыть страницу мастера
                </Link>
                {!hasContact ? (
                  <Link to="/about" className="btn btn_ghost btn_compact">
                    Где найти контакты
                  </Link>
                ) : null}
              </div>
            </article>
          </section>

          <section className="card stack-sm profile-page__panel">
            <p className="hero__eyebrow">О магазине</p>
            <h2 className="section-title">Описание и детали</h2>
            <p>{state.storeSettings.storeDescription}</p>
            <p>{state.storeSettings.infoBlock}</p>
            <small>Город мастера: {state.sellerSettings.city}</small>
          </section>
        </>
      )}

      <details className="card disclosure profile-page__diagnostics">
        <summary className="disclosure__summary">
          <span>Диагностика</span>
          <span className="badge badge_soft">Скрытый блок</span>
        </summary>
        <div className="disclosure__body stack-sm">
          <small>Repository: {repositoryKind}</small>
          <small>Auth verify: {authStatusLabel[authVerificationStatus] ?? authVerificationStatus}</small>
          <small>Telegram ID: {telegramUserId ?? "не определён"}</small>
          <small>
            Telegram bridge: {telegramBridgeInfo.hasBridge ? "найден" : "не найден"} · initData: {" "}
            {telegramBridgeInfo.hasInitData ? "есть" : "нет"}
          </small>
          {adminGuardMessage ? <small>{adminGuardMessage}</small> : null}
        </div>
      </details>

      {repositoryKind === "local" && !telegramUserId && import.meta.env.DEV ? (
        <details className="card disclosure profile-page__diagnostics">
          <summary className="disclosure__summary">
            <span>Developer tools</span>
            <span className="badge badge_soft">DEV</span>
          </summary>
          <div className="disclosure__body stack">
            <p>Доступно только в fallback-режиме локальной разработки.</p>
            <div className="toolbar">
              {state.profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="btn btn_secondary btn_compact"
                  onClick={() => switchProfile(profile.id)}
                >
                  Войти как {profile.role}
                </button>
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
