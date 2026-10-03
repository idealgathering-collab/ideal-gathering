import { createRoot } from "react-dom/client";
import { LanguageProvider } from "../../src/i18n";
import { HavatoWaitlist } from "../../src/components/landing/havato-waitlist";
import "../../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <HavatoWaitlist />
  </LanguageProvider>,
);
