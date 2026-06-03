import { useState } from "react";
import logo from "@/assets/logo.png.asset.json";

interface Props {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function RotatingLogo({ className = "", size = 44, showWordmark = true }: Props) {
  const [spin, setSpin] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setSpin((s) => s + 1)}
      className={`group flex items-center gap-3 ${className}`}
      aria-label="YSJ Limited Broiler Farm — spin logo"
    >
      <img
        key={spin}
        src={logo.url}
        alt="YSJ Limited Broiler Farm"
        width={size}
        height={size}
        className="animate-spin-once rounded-md object-contain"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="hidden sm:flex flex-col leading-tight text-left">
          <span className="font-display text-base font-bold tracking-tight text-primary-deep">
            YSJ Limited
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Broiler Farm
          </span>
        </span>
      )}
    </button>
  );
}
