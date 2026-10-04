import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { legalContactHref, legalDetails } from "@/config/legal";
import { legalCopy } from "./havato-legal-copy";
import { landingCopy } from "./havato-home-copy";
import { HavatoPublicHeader, HavatoPublicFooter } from "./havato-public-chrome";
import "./havato-waitlist.css";
import "./havato-legal.css";

export function HavatoLegal({ document }: { document: "terms" | "privacy" }) {
  const { lang } = useI18n();
  const language = lang === "en" ? "en" : "fa";
  const copy = legalCopy[language];
  const content = copy[document];
  const contactHref = legalContactHref();
  return (
    <div className="havato-public" lang={language} dir={language === "fa" ? "rtl" : "ltr"}>
      <a className="havato-skip" href="#havato-legal-title">
        {landingCopy[language].skip}
      </a>
      <div className="havato-page">
        <HavatoPublicHeader subpage />
        <main className="havato-legal">
          <header className="havato-legal-intro">
            <p className="havato-legal-eyebrow">{copy.eyebrow}</p>
            <h1 id="havato-legal-title" tabIndex={-1}>
              {content.title}
            </h1>
            <p className="havato-legal-summary">{content.intro}</p>
            <p className="havato-legal-date">{copy.updated}</p>
            <nav className="havato-legal-related" aria-label={copy.related}>
              <Link
                to="/terms"
                search={{ lang: language }}
                aria-current={document === "terms" ? "page" : undefined}
              >
                {copy.termsLabel}
              </Link>
              <Link
                to="/privacy"
                search={{ lang: language }}
                aria-current={document === "privacy" ? "page" : undefined}
              >
                {copy.privacyLabel}
              </Link>
            </nav>
          </header>
          <div className="havato-legal-layout">
            <nav className="havato-legal-contents" aria-label={copy.contents}>
              <h2>{copy.contents}</h2>
              <ol>
                {content.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
                <li>
                  <a href="#contact">{copy.contactTitle}</a>
                </li>
              </ol>
            </nav>
            <article className="havato-legal-body" aria-labelledby="havato-legal-title">
              {content.sections.map((section) => (
                <section id={section.id} key={section.id}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
              <section id="contact" className="havato-legal-contact">
                <h2>{copy.contactTitle}</h2>
                <p>{legalDetails.operatorName || copy.operator}</p>
                {legalDetails.postalAddress && <p>{legalDetails.postalAddress}</p>}
                {contactHref ? (
                  <p>
                    <a href={contactHref}>{copy.contactLink}</a>
                  </p>
                ) : (
                  <p>{copy.contactPending}</p>
                )}
                <p>
                  <Link to="/settings">{copy.settings}</Link>
                </p>
              </section>
            </article>
          </div>
        </main>
        <HavatoPublicFooter />
      </div>
    </div>
  );
}
