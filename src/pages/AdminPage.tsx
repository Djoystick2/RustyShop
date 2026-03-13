import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminPanel } from "../components/admin/AdminPanel";
import { useAppContext } from "../context/AppContext";

const authStatusLabel: Record<string, string> = {
  idle: "не запускалась",
  verifying: "проверяем",
  verified: "подтверждена",
  failed: "ошибка проверки",
  no_endpoint: "нет verify endpoint",
  unavailable: "initData недоступен"
};

type AdminTab = "work" | "products";

export function AdminPage() {
  const {
    adminGuardMessage,
    authVerificationStatus,
    isAdmin,
    reload,
    repositoryKind,
    telegramBridgeInfo,
    telegramUserId
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<AdminTab>("work");

  if (!isAdmin) {
    return (
      <div className="page stack-lg">
        <section className="card empty-state">
          <h1>Панель администратора недоступна</h1>
          <p>{adminGuardMessage || "Для входа в админ-раздел нужен подтверждённый доступ."}</p>
          <div className="toolbar">
            <Link to="/profile" className="btn btn_secondary btn_compact">
              Вернуться в профиль
            </Link>
            <button type="button" className="btn btn_primary btn_compact" onClick={() => void reload()}>
              Обновить статус
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page stack-lg admin-page">
      <section className="card stack admin-page__hero">
        <div className="row-between row-wrap">
          <div className="stack-sm">
            <p className="hero__eyebrow">Административный раздел</p>
            <h1>Панель администратора</h1>
            <p>Отдельный рабочий экран для storefront-настроек, товаров и giveaway-операций.</p>
          </div>
          <div className="toolbar">
            <Link to="/profile" className="btn btn_secondary btn_compact">
              Профиль
            </Link>
            <Link to="/" className="btn btn_ghost btn_compact">
              Storefront
            </Link>
          </div>
        </div>

        <div className="admin-page__tabs" role="tablist" aria-label="Разделы админ-панели">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "work"}
            className={`admin-page__tab${activeTab === "work" ? " admin-page__tab_active" : ""}`}
            onClick={() => setActiveTab("work")}
          >
            Работа
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            className={`admin-page__tab${activeTab === "products" ? " admin-page__tab_active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Товары
          </button>
        </div>
      </section>

      <AdminPanel activeTab={activeTab} onSelectTab={setActiveTab} />

      <details className="card disclosure admin-page__diagnostics">
        <summary className="disclosure__summary">
          <span>Сервис и диагностика</span>
          <span className="badge badge_soft">Скрытый блок</span>
        </summary>
        <div className="disclosure__body stack-sm">
          <small>Repository: {repositoryKind}</small>
          <small>Auth verify: {authStatusLabel[authVerificationStatus] ?? authVerificationStatus}</small>
          <small>Telegram ID: {telegramUserId ?? "не определён"}</small>
          <small>
            Telegram bridge: {telegramBridgeInfo.hasBridge ? "найден" : "не найден"} · initData:{" "}
            {telegramBridgeInfo.hasInitData ? "есть" : "нет"}
          </small>
          {adminGuardMessage ? <small>{adminGuardMessage}</small> : null}
        </div>
      </details>
    </div>
  );
}
