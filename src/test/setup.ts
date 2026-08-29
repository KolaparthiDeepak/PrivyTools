import '@testing-library/jest-dom/vitest';

// jsdom in this vitest setup does not provision Storage; provide a minimal one.
if (typeof localStorage === "undefined") {
  class MemStorage {
    private m = new Map<string, string>();
    get length() { return this.m.size; }
    clear() { this.m.clear(); }
    getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
    setItem(k: string, v: string) { this.m.set(k, String(v)); }
    removeItem(k: string) { this.m.delete(k); }
    key(i: number) { return [...this.m.keys()][i] ?? null; }
  }
  Object.defineProperty(globalThis, "localStorage", { value: new MemStorage(), configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: new MemStorage(), configurable: true });
}

// jsdom lacks matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom lacks ResizeObserver (needed by cmdk)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
