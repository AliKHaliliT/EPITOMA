import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { bootPalette } from "@/lib/palette";
import App from "./App.tsx";

// Re-apply the palette adopted from the imported portfolio before first
// paint, so the builder keeps the owner's look between launches.
bootPalette();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
