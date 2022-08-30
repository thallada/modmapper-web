import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

const LOGROCKET_APP_ID =
  process.env.LOGROCKET_APP_ID || process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

LogRocket.init(LOGROCKET_APP_ID || "0tlgj3/modmapper");
if (typeof window !== "undefined") setupLogRocketReact(LogRocket);