import "../styles/globals.css";

import * as Sentry from "@sentry/nextjs";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

import store from "../lib/store";

LogRocket.init("0tlgj3/modmapper");
if (typeof window !== "undefined") setupLogRocketReact(LogRocket);

LogRocket.getSessionURL((sessionURL) => {
  Sentry.configureScope((scope) => {
    scope.setExtra("sessionURL", sessionURL);
  });
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
