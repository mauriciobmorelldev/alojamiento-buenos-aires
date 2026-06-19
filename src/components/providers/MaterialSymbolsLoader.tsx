"use client";

import { useEffect } from "react";

const MATERIAL_SYMBOLS_ID = "material-symbols-outlined-font";
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";

export default function MaterialSymbolsLoader() {
  useEffect(() => {
    if (document.getElementById(MATERIAL_SYMBOLS_ID)) return;

    const loadFont = () => {
      if (document.getElementById(MATERIAL_SYMBOLS_ID)) return;
      const link = document.createElement("link");
      link.id = MATERIAL_SYMBOLS_ID;
      link.rel = "stylesheet";
      link.href = MATERIAL_SYMBOLS_HREF;
      link.onload = () => document.body.classList.add("material-symbols-ready");
      document.head.appendChild(link);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadFont, { timeout: 450 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(loadFont, 120);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return null;
}
