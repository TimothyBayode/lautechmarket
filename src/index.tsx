import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { HelmetProvider } from "react-helmet-async";
import { logger } from "./utils/logger";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
// Register Service Worker for PWA (Production ONLY)
const APP_VERSION = 'v3.0.1'; // Bump this to force client-side cleanup
const MIGRATION_KEY = 'app_version';

// Auto-Fix Mechanism: Run before React hydration to prevent crash loops
try {
  const currentVersion = localStorage.getItem(MIGRATION_KEY);

  if (currentVersion !== APP_VERSION) {
    logger.log(`[Auto-Fix] Migrating from ${currentVersion} to ${APP_VERSION}`);

    // 1. Unregister all Service Workers immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    // 2. Clear potential crash-causing data (e.g., corrupt analytics/cart)
    // We preserve 'shopping_cart' if possible, but for safety in this crash scenario, 
    // we might want to be aggressive. Let's precise-delete known unsafe keys first.
    // Actually, clearing everything except maybe 'shopping_cart' is safer.

    // For this specific "browser closing" crash, it's safer to nuke everything to be 100% sure.
    // But let's try to save the cart.
    const savedCart = localStorage.getItem('shopping_cart');
    localStorage.clear();
    if (savedCart) {
      localStorage.setItem('shopping_cart', savedCart);
    }

    // 3. Mark as migrated
    localStorage.setItem(MIGRATION_KEY, APP_VERSION);

    // 4. Force a reload to ensure we start with a clean slate (no stale SW controlling page)
    // Only reload if we actually cleared something to avoid loops, 
    // but the version check prevents infinite loops.
    // window.location.reload(); // Optional: react-router might handle it, but reload is safer for SW updates.
  }
} catch (e) {
  logger.error("Migration error", e);
  localStorage.clear(); // Nuclear option fallback
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.log('SW registered: ', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New worker is ready, it will skip waiting and claim clients
                // The 'controllerchange' event will then fire
              }
            });
          }
        });
      })
      .catch(registrationError => {
        logger.log('SW registration failed: ', registrationError);
      });
  });

  // Reload the page when a new service worker takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
} else if ('serviceWorker' in navigator) {
  // In development, unregister any existing service workers to avoid "Zombie" workers
  // causing crash loops or caching issues.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      logger.log('SW unregistered in dev mode');
    }
  });
}
