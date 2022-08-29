import "../styles/globals.css";

import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import LogRocket from "logrocket";

import store from "../lib/store";

LogRocket.init("0tlgj3/modmapper");

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
