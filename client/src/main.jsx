import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DialogProvider } from "./components/ui/DialogProvider.jsx";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true, staleTime: 5000 } },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#0b1020",
                color: "#e8ebf5",
                borderRadius: "14px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 600,
                boxShadow: "0 12px 30px rgba(11,16,32,0.25)",
              },
              success: { iconTheme: { primary: "#e7c06b", secondary: "#0b1020" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#0b1020" } },
            }}
          />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);