import nebulaAsset from "@/assets/landing-nebula-skyline.jpg.asset.json";

/** Same nebula backdrop the landing page renders, for public marketing pages. */
export function CosmicBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${nebulaAsset.url})`, inset: "-4%" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(10,6,22,0.35) 0%, rgba(10,6,22,0.82) 60%, rgba(10,6,22,0.96) 100%)",
        }}
      />
    </>
  );
}
