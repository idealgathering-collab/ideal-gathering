import type { SVGProps } from "react";
import type { Lang } from "@/i18n/translations";

type FlagProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 60 40",
  xmlns: "http://www.w3.org/2000/svg",
  preserveAspectRatio: "xMidYMid slice",
};

export function FlagUK(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <clipPath id="fuk-c">
        <rect width="60" height="40" rx="0" />
      </clipPath>
      <g clipPath="url(#fuk-c)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
        <path
          d="M0,0 L60,40 M60,0 L0,40"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath="polygon(0 0, 50% 50%, 100% 0, 50% 50%, 100% 100%, 50% 50%, 0 100%, 50% 50%)"
        />
        <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function FlagTR(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="22" cy="20" r="8" fill="#fff" />
      <circle cx="24.5" cy="20" r="6.4" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="33.5,20 29.35,21.35 31.92,17.82 31.92,22.18 29.35,18.65"
      />
    </svg>
  );
}

export function FlagIR(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="60" height="13.33" y="0" fill="#239F40" />
      <rect width="60" height="13.34" y="13.33" fill="#fff" />
      <rect width="60" height="13.33" y="26.67" fill="#DA0000" />
      <g fill="#DA0000" transform="translate(30,20) scale(0.9)">
        <path d="M-3,-2 h6 v1 h-2 v3 h-2 v-3 h-2 z" />
      </g>
    </svg>
  );
}

export function LangFlag({ code, className }: { code: Lang; className?: string }) {
  const common = { className, role: "img" as const, "aria-hidden": true };
  if (code === "tr") return <FlagTR {...common} />;
  if (code === "fa") return <FlagIR {...common} />;
  return <FlagUK {...common} />;
}
