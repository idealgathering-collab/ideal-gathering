import { createRoot } from "react-dom/client";
import { LanguageProvider } from "../../src/i18n";
import { HavatoWaitlist } from "../../src/components/landing/havato-waitlist";
import { HavatoLegal } from "../../src/components/landing/havato-legal";
import { HavatoStory } from "../../src/components/landing/havato-story";
import "../../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    {window.location.pathname === "/terms" ? (
      <HavatoLegal document="terms" />
    ) : window.location.pathname === "/privacy" ? (
      <HavatoLegal document="privacy" />
    ) : window.location.pathname === "/our-story" ? (
      <HavatoStory />
    ) : (
      <HavatoWaitlist />
    )}
  </LanguageProvider>,
);
