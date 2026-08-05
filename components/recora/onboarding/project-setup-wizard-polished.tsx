"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Undo2, X } from "lucide-react";

import { ProjectSetupWizardV2 } from "@/components/recora/onboarding/project-setup-wizard-v2";

type SheetState = {
  panel: HTMLElement;
  trigger: HTMLButtonElement;
  current: string;
  slot: string;
};

type UndoState = {
  trigger: HTMLButtonElement;
  previous: string;
  next: string;
};

const text = (element: Element | null) =>
  element?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const candidateName = (button: HTMLButtonElement) =>
  text(button.querySelector("span")) || text(button).split("・")[0];

const focusables = (panel: HTMLElement) =>
  Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hidden);

export function ProjectSetupWizardPolished() {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const undoing = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const closeSheet = useCallback(() => {
    if (!sheet) return;
    sheet.trigger.click();
    requestAnimationFrame(() => sheet.trigger.focus());
  }, [sheet]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const decorate = () => {
      root.querySelectorAll<HTMLElement>("header *").forEach((element) => {
        if (/^Step \d+ \/ 6$/.test(text(element)) && !element.children.length) {
          element.dataset.recoraDuplicateStep = "true";
        }
      });
      root.querySelectorAll<HTMLElement>("main section > div:first-child p").forEach((element) => {
        if (/^Step \d+$/.test(text(element))) element.dataset.recoraDuplicateStep = "true";
      });

      root.querySelector<HTMLElement>('ol[aria-label="初期設定ステップ"]')?.setAttribute(
        "data-recora-progress",
        "true"
      );

      const shell = root.querySelector<HTMLElement>("main > div > section");
      if (shell) {
        shell.dataset.recoraShell = "true";
        const bar = shell.lastElementChild as HTMLElement | null;
        if (bar && text(bar).includes("戻る")) {
          bar.dataset.recoraActions = "true";
          bar.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
            const label = text(button);
            button.dataset.recoraAction =
              label === "戻る"
                ? "back"
                : label === "最終確認に戻る"
                  ? "review"
                  : label === "次へ" || label === "設定を完了する"
                    ? "primary"
                    : "";
          });
        }
      }

      const cards = Array.from(
        new Set(
          Array.from(root.querySelectorAll<HTMLButtonElement>("article button[aria-expanded]"))
            .map((button) => button.closest<HTMLElement>("article"))
            .filter((article): article is HTMLElement => Boolean(article))
        )
      );

      cards.forEach((card) => {
        const slot = text(card.querySelector("p"));
        const kind = slot.startsWith("PERSONA")
          ? "persona"
          : slot.startsWith("TOPIC")
            ? "topic"
            : null;
        if (!kind) return;
        card.dataset.recoraCard = kind;
        if (card.parentElement) card.parentElement.dataset.recoraGrid = kind;
        const details = card.querySelector<HTMLElement>("dl");
        if (details) details.dataset.recoraDetails = kind;
        if (details && !card.querySelector("[data-recora-detail-toggle]")) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.dataset.recoraDetailToggle = kind;
          toggle.className = "recora-detail-toggle";
          const closedLabel = kind === "persona" ? "詳細を見る" : "質問例を見る";
          toggle.textContent = closedLabel;
          toggle.onclick = () => {
            const open = card.dataset.recoraDetailsOpen === "true";
            card.dataset.recoraDetailsOpen = open ? "false" : "true";
            toggle.textContent = open ? closedLabel : "閉じる";
          };
          details.insertAdjacentElement("afterend", toggle);
        }
      });

      const trigger = root.querySelector<HTMLButtonElement>('article button[aria-expanded="true"]');
      if (!trigger) {
        setSheet(null);
        return;
      }
      const card = trigger.closest<HTMLElement>("article");
      const panel = card?.lastElementChild as HTMLElement | null;
      if (!card || !panel || panel === card.firstElementChild) return;

      const current = text(card.querySelector("h2"));
      const slot = text(card.querySelector("p"));
      const titleId = `recora-sheet-${slot.replace(/\s+/g, "-").toLowerCase()}`;
      panel.dataset.recoraSheet = "true";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", titleId);
      panel.tabIndex = -1;

      let header = panel.querySelector<HTMLElement>("[data-recora-sheet-header]");
      if (!header) {
        header = document.createElement("div");
        header.dataset.recoraSheetHeader = "true";
        panel.prepend(header);
      }
      const headerKey = `${slot}::${current}`;
      if (header.dataset.recoraHeaderKey !== headerKey) {
        header.dataset.recoraHeaderKey = headerKey;
        header.replaceChildren();
        const eyebrow = document.createElement("p");
        eyebrow.className = "recora-sheet-eyebrow";
        eyebrow.textContent = "候補を変更";
        const heading = document.createElement("h2");
        heading.id = titleId;
        heading.className = "recora-sheet-heading";
        heading.textContent = `${slot}を変更`;
        const selected = document.createElement("div");
        selected.className = "recora-current-selection";
        const caption = document.createElement("span");
        caption.textContent = "現在の選択";
        const value = document.createElement("strong");
        value.textContent = current;
        selected.append(caption, value);
        const description = document.createElement("p");
        description.className = "recora-sheet-description";
        description.textContent = "別の候補を選択してください。別の枠で選択中の候補は選べません。";
        header.append(eyebrow, heading, selected, description);
      }

      const originalTitle = Array.from(panel.children).find(
        (child) => child !== header && child.tagName === "P"
      ) as HTMLElement | undefined;
      if (originalTitle) originalTitle.dataset.recoraOriginalTitle = "true";
      setSheet((previous) =>
        previous?.panel === panel ? previous : { panel, trigger, current, slot }
      );
    };

    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "class"]
    });

    const rememberChange = (event: Event) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
        '[data-recora-sheet] button[aria-pressed]'
      );
      if (!button || button.disabled || button.getAttribute("aria-pressed") === "true") return;
      if (undoing.current) {
        undoing.current = false;
        return;
      }
      const panel = button.closest<HTMLElement>("[data-recora-sheet]");
      const selected = panel?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
      const trigger = root.querySelector<HTMLButtonElement>('article button[aria-expanded="true"]');
      if (selected && trigger) {
        setUndo({
          trigger,
          previous: candidateName(selected),
          next: candidateName(button)
        });
      }
    };
    root.addEventListener("click", rememberChange, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", rememberChange, true);
    };
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables(sheet.panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeSheet, sheet]);

  const undoChange = () => {
    if (!undo) return;
    undoing.current = true;
    undo.trigger.click();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const panel = rootRef.current?.querySelector<HTMLElement>("[data-recora-sheet]");
        const candidate = Array.from(
          panel?.querySelectorAll<HTMLButtonElement>("button[aria-pressed]") ?? []
        ).find((button) => candidateName(button) === undo.previous);
        candidate?.click();
        setUndo(null);
      });
    });
  };

  return (
    <div ref={rootRef} className="recora-onboarding-polish">
      <ProjectSetupWizardV2 />
      {mounted && sheet &&
        createPortal(
          <div
            className="recora-sheet-backdrop"
            aria-hidden="true"
            onMouseDown={closeSheet}
          />,
          document.body
        )}
      {mounted && sheet &&
        createPortal(
          <button
            ref={closeRef}
            type="button"
            className="recora-sheet-close"
            aria-label="候補選択を閉じる"
            onClick={closeSheet}
          >
            <X className="size-5" />
          </button>,
          sheet.panel
        )}
      {mounted && undo &&
        createPortal(
          <div className="recora-undo-toast" role="status" aria-live="polite">
            <span>「{undo.next}」に変更しました</span>
            <button type="button" onClick={undoChange}>
              <Undo2 className="size-4" />
              元に戻す
            </button>
          </div>,
          document.body
        )}
      <style jsx global>{`
        .recora-onboarding-polish [data-recora-duplicate-step] { display: none !important; }
        .recora-onboarding-polish main { padding-bottom: 108px; }
        .recora-onboarding-polish main > div { max-width: 1280px !important; }
        .recora-onboarding-polish [data-recora-shell] { border-radius: 20px !important; box-shadow: 0 14px 36px rgba(33,72,51,.065) !important; }
        .recora-onboarding-polish [data-recora-shell] > div:first-child { padding-block: 18px !important; }
        .recora-onboarding-polish [data-recora-actions] { position: fixed; left: 50%; bottom: 0; z-index: 50; width: min(calc(100% - 32px),1280px); transform: translateX(-50%); border: 1px solid #d9e2dc !important; border-bottom: 0 !important; border-radius: 16px 16px 0 0; background: rgba(255,255,255,.95); box-shadow: 0 -10px 30px rgba(28,61,43,.1); backdrop-filter: blur(16px); }
        .recora-onboarding-polish [data-recora-grid] { display: grid !important; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px !important; }
        .recora-onboarding-polish [data-recora-card] { min-width: 0; padding: 15px !important; border-color: #dbe4de !important; border-radius: 15px !important; }
        .recora-onboarding-polish [data-recora-grid="persona"] > [data-recora-card]:nth-child(5) { grid-column: 1 / -1; width: calc(50% - 6px); justify-self: center; }
        .recora-onboarding-polish [data-recora-details] { grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 9px 14px !important; margin-top: 11px !important; padding-top: 11px !important; }
        .recora-detail-toggle { display: none; width: 100%; margin-top: 9px; padding: 8px 10px; border-radius: 9px; background: #f4f8f5; color: #365c48; font-size: 12px; font-weight: 700; text-align: left; }
        .recora-sheet-backdrop { position: fixed; inset: 0; z-index: 70; background: rgba(15,31,23,.4); backdrop-filter: blur(2px); }
        .recora-onboarding-polish [data-recora-sheet] { position: fixed !important; inset: 0 0 0 auto; z-index: 80; width: min(520px,92vw); max-height: none !important; margin: 0 !important; padding: 0 24px 28px !important; overflow-y: auto; border: 0 !important; border-radius: 20px 0 0 20px !important; background: #f8faf8 !important; box-shadow: -18px 0 54px rgba(16,40,27,.2); }
        .recora-onboarding-polish [data-recora-sheet-header] { position: sticky; top: 0; z-index: 2; margin: 0 -24px 8px; padding: 22px 70px 17px 24px; border-bottom: 1px solid #dbe4de; background: rgba(248,250,248,.97); backdrop-filter: blur(12px); }
        .recora-sheet-eyebrow { color: #648071; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
        .recora-sheet-heading { margin-top: 4px; color: #173d2c; font-size: 20px; font-weight: 700; }
        .recora-current-selection { display: grid; gap: 3px; margin-top: 13px; padding: 11px 13px; border: 1px solid #d7e2da; border-radius: 11px; background: #fff; }
        .recora-current-selection span { color: #708078; font-size: 11px; font-weight: 700; }
        .recora-current-selection strong { color: #294636; font-size: 14px; }
        .recora-sheet-description { margin-top: 10px; color: #66766d; font-size: 13px; line-height: 1.65; }
        .recora-onboarding-polish [data-recora-original-title] { display: none !important; }
        .recora-onboarding-polish [data-recora-sheet] > div:last-child { display: grid !important; grid-template-columns: 1fr !important; max-height: none !important; overflow: visible !important; }
        .recora-onboarding-polish [data-recora-sheet] > div:last-child > button { border-width: 0 0 1px !important; border-radius: 0 !important; padding: 14px 8px !important; background: transparent !important; }
        .recora-sheet-close { position: fixed; top: 17px; right: 17px; z-index: 90; display: flex; width: 40px; height: 40px; align-items: center; justify-content: center; border: 1px solid #d5dfd8; border-radius: 10px; background: #fff; color: #466255; box-shadow: 0 5px 18px rgba(25,53,37,.12); }
        .recora-sheet-close:focus-visible,.recora-detail-toggle:focus-visible { outline: 2px solid #2f7652; outline-offset: 2px; }
        .recora-undo-toast { position: fixed; left: 50%; bottom: 104px; z-index: 95; display: flex; width: min(calc(100% - 32px),520px); transform: translateX(-50%); align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #315945; border-radius: 11px; background: #173d2c; color: #fff; box-shadow: 0 12px 32px rgba(17,42,29,.24); font-size: 13px; }
        .recora-undo-toast span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .recora-undo-toast button { display: inline-flex; flex-shrink: 0; align-items: center; gap: 5px; padding: 7px 10px; border-radius: 8px; background: rgba(255,255,255,.12); font-weight: 700; }
        @media (min-width:1024px) {
          .recora-onboarding-polish [data-recora-progress] { position: relative; gap: 0 !important; margin-bottom: 16px !important; padding-inline: 10px; }
          .recora-onboarding-polish [data-recora-progress]::before { content:""; position:absolute; top:20px; left:6%; right:6%; height:1px; background:#d7e0da; }
          .recora-onboarding-polish [data-recora-progress] button { position:relative; z-index:1; flex-direction:column; justify-content:flex-start; gap:5px !important; min-height:60px; padding:3px !important; border:0 !important; border-radius:0 !important; background:transparent !important; text-align:center !important; }
          .recora-onboarding-polish [data-recora-progress] button > span:first-child { width:32px !important; height:32px !important; border:5px solid #f3f6f3; border-radius:999px !important; }
          .recora-onboarding-polish [data-recora-progress] button > span:last-child { max-width:150px; font-size:12px !important; }
        }
        @media (max-width:767px) {
          .recora-onboarding-polish main { padding-bottom: 170px; }
          .recora-onboarding-polish [data-recora-actions] { display:grid !important; grid-template-columns:auto minmax(0,1fr); gap:7px 10px !important; width:100%; padding:11px 15px calc(11px + env(safe-area-inset-bottom)) !important; border-inline:0 !important; border-radius:15px 15px 0 0; }
          .recora-onboarding-polish [data-recora-actions] > div { display:contents !important; }
          .recora-onboarding-polish [data-recora-action="back"] { grid-column:1; grid-row:1; }
          .recora-onboarding-polish [data-recora-action="primary"] { grid-column:2; grid-row:1; width:100%; }
          .recora-onboarding-polish [data-recora-action="review"] { grid-column:1 / -1; grid-row:2; width:100%; border:0 !important; background:transparent !important; color:#356048 !important; }
          .recora-onboarding-polish [data-recora-grid] { grid-template-columns:1fr; }
          .recora-onboarding-polish [data-recora-grid="persona"] > [data-recora-card]:nth-child(5) { grid-column:auto; width:auto; }
          .recora-onboarding-polish [data-recora-details] { grid-template-columns:1fr !important; }
          .recora-onboarding-polish [data-recora-card="persona"] [data-recora-details] > :nth-child(n+3),.recora-onboarding-polish [data-recora-card="topic"] [data-recora-details] > :nth-child(2) { display:none; }
          .recora-onboarding-polish [data-recora-card][data-recora-details-open="true"] [data-recora-details] > * { display:block !important; }
          .recora-detail-toggle { display:block; }
          .recora-onboarding-polish [data-recora-sheet] { inset:10vh 0 0 0; width:100%; max-height:90vh !important; padding:0 18px calc(24px + env(safe-area-inset-bottom)) !important; border-radius:20px 20px 0 0 !important; box-shadow:0 -18px 48px rgba(16,40,27,.22); }
          .recora-onboarding-polish [data-recora-sheet-header] { margin:0 -18px 8px; padding:19px 62px 15px 18px; }
          .recora-sheet-close { top:calc(10vh + 13px); right:13px; }
          .recora-undo-toast { bottom:132px; }
        }
      `}</style>
    </div>
  );
}
