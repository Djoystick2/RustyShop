import { Link } from "react-router-dom";
import { AdminPanel } from "../components/admin/AdminPanel";
import { useAppContext } from "../context/AppContext";
import { buildSellerContactLink } from "../lib/acquire-link";
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
    <div className="page stack-lg">
      <section className="card stack">
        <h1>{isAdmin ? "Профиль администратора" : "Профиль"}</h1>
        <div className="profile-row">
          {currentProfile.avatarUrl ? (
            <img className="avatar" src={currentProfile.avatarUrl} alt={currentProfile.displayName} />
          ) : (
            <div className="avatar avatar_placeholder" />
          )}
          <div className="stack-sm">
            <h2>{currentProfile.displayName}</h2>
            <p>{currentProfile.about || "Профиль пользователя Mini App"}</p>
            <small>
              Роль: {isAdmin ? "admin" : "user"} · Data source: {repositoryKind}
              {telegramUserId ? ` · Telegram ID: ${telegramUserId}` : ""}
            </small>
            <small>Auth verify: {authStatusLabel[authVerificationStatus] ?? authVerificationStatus}</small>
            {adminGuardMessage && !isAdmin ? <small>{adminGuardMessage}</small> : null}
          </div>
        </div>
      </section>

      {isAdmin ? (
        <>
          <section className="card stack">
            <h2 className="section-title">Навигация администратора</h2>
            <div className="toolbar">
              <Link to="/" className="btn btn_secondary">
                Витрина
              </Link>
              <Link to="/catalog" className="btn btn_secondary">
                Каталог
              </Link>
              <Link to="/giveaway" className="btn btn_secondary">
                Розыгрыш
              </Link>
              <Link to="/about" className="btn btn_secondary">
                О мастере
              </Link>
            </div>
            <small>Управление лотами и сессиями перенесено на вкладку «Розыгрыш».</small>
          </section>

          <AdminPanel />

          <section className="card stack-sm">
            <h3>Служебный статус</h3>
            <small>
              Telegram bridge: {telegramBridgeInfo.hasBridge ? "найден" : "не найден"} (
              {telegramBridgeInfo.bridgeSource})
            </small>
            <small>
              initData: {telegramBridgeInfo.hasInitData ? `есть (${telegramBridgeInfo.initDataSource})` : "нет"} ·
              verify request: {telegramBridgeInfo.verifyRequestSent ? "отправлен" : "не отправлен"}
            </small>
          </section>
        </>
      ) : (
        <>
          <section className="card stack">
            <h2 className="section-title">Избранное</h2>
            {isSaving("favorite") ? <small>Синхронизируем избранное...</small> : null}
            {favoriteProducts.length === 0 ? (
              <p>Пока нет избранных товаров.</p>
            ) : (
              favoriteProducts.map((product) => (
                <Link key={product.id} className="text-link" to={`/product/${product.id}`}>
                  {product.title}
                </Link>
              ))
            )}
          </section>

          <section className="card stack">
            <h2 className="section-title">О мастере</h2>
            <p>{state.sellerSettings.shortBio || state.sellerSettings.aboutSeller}</p>
            <div className="toolbar">
              <Link to="/about" className="btn btn_secondary">
                Открыть страницу мастера
              </Link>
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">Связь с продавцом</h2>
            <p>{state.sellerSettings.contactText}</p>
            <button
              type="button"
              className="btn btn_primary"
              onClick={() =>
                openTelegramLink(
                  buildSellerContactLink(state.sellerSettings, "Здравствуйте! Хочу уточнить детали заказа.")
                )
              }
            >
              Написать продавцу
            </button>
          </section>

          <section className="card stack">
            <h2 className="section-title">О магазине</h2>
            <p>{state.storeSettings.storeDescription}</p>
            <p>{state.storeSettings.infoBlock}</p>
            <small>Город мастера: {state.sellerSettings.city}</small>
          </section>
        </>
      )}

      {repositoryKind === "local" && !telegramUserId && import.meta.env.DEV ? (
        <section className="card stack">
          <h2 className="section-title">DEV-переключение роли</h2>
          <p>Доступно только в fallback-режиме локальной разработки.</p>
          <div className="toolbar">
            {state.profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className="btn btn_secondary"
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
