"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function ReportHelpTooltip({
  text,
  label = "補足説明",
  triggerLabel,
  className
}: {
  text: string;
  label?: string;
  triggerLabel?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportPadding = 16;
      const width = Math.min(288, Math.max(180, window.innerWidth - viewportPadding * 2));
      const centeredLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(centeredLeft, viewportPadding),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
      );
      const showAbove = window.innerHeight - rect.bottom < 150 && rect.top > 150;
      const top = showAbove ? Math.max(viewportPadding, rect.top - 118) : rect.bottom + 6;
      setPosition({ left, top, width });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node | null)) {
        setOpen(false);
      }
    }

    updatePosition();
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={cn("group relative inline-flex shrink-0 items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        className={cn("-m-2.5 inline-flex h-11 touch-manipulation items-center justify-center rounded-full text-[10px] font-bold leading-none text-[#00796B] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B]/30", triggerLabel ? "w-auto px-2" : "w-11")}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        <span className={cn("inline-flex items-center justify-center border border-[#B8CEC7] bg-white transition group-hover:border-[#00796B] group-hover:bg-[#E6F4F1]", triggerLabel ? "h-7 w-auto rounded-md px-2 text-[11px]" : "h-6 w-6 rounded-full")}>
          {triggerLabel ?? "?"}
        </span>
      </button>
      {open && position && typeof document !== "undefined"
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              style={{ left: position.left, top: position.top, width: position.width }}
              className="fixed z-[100] rounded-lg border border-[#C9D8D4] bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-[#334155] shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
            >
              {text}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}
