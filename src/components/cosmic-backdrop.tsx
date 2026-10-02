import { useEffect, useState } from "react";
import nebulaAsset from "@/assets/landing-nebula-skyline.jpg.asset.json";
import { useIsMobile } from "@/hooks/use-mobile";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

/** The complete landing backdrop, shared by every public marketing page. */
export function CosmicBackdrop() {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const starCount = reducedMotion || isMobile ? 0 : 70;

  const stars = Array.from({ length: starCount }, (_, i) => {
    const seed = i * 9301 + 49297;
    return {
      x: seed % 100,
      y: (seed * 7) % 100,
      size: 1 + ((i * 5) % 3),
      delay: (i % 9) * 0.5,
      duration: 3 + (i % 5),
    };
  });

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{ background: "var(--background)", inset: "-4%" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(var(--background), var(--secondary))",
        }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[8] overflow-hidden">
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute animate-star-twinkle rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: index % 4 === 0 ? "var(--primary-light)" : "var(--foreground)",
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
