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
  no_endpoint: "verify endpoint не найден",
  unavailable: "initData недоступен"
};

export function ProfilePage() {
  const {
    adminGuardMessage,
    authVerificationStatus,
    currentProfile,
    isAdmin,
    state,
    switchProfile,
    telegramUserId,
    telegramBridgeInfo,
    repositoryKind,
    isSaving
  } = useAppContext();

  const sellerContactLink = buildSellerContactLink(
    state.sellerSettings,
    "Здравствуйте! Хочу уточнить детали заказа."
  );
  const hasContact = hasSellerContact(state.sellerSettings);

  const favoriteProducts = state.products.filter((product) =>
    state.favorites.some(
      (favorite) => favorite.profileId === currentProfile?.id && favorite.productId === product.id
    )
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
            <p className="hero__eyebrow">{isAdmin ? "Admin hub" : "Профиль пользователя"}</p>
            <h1>{isAdmin ? "Профиль администратора" : currentProfile.displayName}</h1>
            <p>{currentProfile.about || "Профиль пользователя Mini App"}</p>
            <div className="profile-page__meta">
              <span className="badge badge_soft">Роль: {isAdmin ? "admin" : "user"}</span>
              <span className="badge badge_soft">Data source: {repositoryKind}</span>
              <span className="badge badge_soft">
                Auth verify: {authStatusLabel[authVerificationStatus] ?? authVerificationStatus}
              </span>
              {telegramUserId ? <span className="badge badge_soft">Telegram ID: {telegramUserId}</span> : null}
            </div>
            {adminGuardMessage && !isAdmin ? <small>{adminGuardMessage}</small> : null}
          </div>
        </div>
      </section>

      {isAdmin ? (
        <>
          <section className="admin-grid profile-page__admin-grid">
            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Сервисный статус</p>
              <h2 className="section-title">Auth / runtime</h2>
              <div className="stack-sm">
                <small>Repository: {repositoryKind}</small>
                <small>Verify: {authStatusLabel[authVerificationStatus] ?? authVerificationStatus}</small>
                <small>Telegram ID: {telegramUserId ?? "не определён"}</small>
                {adminGuardMessage ? <small>{adminGuardMessage}</small> : null}
              </div>
            </article>

            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Навигация</p>
              <h2 className="section-title">Быстрые действия</h2>
              <div className="toolbar">
                <Link to="/" className="btn btn_secondary btn_compact">
                  Витрина
                </Link>
                <Link to="/catalog" className="btn btn_secondary btn_compact">
                  Каталог
                </Link>
                <Link to="/giveaway" className="btn btn_secondary btn_compact">
                  Розыгрыш
                </Link>
                <Link to="/about" className="btn btn_secondary btn_compact">
                  О мастере
                </Link>
              </div>
            </article>

            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Каталог</p>
              <h2 className="section-title">Товары и карточки</h2>
              <p>Создание карточек и базовые флаги товаров управляются в admin hub ниже и на самих карточках товара.</p>
            </article>

            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Giveaway</p>
              <h2 className="section-title">Розыгрыш</h2>
              <p>Управление лотами, статусом сессии и спином выполняется на отдельной странице розыгрыша.</p>
              <Link to="/giveaway" className="btn btn_secondary btn_compact">
                Открыть управление розыгрышем
              </Link>
            </article>
          </section>

          <section className="card stack profile-page__admin-section">
            <h2 className="section-title">Бренд-настройки</h2>
            <AdminPanel />
          </section>

          <section className="card stack-sm profile-page__panel">
            <p className="hero__eyebrow">Debug / service</p>
            <h2 className="section-title">Telegram bridge</h2>
            <small>
              Telegram bridge: {telegramBridgeInfo.hasBridge ? "найден" : "не найден"} ({telegramBridgeInfo.bridgeSource})
            </small>
            <small>
              initData: {telegramBridgeInfo.hasInitData ? `есть (${telegramBridgeInfo.initDataSource})` : "нет"} · verify request: {" "}
              {telegramBridgeInfo.verifyRequestSent ? "отправлен" : "не отправлен"}
            </small>
          </section>
        </>
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
              <p>Пока нет избранных товаров.</p>
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
              <p className="hero__eyebrow">О мастере</p>
              <h2 className="section-title">Бренд и история</h2>
              <p>{state.sellerSettings.shortBio || state.sellerSettings.aboutSeller}</p>
              <Link to="/about" className="btn btn_secondary btn_compact">
                Открыть страницу мастера
              </Link>
            </article>

            <article className="card stack-sm profile-page__panel">
              <p className="hero__eyebrow">Связь</p>
              <h2 className="section-title">Контакты продавца</h2>
              <p>{state.sellerSettings.contactText}</p>
              {hasContact && sellerContactLink ? (
                <button
                  type="button"
                  className="btn btn_primary btn_compact"
                  onClick={() => openTelegramLink(sellerContactLink)}
                >
                  Написать продавцу
                </button>
              ) : (
                <>
                  <small>Контакты продавца пока не настроены.</small>
                  <Link to="/about" className="btn btn_secondary btn_compact">
                    Где найти контакты
                  </Link>
                </>
              )}
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

      {repositoryKind === "local" && !telegramUserId && import.meta.env.DEV ? (
        <section className="card stack profile-page__dev-panel">
          <h2 className="section-title">DEV-переключение роли</h2>
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
        </section>
      ) : null}
    </div>
  );
}
