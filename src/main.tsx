import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { publicUrl } from "./lib/publicUrl";
import "./index.css";

declare global {
  interface Window {
    __rentgearApiUnavailable?: boolean;
  }
}

async function enableMocks() {
  const { worker } = await import("./mocks/browser");
  await worker.start({
    serviceWorker: {
      url: publicUrl("mockServiceWorker.js"),
    },
    onUnhandledRequest: "bypass",
  });
}

async function bootstrap() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("root not found");

  const root = createRoot(rootEl);
  const useMsw =
    import.meta.env.DEV || import.meta.env.VITE_USE_MSW === "true";

  if (useMsw) {
    try {
      await enableMocks();
    } catch {
      window.__rentgearApiUnavailable = true;
    }
  }

  root.render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

bootstrap();
