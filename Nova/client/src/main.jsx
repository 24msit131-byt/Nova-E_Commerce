import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import App from "./App.jsx";
import "./index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { googleClientId, googleAuthDisableReason, isGoogleAuthEnabled } from "./utils/googleAuthConfig.js";

// Debugging Google Auth
console.log("[GOOGLE-AUTH-DEBUG] Origin:", window.location.origin);
console.log("[GOOGLE-AUTH-DEBUG] Client ID:", googleClientId);
console.log("[GOOGLE-AUTH-DEBUG] Enabled:", isGoogleAuthEnabled);
console.log("[GOOGLE-AUTH-DEBUG] Reason:", googleAuthDisableReason);

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element with id 'root' was not found.");
}

if (googleAuthDisableReason === "missing-client-id") {
  console.warn("Google OAuth is disabled: VITE_GOOGLE_CLIENT_ID is missing.");
}

if (googleAuthDisableReason === "origin-not-allowed") {
  console.warn(
    "Google OAuth is disabled for this origin. Add the current origin to VITE_GOOGLE_ALLOWED_ORIGINS and Google Cloud Console Authorized JavaScript origins."
  );
}

const appTree = (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

const root = createRoot(container);

const renderedTree = isGoogleAuthEnabled ? (
  <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
) : (
  appTree
);

root.render(
  import.meta.env.DEV ? renderedTree : <React.StrictMode>{renderedTree}</React.StrictMode>
);
