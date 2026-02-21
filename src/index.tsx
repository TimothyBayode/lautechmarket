import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";
import { logger } from "./utils/logger";

// --- SMART MIGRATION (Runs once per device) ---
const MIGRATION_VERSION = 'v3.2.0-sw-fix';
const MIGRATION_KEY = 'app_migration_version';

try {
  const currentVersion = localStorage ? localStorage.getItem(MIGRATION_KEY) : null;

  if (currentVersion !== MIGRATION_VERSION && localStorage) {
    // We use console.log here because logger might not be fully initialized or we want raw output
    console.log(`[Migration] Upgrading to ${MIGRATION_VERSION}. Clearing old data...`);

    // 1. Unregister Service Workers (Async, don't await to avoid blocking)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    // 2. Clear Storage (Safe Wipe)
    // This fixes the "Incognito works / Normal fails" issue by removing corrupted keys
    localStorage.clear();
    sessionStorage.clear();

    // 3. Set New Version Lock IMMEDIATELY
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);

    // 4. Do NOT reload. Just let the app initialize with the cleared state.
    // Reloading risks a loop if localStorage fails to persist or is cleared again.
    console.log("[Migration] Cleanup complete. Proceeding with initialization.");
  }
} catch (e) {
  console.error("Migration error:", e);
}

// --- APP RENDERING ---
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);
// Disabling StrictMode temporarily to prevent double-render overhead during crash investigation
root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// --- SERVICE WORKER REGISTRATION (Production ONLY) ---
// SAFE PWA: Re-enabled with Network-First strategy in sw.js
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.log('SW registered (Safe Mode):', registration);
      })
      .catch(err => logger.error('SW registration failed:', err));
  });

  // NO window.location.reload() here to prevent potential redirect loops
  // The app will update on next natural navigation or manual reload
} else if ('serviceWorker' in navigator) {
  // Unregister in dev to avoid conflicts
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      logger.log('SW unregistered (Dev Mode)');
    }
  });
}
