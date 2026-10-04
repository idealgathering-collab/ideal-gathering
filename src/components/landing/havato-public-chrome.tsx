import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { brand, logoAsset } from "@/config/brand";
import { useI18n } from "@/i18n";
import { landingCopy } from "./havato-home-copy";

// Restore public member sign-in at launch with this presentation flag.
const showMemberSignIn = false;

export function HavatoPublicHeader({
  story = false,
  subpage = false,
}: {
  story?: boolean;
  subpage?: boolean;
}) {
  const { lang, setLang } = useI18n();
  const language = lang === "en" ? "en" : "fa";
  const home = landingCopy[language];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const awayFromHome = story || subpage;
  const accessHref = awayFromHome ? `/?lang=${language}#waitlist` : "#waitlist";
  return (
    <header
      className="havato-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Link to="/" search={{ lang: language }} aria-label={brand.name} className="havato-brand">
        <img
          src={logoAsset.url}
          alt={language === "fa" ? "هواتو" : brand.name}
          width="720"
          height="735"
        />
      </Link>
      <nav
        className={menuOpen ? "havato-nav is-open" : "havato-nav"}
        id="havato-navigation"
        aria-label={home.navigation}
      >
        <Link
          to="/our-story"
          search={{ lang: language }}
          aria-current={story ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          {home.story}
        </Link>
        {home.nav.map(([label, id]) => (
          <a
            key={id}
            href={awayFromHome ? `/?lang=${language}#${id}` : `#${id}`}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </a>
        ))}
        {showMemberSignIn && (
          <Link to="/auth" onClick={() => setMenuOpen(false)}>
            {home.signin}
          </Link>
        )}
        <a className="havato-nav-access" href={accessHref} onClick={() => setMenuOpen(false)}>
          {home.requestAccess}
        </a>
      </nav>
      <div className="havato-header-actions">
        <div
          className="havato-language"
          role="group"
          aria-label={language === "fa" ? "زبان" : "Language"}
          dir="ltr"
        >
          {(["fa", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={language === value}
              onClick={() => {
                setLang(value);
                setMenuOpen(false);
              }}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          ref={menuButton}
          className="havato-menu"
          aria-label={menuOpen ? home.closeMenu : home.openMenu}
          aria-expanded={menuOpen}
          aria-controls="havato-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export function HavatoPublicFooter() {
  const { lang } = useI18n();
  const language = lang === "en" ? "en" : "fa";
  const home = landingCopy[language];
  return (
    <footer className="havato-footer">
      <nav aria-label={language === "fa" ? "درباره هواتو و قوانین" : "Havato and legal"}>
        <Link to="/our-story" search={{ lang: language }}>
          {home.story}
        </Link>
        <Link to="/terms" search={{ lang: language }}>
          {home.terms}
        </Link>
        <Link to="/privacy" search={{ lang: language }}>
          {home.privacy}
        </Link>
      </nav>
      <div className="havato-venue-access">
        <span>{home.forVenues}</span>
        <Link to="/venue/auth">{home.venueAccess}</Link>
      </div>
      <small>
        © {new Date().getFullYear()} {brand.name}
      </small>
    </footer>
  );
}
