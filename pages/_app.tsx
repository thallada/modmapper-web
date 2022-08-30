import "../lib/logrocketSetup";
import "../styles/globals.css";

import LogRocket from "logrocket";
import * as Sentry from "@sentry/nextjs";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";

import store from "../lib/store";

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
