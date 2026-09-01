import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";

import "./index.css";

import App from "./App";
import { AuthProvider } from "@/hooks/AuthProvider";
import { ThemeProvider } from "@/components/provider/theme";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StrictMode>
            <AuthProvider>
                <App />
                <Toaster />
            </AuthProvider>
        </StrictMode>
    </ThemeProvider>,
);
