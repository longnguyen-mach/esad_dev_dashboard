"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { DsbOverdueItem } from "../lib/dsb-tasks";

type OverdueHoverLabelProps = {
  label: string;
  href?: string;
  items: DsbOverdueItem[];
};

function formatLabels(labels: string): string {
  // Preserve Column D label tokens (commonly semicolon-separated in the sheet).
  const cleaned = labels
    .split(/[;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : "No labels";
}

export function OverdueHoverLabel({
  label,
  href,
  items,
}: OverdueHoverLabelProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function placePanel() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const panelWidth = 320;
    const left = Math.min(
      Math.max(12, rect.left),
      Math.max(12, window.innerWidth - panelWidth - 12),
    );
    setCoords({
      top: rect.bottom + 10,
      left,
    });
  }

  function showPanel() {
    clearCloseTimer();
    placePanel();
    setOpen(true);
  }

  function hidePanelSoon() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    if (!open) return;

    function onScrollOrResize() {
      placePanel();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const labelNode = href ? (
    <a
      className="metric-link overdue-trigger-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={open ? panelId : undefined}
    >
      {label}
    </a>
  ) : (
    <span className="overdue-trigger-link" aria-describedby={open ? panelId : undefined}>
      {label}
    </span>
  );

  return (
    <span
      ref={triggerRef}
      className={`overdue-trigger${open ? " is-open" : ""}`}
      onMouseEnter={showPanel}
      onMouseLeave={hidePanelSoon}
      onFocus={showPanel}
      onBlur={hidePanelSoon}
    >
      {labelNode}

      <div
        id={panelId}
        className={`overdue-popover${open ? " is-open" : ""}`}
        style={{ top: coords.top, left: coords.left }}
        role="tooltip"
        onMouseEnter={showPanel}
        onMouseLeave={hidePanelSoon}
      >
        <header className="overdue-popover-header">
          <span>Overdue items</span>
          <strong>{items.length}</strong>
        </header>

        {items.length === 0 ? (
          <p className="overdue-popover-empty">No overdue tasks</p>
        ) : (
          <ul className="overdue-popover-list">
            {items.map((item, index) => (
              <li
                key={item.key}
                className="overdue-popover-item"
                style={{ animationDelay: `${80 + index * 55}ms` }}
              >
                <div className="overdue-item-key">{item.key}</div>
                <div className="overdue-item-meta">
                  <span>
                    <em>Labels</em>
                    {formatLabels(item.labels)}
                  </span>
                  <span>
                    <em>Assignee</em>
                    {item.assignee || "Unassigned"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </span>
  );
}
