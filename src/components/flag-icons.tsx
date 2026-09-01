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

export function FlagRU(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="60" height="13.33" y="0" fill="#fff" />
      <rect width="60" height="13.34" y="13.33" fill="#0039A6" />
      <rect width="60" height="13.33" y="26.67" fill="#D52B1E" />
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
  if (code === "ru") return <FlagRU {...common} />;
  if (code === "fa") return <FlagIR {...common} />;
  return <FlagUK {...common} />;
}
