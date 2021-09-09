import { createApp } from "vue";

import App from "./App.vue";

import router from "./router";
import i18n from "./i18n";
import electronBridge from "./utils/electronBridge";
import { messaging, messagingSupported } from "./utils/firebaseInstance";
import { reportError } from "./services/userService";
import { applyDefaultTheme } from "./utils/customCssVars";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $isMobile: boolean;
    $version: string;
    $lastUIBreakingVersion: string;
    $isElectron: string;
    $window: Window;
  }
}

if (!String.prototype.replaceAll) {
  (String.prototype as any).replaceAll = String.prototype.replace;
}

if (messagingSupported && process.env.VUE_APP_FCM_API_KEY) {
  messaging().onMessage(payload => {
    console.log("FCM Data: ", payload);
  });
}

const app = createApp(App)
  .use(router)
  .use(i18n);

app.config.globalProperties.$isElectron = electronBridge?.isElectron || false;
app.config.globalProperties.$lastUIBreakingVersion =
  process.env.VUE_APP_LAST_UI_BREAKING_VERSION;
app.config.globalProperties.$isMobile = /iphone|ipod|android|ie|blackberry|fennec/.test(
  navigator.userAgent.toLowerCase()
);
app.config.globalProperties.$window = window;

applyDefaultTheme(false);

let cancelErrorReportingForever = false;
app.config.errorHandler = function(err) {
  console.error(err);
  // disable error prompt in dev.
  if ((window as any).webpackHotUpdate) return;
  if (cancelErrorReportingForever) return;
  const val = prompt(
    `An error has occurred.\n${err}\nWould you like to report it?\n\nType in the box the action you were trying to do:`
  );
  if (val === null) {
    cancelErrorReportingForever = true;
    return;
  }
  reportError(err, val).then(() => {
    alert("Report sent. Thank you!");
  });
};

app.mount("#App");
