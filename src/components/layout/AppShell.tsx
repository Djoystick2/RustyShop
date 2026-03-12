import { Outlet } from "react-router-dom";
import { hasTelegramVerifyEndpoint, isDefaultStorageBucket, getStorageBucketName } from "../../config/runtime";
import { useAppContext } from "../../context/AppContext";
import { DataStateBoundary } from "../common/DataStateBoundary";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const {
    actionError,
    authVerificationMessage,
    authVerificationStatus,
    clearActionError,
    repositoryKind
  } = useAppContext();

  const hasVerifyEndpoint = hasTelegramVerifyEndpoint();
  const isCustomBucket = !isDefaultStorageBucket();

  return (
    <div className="app-shell">
      <main className="app-main">
        {repositoryKind === "unavailable" ? (
          <section className="error-banner">
            <strong>Runtime конфигурация не завершена.</strong>
            <span>Приложение не может загрузить data layer.</span>
          </section>
        ) : null}

        {repositoryKind === "local" ? (
          <section className="mode-banner">
            <strong>Режим fallback:</strong>
            <span>данные сохраняются локально до подключения Supabase env.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && !hasVerifyEndpoint ? (
          <section className="mode-banner">
            <strong>Auth verify:</strong>
            <span>не задан `VITE_TELEGRAM_AUTH_VERIFY_URL`, admin-действия в Supabase mode заблокированы.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && authVerificationStatus === "unavailable" ? (
          <section className="mode-banner">
            <strong>Telegram initData:</strong>
            <span>{authVerificationMessage || "initData недоступен в текущем окружении."}</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && authVerificationStatus === "verifying" ? (
          <section className="mode-banner">
            <strong>Auth verify:</strong>
            <span>выполняем серверную проверку Telegram initData.</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && authVerificationStatus === "failed" ? (
          <section className="error-banner">
            <span>{authVerificationMessage || "Telegram auth verification failed."}</span>
          </section>
        ) : null}

        {repositoryKind === "supabase" && isCustomBucket ? (
          <section className="mode-banner">
            <strong>Storage bucket:</strong>
            <span>
              используется `{getStorageBucketName()}`. Проверьте, что bucket и storage policies созданы в Supabase.
            </span>
          </section>
        ) : null}

        {actionError ? (
          <section className="error-banner">
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

