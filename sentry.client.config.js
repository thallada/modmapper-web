// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import LogRocket from 'logrocket';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
const LOGROCKET_APP_ID = process.env.LOGROCKET_APP_ID || process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

Sentry.init({
  dsn: SENTRY_DSN || 'https://dda36383332143d3a84c25a4f6aa6470@o1382253.ingest.sentry.io/6697231',
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  environment: SENTRY_ENVIRONMENT || 'production',
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  beforeSend(event) {
    const logRocketSession = LogRocket.sessionURL;
    if (event.extra && logRocketSession !== null) {
      event.extra["LogRocket"] = logRocketSession;
      return event;
    } else {
      return event;
    }
  },
  // filter out logrocket pings
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'xhr' && breadcrumb.data.url.includes(`i?a=${encodeURIComponent(LOGROCKET_APP_ID)}`)) {
      return null;
    }
    return breadcrumb;
  },
});
