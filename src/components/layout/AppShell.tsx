import { Outlet, useLocation } from "react-router-dom";
import { getStorageBucketName, hasTelegramVerifyEndpoint, isDefaultStorageBucket } from "../../config/runtime";
import { useAppContext } from "../../context/AppContext";
import { DataStateBoundary } from "../common/DataStateBoundary";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const location = useLocation();
  const {
    actionError,
    authVerificationMessage,
    authVerificationStatus,
    clearActionError,
    repositoryKind
  } = useAppContext();

  const hasVerifyEndpoint = hasTelegramVerifyEndpoint();
  const isCustomBucket = !isDefaultStorageBucket();
  const isProfileArea = location.pathname.startsWith("/profile");
  const isSoftActionError = Boolean(actionError?.toLowerCase().includes("избран"));

  return (
    <div className="app-shell">
      <main className="app-main">
        {repositoryKind === "unavailable" ? (
          <section className="error-banner">
            <strong>Конфигурация окружения не завершена.</strong>
            <span>Приложение не может загрузить данные.</span>
          </section>
        ) : null}

        {repositoryKind === "local" ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Локальный режим:</strong>
            <span>данные сохраняются только на этом устройстве.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isProfileArea && !hasVerifyEndpoint ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Admin-панель:</strong>
            <span>для runtime-доступа нужен `VITE_TELEGRAM_AUTH_VERIFY_URL`.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isProfileArea && authVerificationStatus === "verifying" ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Проверка Telegram:</strong>
            <span>идет верификация initData.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isProfileArea && authVerificationStatus === "unavailable" ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Проверка Telegram:</strong>
            <span>{authVerificationMessage || "initData недоступен в текущем окружении."}</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isProfileArea && authVerificationStatus === "failed" ? (
          <section className="error-banner">
            <span>{authVerificationMessage || "Проверка Telegram auth завершилась ошибкой."}</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isProfileArea && isCustomBucket ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Storage:</strong>
            <span>используется bucket `{getStorageBucketName()}`. Проверьте storage policies.</span>
          </section>
        ) : null}

        {actionError ? (
          <section className={isSoftActionError ? "notice-banner" : "error-banner"}>
            <span>{actionError}</span>
            <button type="button" className="btn btn_ghost" onClick={clearActionError}>
              Закрыть
            </button>
          </section>
        ) : null}

        <DataStateBoundary>
          <Outlet />
        </DataStateBoundary>
      </main>
      <BottomNav />
    </div>
  );
}

