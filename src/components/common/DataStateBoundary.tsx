import type { PropsWithChildren } from "react";
import { useAppContext } from "../../context/AppContext";

export function DataStateBoundary({ children }: PropsWithChildren) {
  const { bootstrapError, isBootstrapping, reload } = useAppContext();

  if (isBootstrapping) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h3>Загружаем данные...</h3>
          <p>Подключаем витрину магазина.</p>
        </section>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="page">
        <section className="card empty-state">
          <h3>Не удалось загрузить данные</h3>
          <p>{bootstrapError}</p>
          <button type="button" className="btn btn_primary" onClick={() => void reload()}>
            Повторить
          </button>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
