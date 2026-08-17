import "@testing-library/jest-dom";

/**
 * jsdom in this runner doesn't always expose a working `localStorage` global,
 * so any code that touches it at module/render time (SettingsContext,
 * demo config, storefront cart/wishlist) throws under test. Provide a minimal
 * in-memory Storage when one isn't present. Guarded so real environments
 * (browsers, CI jsdom) keep their native implementation.
 */
function installMemoryStorage(key: "localStorage" | "sessionStorage") {
  try {
    if (typeof globalThis[key] !== "undefined" && globalThis[key]) {
      globalThis[key].getItem("__probe__");
      return;
    }
  } catch {
    /* present but throwing — replace with the in-memory shim below */
  }
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => void store.delete(k),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
  };
  Object.defineProperty(globalThis, key, { value: storage, writable: true, configurable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, key, { value: storage, writable: true, configurable: true });
  }
}

installMemoryStorage("localStorage");
installMemoryStorage("sessionStorage");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

/**
 * jsdom has no ResizeObserver, and Radix measures its thumb with one
 * (`@radix-ui/react-use-size`). Without this, rendering a <Switch> — and so any
 * screen with a toggle on it — throws an uncaught ReferenceError mid-commit.
 * A no-op is enough: layout has no size in jsdom anyway.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverStub,
    writable: true,
    configurable: true,
  });
}

/**
 * jsdom has no layout, so it ships no `scrollIntoView` at all. The storefront
 * scrolls to sections by id and the homepage editor scrolls the section it
 * opens into view — both would throw here. A no-op is the honest stub: there is
 * nothing to scroll.
 */
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
