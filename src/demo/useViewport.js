import { useState, useEffect } from "react";

// Gedeelde viewport-zone voor responsive inline-styles.
const PHONE_MAX = 640;
const DESKTOP_MIN = 1024;

// Pure, testbaar: breedte -> zone-flags.
export function classify(w) {
  return {
    width: w,
    isPhone: w <= PHONE_MAX,
    isTablet: w > PHONE_MAX && w < DESKTOP_MIN,
    isDesktop: w >= DESKTOP_MIN,
  };
}

// Hook: gedebouncede resize-listener (rAF), één per consument.
export function useViewport() {
  const [state, setState] = useState(() =>
    classify(typeof window !== "undefined" ? window.innerWidth : 1440)
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setState(classify(window.innerWidth)));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return state;
}
