import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { RecordsProvider } from "./context/RecordsContext";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecordsProvider>
      <App />
    </RecordsProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}
