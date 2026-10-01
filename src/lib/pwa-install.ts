type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = "hidden" | "ready" | "ios" | "pending";

// Capture once, before React mounts; retain the event across route changes.
export function createPwaInstall(target: Window, nav: Navigator) {
  const display = target.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)");
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const standalone = () => display.matches ||
    (nav as Navigator & { standalone?: boolean }).standalone === true;
  let installed = standalone();
  let deferred: InstallPrompt | null = null;
  let state: InstallState = !installed && ios ? "ios" : "hidden";
  const listeners = new Set<() => void>();
  const update = (next: InstallState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  target.addEventListener("beforeinstallprompt", (event) => {
    if (ios || installed || standalone()) return;
    event.preventDefault();
    deferred = event as InstallPrompt;
    update("ready");
  });
  target.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    update("hidden");
  });
  display.addEventListener("change", () => {
    if (standalone()) {
      deferred = null;
      update("hidden");
    } else if (!installed) update(ios ? "ios" : "hidden");
  });
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async prompt() {
      if (!deferred || installed || standalone()) return;
      const event = deferred;
      deferred = null; // A native prompt event can only be used once.
      update("pending");
      try {
        // Call before the first await to preserve the user's tap activation.
        await event.prompt();
        await event.userChoice;
      } finally {
        // Acceptance alone does not prove installation; appinstalled does.
        update("hidden");
      }
    },
  };
}

export const pwaInstall = typeof window === "undefined"
  ? null
  : createPwaInstall(window, navigator);
