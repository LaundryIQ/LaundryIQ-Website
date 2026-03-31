import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import "@laundryiq/ui/src/tokens.css";
import App from "./App";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL. Copy apps/portal/.env.example to .env.local and fill it in.");
}

if (!clerkKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Copy apps/portal/.env.example to .env.local and fill it in.",
  );
}

const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/signin"
      signUpUrl="/signin"
      signInFallbackRedirectUrl="/p"
      signUpFallbackRedirectUrl="/p"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);
