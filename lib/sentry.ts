import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    // Scrub PII aggressively — we identify by auth UUID only, no email/name/body.
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

export { Sentry };
