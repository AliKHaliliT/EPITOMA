import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { bootPalette } from "@/shared/lib";
import { App } from "./App";

// Re-apply the palette adopted from the imported portfolio before first
// paint, so the builder keeps the owner's look between launches.
bootPalette();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
