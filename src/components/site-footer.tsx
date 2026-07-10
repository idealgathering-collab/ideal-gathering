import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin } from "lucide-react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="bg-plum text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoAsset.url}
              alt="Ideal Gathering"
              className="h-10 w-10 rounded-full bg-primary-foreground/10 object-contain p-1"
            />
            <span className="font-display text-xl leading-none">
              Ideal <span className="italic">Gathering</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/80">
            Set the table. Set the subject. Ideal Gathering brings people to small,
            curated tables at cafes worth sitting in.
          </p>
        </div>

        <FooterCol
          title="Explore"
          links={[
            { label: "How it works", href: "/#how" },
            { label: "Upcoming tables", href: "/#tables" },
            { label: "Partner cafes", href: "/#partners" },
            { label: "Community vibe", href: "/#vibe" },
          ]}
        />
        <FooterCol
          title="For businesses"
          links={[
            { label: "Venue subscriptions", href: "/register-business", route: true },
            { label: "Bidding framework", href: "/#partners" },
            { label: "Success stories", href: "/#vibe" },
            { label: "Cafe support", href: "mailto:hello@idealgathering.co" },
          ]}
        />
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-primary-foreground/60">
            Legal & social
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="/#terms" className="hover:text-sunshine">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="/#privacy" className="hover:text-sunshine">
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@idealgathering.co"
                className="hover:text-sunshine"
              >
                Contact us
              </a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-sunshine"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-sunshine"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-primary-foreground/70 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Ideal Gathering.</div>
          <div className="italic">
            Made with care for people who'd rather talk than scroll.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; route?: boolean }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium uppercase tracking-wide text-primary-foreground/60">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            {l.route ? (
              <Link to={l.href} className="hover:text-sunshine">
                {l.label}
              </Link>
            ) : (
              <a href={l.href} className="hover:text-sunshine">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
