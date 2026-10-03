import { useState } from "react";
import { createRoot } from "react-dom/client";
import { LanguageProvider, useI18n } from "../../src/i18n";
import { PushNotificationEntry } from "../../src/components/push-notification-entry";
import { switchAccount, toggleFailure, fixtureStatus } from "./fixtures";
import "../../src/styles.css";
export function Preview() {
  const { setLang } = useI18n();
  const [, refresh] = useState(0);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-8">
      <h1 className="text-2xl">Notification fixture — no live writes</h1>
      <div className="mt-4 flex flex-wrap gap-3" dir="ltr">
        <button onClick={() => setLang("fa")}>فارسی UI</button>
        <button onClick={() => setLang("en")}>English UI</button>
        <button onClick={switchAccount}>Switch fixture account</button>
        <button onClick={toggleFailure}>Toggle save failure</button>
        <button onClick={() => refresh((v) => v + 1)}>Read fixture counts</button>
      </div>
      <p dir="ltr">{fixtureStatus()}</p>
      <PushNotificationEntry />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <Preview />
  </LanguageProvider>,
);
