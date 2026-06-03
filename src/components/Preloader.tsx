import { useEffect, useState } from "react";
import logo from "@/assets/logo.png.asset.json";

export function Preloader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${
        gone ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img src={logo.url} alt="" className="h-16 w-16 animate-spin-once" style={{ animationIterationCount: "infinite", animationDuration: "1.6s" }}/>
    </div>
  );
}
