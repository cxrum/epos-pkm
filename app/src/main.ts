import { createApp } from "vue";
import "./style.css";
import "./assets/fonts/fixel.css";
import App from "./App.vue";
import { i18n } from "./core/i18n";
import router from "./router";
import { createPinia } from "pinia";
import { vContextMenu } from "./shared/components/contextMenu/index.ts";

const app = createApp(App);
const pinia = createPinia();

app.directive("context-menu", vContextMenu);

app.use(pinia).use(router).use(i18n).mount("#app");

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const el = document.activeElement as HTMLElement;
    if (
      el &&
      (el.tagName === "BUTTON" || el.getAttribute("role") === "button")
    ) {
      el.classList.add("keyboard-active");
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const el = document.activeElement as HTMLElement;
    if (el) {
      el.classList.remove("keyboard-active");
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const activeEl = document.activeElement as HTMLElement | null;

    if (activeEl && typeof activeEl.blur === "function") {
      activeEl.blur();
    }
  }
});
