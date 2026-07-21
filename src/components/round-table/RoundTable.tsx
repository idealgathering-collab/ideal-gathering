import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Coffee, Sparkles, Users, Building2, HeartHandshake, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SeatId =
  | "welcome"
  | "how"
  | "cafes"
  | "guests"
  | "manifesto"
  | "tables";

export type Seat = {
  id: SeatId;
  labelKey: string;
  icon: LucideIcon;
};

export const SEATS: Seat[] = [
  { id: "welcome", labelKey: "landing.table.seat.welcome", icon: Sparkles },
  { id: "how", labelKey: "landing.table.seat.how", icon: CalendarClock },
  { id: "cafes", labelKey: "landing.table.seat.cafes", icon: Building2 },
  { id: "guests", labelKey: "landing.table.seat.guests", icon: Users },
  { id: "manifesto", labelKey: "landing.table.seat.manifesto", icon: HeartHandshake },
  { id: "tables", labelKey: "landing.table.seat.tables", icon: Coffee },
];

const SEAT_COUNT = SEATS.length;
const STEP = 360 / SEAT_COUNT;
// Angle where the "front" (closest to viewer) sits, in the tilted plane.
// With rotateZ(θ) translateY(-r), θ=180 pushes the seat toward the viewer.
const FRONT_ANGLE = 180;

type Props = {
  activeIndex: number;
  onActiveChange: (i: number) => void;
  t: (key: string) => string;
};

export function RoundTable({ activeIndex, onActiveChange, t }: Props) {
  // Rotation of the whole ring, in degrees. We animate this via CSS transitions.
  const [rotation, setRotation] = useState(() => FRONT_ANGLE - SEATS[0].labelKey.length * 0); // 180
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startRot: number } | null>(null);

  // Snap rotation so that activeIndex seat is at FRONT_ANGLE.
  useEffect(() => {
    const targetSeatAngle = activeIndex * STEP;
    const desired = FRONT_ANGLE - targetSeatAngle;
    setRotation((prev) => {
      // shortest path
      const diff = ((desired - prev + 540) % 360) - 180;
      return prev + diff;
    });
  }, [activeIndex]);

  const commitNearest = useCallback(
    (rot: number) => {
      // seat i is at angle (i*STEP + rot). Find i whose value is closest to FRONT_ANGLE.
      let best = 0;
      let bestDelta = Infinity;
      for (let i = 0; i < SEAT_COUNT; i++) {
        const a = ((i * STEP + rot - FRONT_ANGLE) % 360 + 540) % 360 - 180;
        const d = Math.abs(a);
        if (d < bestDelta) {
          bestDelta = d;
          best = i;
        }
      }
      onActiveChange(best);
    },
    [onActiveChange],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = { startX: e.clientX, startRot: rotation };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    setRotation(dragState.current.startRot + dx * 0.5);
  };
  const onPointerUp = () => {
    if (!dragState.current) return;
    const current = rotation;
    dragState.current = null;
    setDragging(false);
    commitNearest(current);
  };

  const rotStyle = useMemo(
    () => ({ "--rt-rot": `${rotation}deg` }) as CSSProperties,
    [rotation],
  );

  return (
    <div
      ref={stageRef}
      className="rt-perspective relative mx-auto flex h-full w-full max-w-[560px] items-center justify-center select-none touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-label={t("landing.table.aria.stage")}
    >
      {/* soft floor shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[10%] left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-ink-navy/25 blur-2xl"
      />

      {/* the tilted scene */}
      <div
        className={`rt-preserve-3d relative aspect-square w-[92%] ${dragging ? "" : "rt-drift"}`}
        style={{
          ...rotStyle,
          transform: "rotateX(58deg) rotateZ(var(--rt-rot, 0deg))",
          transition: dragging ? "none" : "transform 700ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform",
        }}
      >
        {/* table disc */}
        <div
          aria-hidden
          className="absolute inset-[8%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.72 0.09 55) 0%, oklch(0.55 0.11 50) 55%, oklch(0.38 0.09 45) 100%)",
            boxShadow:
              "inset 0 0 0 2px color-mix(in oklab, var(--ember) 40%, transparent), inset 0 12px 24px rgba(0,0,0,0.25), 0 30px 60px -20px rgba(0,0,0,0.4)",
            transform: "translateZ(0)",
          }}
        />
        {/* inner ring detail */}
        <div
          aria-hidden
          className="absolute inset-[22%] rounded-full border border-parchment/25"
          style={{ transform: "translateZ(2px)" }}
        />
        {/* center marker */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-parchment/70"
          style={{ transform: "translate(-50%,-50%) translateZ(4px)" }}
        />

        {/* seats */}
        {SEATS.map((seat, i) => {
          const angle = i * STEP;
          const isActive = i === activeIndex;
          return (
            <SeatButton
              key={seat.id}
              seat={seat}
              angle={angle}
              isActive={isActive}
              onSelect={() => onActiveChange(i)}
              label={t(seat.labelKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  angle,
  isActive,
  onSelect,
  label,
}: {
  seat: Seat;
  angle: number;
  isActive: boolean;
  onSelect: () => void;
  label: string;
}) {
  const Icon = seat.icon;
  // Ring wrapper: place at angle around the disc.
  const wrapperStyle: CSSProperties = {
    transform: `rotateZ(${angle}deg) translateY(-42%)`,
    transformStyle: "preserve-3d",
  };
  // Seat itself: counter-rotate Z to keep label upright in the tilted plane,
  // counter-rotate X to face the camera, and lift on active.
  const seatStyle: CSSProperties = {
    transform: `rotateZ(${-angle}deg) rotateX(-58deg) translateZ(${isActive ? 44 : 8}px) scale(${isActive ? 1.12 : 1})`,
    transition: "transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease, box-shadow 300ms ease",
    opacity: isActive ? 1 : 0.62,
    transformStyle: "preserve-3d",
  };
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={wrapperStyle}
      aria-hidden={false}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-pressed={isActive}
        aria-label={label}
        className={`grid min-h-[56px] min-w-[56px] place-items-center rounded-full border text-parchment shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)] transition-colors ${
          isActive
            ? "border-ember bg-ember"
            : "border-parchment/40 bg-ink-navy/85 hover:bg-ink-navy"
        }`}
        style={seatStyle}
      >
        <Icon className="h-5 w-5" />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
