import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// =============================================================================
// SENTRY ERROR MONITORING
// =============================================================================
// Sentry captures JavaScript errors automatically and reports them to a dashboard.
// This lets us know when users hit bugs - even if they don't report them.
//
// Initialize BEFORE rendering the app so Sentry catches errors from the very start.
// =============================================================================
Sentry.init({
  // DSN (Data Source Name) - identifies YOUR Sentry project
  // Like a mailing address for your errors
  dsn: import.meta.env.VITE_SENTRY_DSN,

  // Integrations add extra functionality:
  // - browserTracingIntegration: tracks page load performance and navigation
  // - replayIntegration: records user sessions so you can replay what they did before the error
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // tracesSampleRate: What percentage of transactions to capture for performance monitoring
  // 1.0 = 100% (capture everything) - good for development/small apps
  // In high-traffic production, you'd lower this to 0.1 (10%) to reduce costs
  tracesSampleRate: 1.0,

  // replaysSessionSampleRate: What percentage of normal sessions to record
  // 0.1 = 10% - records 1 in 10 sessions even when no error occurs
  // Useful for understanding user behavior, but not critical
  replaysSessionSampleRate: 0.1,

  // replaysOnErrorSampleRate: What percentage of sessions WITH errors to record
  // 1.0 = 100% - ALWAYS record if an error happens
  // This is the most valuable - you can replay exactly what the user did before the crash
  replaysOnErrorSampleRate: 1.0,

  // environment: helps you filter errors by dev/staging/production
  // import.meta.env.MODE is set by Vite based on how you run the app
  // "development" when running npm run dev, "production" when deployed
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(<App />);
