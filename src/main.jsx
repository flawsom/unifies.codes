import React from "react";
import ReactDOM from "react-dom/client";
import { initRuntimeConfig } from "./lib/runtimeConfig";

// Resolve Supabase config at runtime BEFORE any module reads it. This applies
// build-time env, the /api/analyze endpoint, and a committed public fallback —
// so sign-in works even when host env vars are missing.
initRuntimeConfig().finally(() => {
  Promise.all([
    import("./App.jsx"),
    import("./context/AuthContext.jsx"),
    import("./components/Toast.jsx"),
  ]).then(([AppMod, AuthMod, ToastMod]) => {
    const App = AppMod.default;
    const AuthProvider = AuthMod.AuthProvider;
    const ToastProvider = ToastMod.ToastProvider;
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </React.StrictMode>
    );
  });
});
