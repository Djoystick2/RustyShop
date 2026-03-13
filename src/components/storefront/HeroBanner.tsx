import headerBanner from "../../../header.png";

interface HeroBannerProps {
  imageUrl?: string;
  alt?: string;
}

export function HeroBanner({ imageUrl, alt = "РЇСЂРјР°СЂРєР° Rusty" }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <img
        className="hero-banner__image"
        src={imageUrl || headerBanner}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
