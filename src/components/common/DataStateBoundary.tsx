import type { PropsWithChildren } from "react";
import { useAppContext } from "../../context/AppContext";
import { StartupSplash } from "./StartupSplash";

export function DataStateBoundary({ children }: PropsWithChildren) {
  const { bootstrapError, isBootstrapping, reload } = useAppContext();

  if (isBootstrapping) {
    return <StartupSplash />;
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
