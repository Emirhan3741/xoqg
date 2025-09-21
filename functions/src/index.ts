import { getApps, initializeApp } from "firebase-admin/app";
import { onCall } from "firebase-functions/v2/https";

// ✅ Admin'i tek yerde başlat (idempotent)
if (getApps().length === 0) {
  initializeApp();
}

// Export all functions from matchmaking
export * from "./matchmaking";

// Simple ping function for testing
export const ping = onCall({ region: "us-central1" }, (req) => {
  return { ok: true, uid: req.auth?.uid ?? null, now: Date.now() };
});



