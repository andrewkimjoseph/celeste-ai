"use client";

import { useEffect } from "react";

/** Keep layout height in sync with the visual viewport (mobile keyboard). */
export function useVisualViewportSync() {
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const layoutHeight = window.innerHeight;
      const keyboardOpen =
        layoutHeight - height - offsetTop > 80 || height < layoutHeight * 0.75;

      root.style.setProperty("--app-height", `${height}px`);
      root.style.setProperty("--app-offset-top", `${offsetTop}px`);
      root.style.setProperty(
        "--composer-extra-bottom",
        keyboardOpen ? "1rem" : "0px",
      );
    }

    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
}
