import React from "react";
import ReactDOM from "react-dom/client";

// Resolve Supabase config at runtime BEFORE any module reads it.
async function bootstrap() {
  try {
    const res = await fetch("/api/analyze", { headers: { accept: "application/json" } });
    if (res.ok) {
      const d = await res.json();
      if (d && d.url && d.key) {
        window.__UNIFIES_CONFIG__ = { url: d.url, key: d.key };
      }
    }
  } catch {
    /* guest mode fallback */
  }
}

bootstrap().finally(() => {
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
