import React, { type PropsWithChildren } from "react";

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка приложения.";
    return {
      hasError: true,
      message
    };
  }

  componentDidCatch(error: unknown) {
    console.error("App render crash:", error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="page">
        <section className="card empty-state">
          <h3>Не удалось отрисовать экран</h3>
          <p>Приложение перешло в безопасный режим после ошибки рендера.</p>
          <p>{this.state.message}</p>
          <button type="button" className="btn btn_primary" onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </section>
      </div>
    );
  }
}
