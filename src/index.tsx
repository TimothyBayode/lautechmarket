import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";
import { logger } from "./utils/logger";

// --- EMERGENCY AUTO-FIX & MIGRATION (Runs before React) ---
const APP_VERSION = 'v3.0.3'; // Forced bump for surgical cleanup
const MIGRATION_KEY = 'app_version';

try {
  const currentVersion = localStorage ? localStorage.getItem(MIGRATION_KEY) : null;

  if (currentVersion !== APP_VERSION) {
    logger.log(`[Auto-Fix] Surgical cleanup: Migrating from ${currentVersion} to ${APP_VERSION}`);

    // 1. Unregister all Service Workers (NO RELOAD)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          logger.log('[Auto-Fix] SW Unregistered');
        }
      });
    }

    // 2. Surgical Cleanup (Preserve cart and critical keys)
    if (localStorage) {
      // Keys to remove (Analytics/Throttle keys often cause issues)
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('lautech_market_throttle_') ||
        key.startsWith('last_visit_')
      );

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // If we are doing a major version jump or emergency fix, we might clear more
      // But let's stay surgical for now to avoid UX friction.

      localStorage.setItem(MIGRATION_KEY, APP_VERSION);
    }
  }
} catch (e) {
  logger.error("Early migration error:", e);
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
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.log('SW registered:', registration);
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
