import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { RecordsProvider } from "./context/RecordsContext";
import "./style.css";
import "./styles/pages.css";
import "./styles/forms.css";
import "./styles/responsive.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecordsProvider>
      <App />
    </RecordsProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      })
      .catch((error: unknown) => console.warn("Offline setup could not finish.", error));
  });
}
