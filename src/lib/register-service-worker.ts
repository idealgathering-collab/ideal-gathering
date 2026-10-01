let registrationStarted = false;

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) {
    return;
  }
  if (registrationStarted) return;
  registrationStarted = true;

  const register = () => {
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        // Recheck on return from the background; never interrupt an in-progress form.
        const update = () => {
          if (document.visibilityState === "visible") {
            void registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", update);
        update();
      })
      .catch((error: unknown) => {
        console.warn("Havato service worker registration failed", error);
      });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
