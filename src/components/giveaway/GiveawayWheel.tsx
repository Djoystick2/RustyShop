import type { GiveawayWheelSegment } from "../../domain/giveaway/wheel";

interface GiveawayWheelProps {
  segments: GiveawayWheelSegment[];
  rotationDeg: number;
  spinDurationMs: number;
  isSpinning: boolean;
}

function shortenLabel(label: string, maxChars: number): string {
  const normalized = label.trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function getLabelCharsLimit(segmentCount: number): number {
  if (segmentCount <= 5) {
    return 18;
  }
  if (segmentCount <= 8) {
    return 12;
  }
  if (segmentCount <= 12) {
    return 9;
  }
  return 7;
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
  const maxChars = getLabelCharsLimit(segments.length);

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
        <svg className="giveaway-wheel-labels" viewBox="0 0 100 100" aria-hidden>
          {segments.map((segment, index) => {
            const angleDeg = index * segmentSize + segmentSize / 2 - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = 50 + Math.cos(angleRad) * 30;
            const y = 50 + Math.sin(angleRad) * 30;
            const text = shortenLabel(segment.label, maxChars);

            return (
              <text
                key={segment.giveawayItemId}
                className="giveaway-wheel-label"
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {text}
              </text>
            );
          })}
        </svg>
        <div className="giveaway-wheel-center">🎁</div>
      </div>
      <div className="giveaway-wheel-legend" aria-label="Лоты на колесе">
        {segments.map((segment, index) => (
          <div key={segment.giveawayItemId} className="giveaway-wheel-legend__item">
            <span className="giveaway-wheel-legend__dot" style={{ backgroundColor: segment.color }} />
            <small>
              {index + 1}. {segment.label}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

