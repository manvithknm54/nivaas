import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast, { Toaster, useToasterStore } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DialogProvider } from "./components/ui/DialogProvider.jsx";
import ErrorBoundary from "./pages/owner/ErrorBoundary.jsx";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true, staleTime: 5000 } },
});

// Keeps one copy of any repeated message and at most 3 toasts on screen.
function ToastLimiter() {
  const { toasts } = useToasterStore();
  useEffect(() => {
    const seen = new Set();
    toasts.filter((t) => t.visible).forEach((t, i) => {
      const text = typeof t.message === "string" ? t.message : null;
      const duplicate = text !== null && seen.has(text);
      if (text !== null) seen.add(text);
      if (duplicate || i >= 3) toast.dismiss(t.id);
    });
  }, [toasts]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <ToastLimiter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { background: "#0b1020", color: "#e8ebf5", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", fontWeight: 600, boxShadow: "0 12px 30px rgba(11,16,32,0.25)" },
              success: { iconTheme: { primary: "#e7c06b", secondary: "#0b1020" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#0b1020" } },
            }}
          />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);