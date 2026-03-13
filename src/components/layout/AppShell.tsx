import { Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { DataStateBoundary } from "../common/DataStateBoundary";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const location = useLocation();
  const { actionError, clearActionError, repositoryKind } = useAppContext();

  const isProfileArea = location.pathname.startsWith("/profile");
  const isSoftActionError = Boolean(actionError?.includes("Mini App"));

  return (
    <div className="app-shell">
      <main className="app-main">
        {repositoryKind === "unavailable" ? (
          <section className="error-banner">
            <strong>Конфигурация окружения не завершена.</strong>
            <span>Приложение не может загрузить данные.</span>
          </section>
        ) : null}

        {repositoryKind === "local" && !isProfileArea ? (
          <section className="mode-banner mode-banner_compact">
            <strong>Локальный режим:</strong>
            <span>данные сохраняются только на этом устройстве.</span>
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
