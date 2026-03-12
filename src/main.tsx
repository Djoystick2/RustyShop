import React from "react";
import ReactDOM from "react-dom/client";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { AppProvider } from "./context/AppContext";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
