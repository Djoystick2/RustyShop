import React from "react";
import ReactDOM from "react-dom/client";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { AppProvider } from "./context/AppContext";
import { App } from "./App";
import { applyThemeMode, readStoredThemeMode } from "./lib/theme";
import "./styles.css";

applyThemeMode(readStoredThemeMode());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
