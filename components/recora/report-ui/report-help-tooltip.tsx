"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ReportHelpTooltip({
  text,
  label = "補足説明",
  className
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node | null)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex shrink-0 items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#C9D8D4] bg-white text-[10px] font-bold leading-none text-[#00796B] transition hover:border-[#00796B] hover:bg-[#E6F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B]/25"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        ?
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-6 z-50 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-[#D8E0E3] bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-[#334155] shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
