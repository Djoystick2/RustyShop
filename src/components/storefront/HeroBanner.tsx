import headerBanner from "../../../header.png";

export function HeroBanner() {
  return (
    <div className="hero-banner">
      <img
        className="hero-banner__image"
        src={headerBanner}
        alt="Ярмарка Rusty"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
