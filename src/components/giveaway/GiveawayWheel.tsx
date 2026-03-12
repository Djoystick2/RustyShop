import type { GiveawayWheelSegment } from "../../domain/giveaway/wheel";

interface GiveawayWheelProps {
  segments: GiveawayWheelSegment[];
  rotationDeg: number;
  spinDurationMs: number;
  isSpinning: boolean;
}

export function GiveawayWheel({
  segments,
  rotationDeg,
  spinDurationMs,
  isSpinning
}: GiveawayWheelProps) {
  if (segments.length === 0) {
    return (
      <div className="giveaway-wheel-shell card">
        <p>Нет лотов для вращения.</p>
      </div>
    );
  }

  const segmentSize = 360 / segments.length;
  const gradientStops = segments
    .map((segment, index) => {
      const start = index * segmentSize;
      const end = (index + 1) * segmentSize;
      return `${segment.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    })
    .join(", ");

  return (
    <div className={`giveaway-wheel-shell${isSpinning ? " giveaway-wheel-shell_spinning" : ""}`}>
      <div className="giveaway-wheel-pointer" aria-hidden />
      <div
        className="giveaway-wheel"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transition: isSpinning
            ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.85, 0.2, 1)`
            : undefined,
          backgroundImage: `conic-gradient(from -90deg, ${gradientStops})`
        }}
      >
        {segments.map((segment, index) => {
          const angle = index * segmentSize + segmentSize / 2;
          return (
            <span
              key={segment.giveawayItemId}
              className="giveaway-wheel-label"
              style={{
                transform: `rotate(${angle}deg) translateY(-40%) rotate(-${angle}deg)`
              }}
            >
              {segment.label}
            </span>
          );
        })}
        <div className="giveaway-wheel-center">🎁</div>
      </div>
    </div>
  );
}
