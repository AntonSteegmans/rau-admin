import { describe, it, expect } from "vitest";
import { classify } from "../useViewport";

describe("classify (viewport-zones)", () => {
  it("telefoon op 375px", () => {
    expect(classify(375)).toEqual({ width: 375, isPhone: true, isTablet: false, isDesktop: false });
  });
  it("tablet op 768px", () => {
    const r = classify(768);
    expect(r.isPhone).toBe(false);
    expect(r.isTablet).toBe(true);
    expect(r.isDesktop).toBe(false);
  });
  it("desktop op 1440px", () => {
    expect(classify(1440).isDesktop).toBe(true);
  });
  it("grenswaarden: 640=phone, 641=tablet, 1023=tablet, 1024=desktop", () => {
    expect(classify(640).isPhone).toBe(true);
    expect(classify(641).isTablet).toBe(true);
    expect(classify(1023).isTablet).toBe(true);
    expect(classify(1024).isDesktop).toBe(true);
  });
});
