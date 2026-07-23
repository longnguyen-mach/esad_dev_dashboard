"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  findCurrentScheduleTaskId,
  type DsbScheduleRevision,
} from "../lib/dsb-schedule";

type ScheduleHoverLabelProps = {
  label: string;
  href?: string;
  revisions: DsbScheduleRevision[];
  /** When set, popup highlight matches the Current Task display value. */
  currentTaskId?: number;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CurrentWorkArrow() {
  return (
    <span className="schedule-current-arrow" aria-hidden="true">
      <svg viewBox="0 0 28 20" width="28" height="20" focusable="false">
        <path
          className="schedule-current-arrow-shaft"
          d="M2 10h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="schedule-current-arrow-head"
          d="M16 3.5 25 10l-9 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <em>Now</em>
    </span>
  );
}

export function ScheduleHoverLabel({
  label,
  href,
  revisions,
  currentTaskId: currentTaskIdProp,
}: ScheduleHoverLabelProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const currentItemRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const currentTaskId =
    currentTaskIdProp ?? findCurrentScheduleTaskId(revisions);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function placePanel() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.min(420, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      Math.max(12, window.innerWidth - panelWidth - 12),
    );
    setCoords({
      top: Math.min(rect.bottom + 10, window.innerHeight - 24),
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
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    setMounted(true);
    return () => clearCloseTimer();
  }, []);

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

  useEffect(() => {
    if (!open || currentTaskId == null) return;
    currentItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [open, currentTaskId]);

  const labelNode = href ? (
    <a
      className="metric-link task-hover-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={open ? panelId : undefined}
      aria-expanded={open}
    >
      {label}
    </a>
  ) : (
    <span
      className="task-hover-link"
      aria-describedby={open ? panelId : undefined}
      aria-expanded={open}
    >
      {label}
    </span>
  );

  const popover =
    mounted &&
    createPortal(
      <div
        id={panelId}
        className={`task-hover-popover task-hover-popover--schedule${open ? " is-open" : ""}`}
        style={{ top: coords.top, left: coords.left }}
        role="tooltip"
        onMouseEnter={showPanel}
        onMouseLeave={hidePanelSoon}
      >
        <header className="task-hover-header">
          <span>DSB schedule</span>
          <strong>{revisions.length}</strong>
        </header>

        {revisions.length === 0 ? (
          <p className="task-hover-empty">No Rev A / Rev B schedule found</p>
        ) : (
          <div className="schedule-revision-stack">
            {revisions.map((revision, revisionIndex) => {
              const revisionHasCurrent = revision.tasks.some(
                (task) => task.id === currentTaskId,
              );

              return (
                <section
                  key={revision.id}
                  className={`schedule-revision${revisionHasCurrent ? " is-current" : ""}`}
                  style={{ animationDelay: `${70 + revisionIndex * 60}ms` }}
                >
                  <header className="schedule-revision-header">
                    <a
                      className="schedule-revision-title"
                      href={revision.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {revision.name}
                    </a>
                    <span>
                      {formatDate(revision.start)} → {formatDate(revision.finish)}
                    </span>
                  </header>

                  <ul className="task-hover-list">
                    {revision.tasks.map((task, taskIndex) => {
                      const isCurrent = task.id === currentTaskId;

                      return (
                        <li
                          key={task.id}
                          ref={isCurrent ? currentItemRef : undefined}
                          className={`task-hover-item${isCurrent ? " is-current-work" : ""}`}
                          style={{
                            animationDelay: `${110 + revisionIndex * 60 + taskIndex * 40}ms`,
                          }}
                        >
                          {isCurrent ? <CurrentWorkArrow /> : null}
                          <div className="schedule-task-body">
                            <a
                              className="task-hover-key"
                              href={task.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {task.name}
                              {isCurrent ? (
                                <span className="visually-hidden"> (current work)</span>
                              ) : null}
                            </a>
                            <div className="task-hover-meta">
                              <span>
                                <em>Start</em>
                                {formatDate(task.start)}
                              </span>
                              <span>
                                <em>Finish</em>
                                {formatDate(task.finish)}
                              </span>
                              <span>
                                <em>Assignee</em>
                                {task.assignee || "Unassigned"}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>,
      document.body,
    );

  return (
    <span
      ref={triggerRef}
      className={`task-hover-trigger task-hover-trigger--schedule${open ? " is-open" : ""}`}
      onMouseEnter={showPanel}
      onMouseLeave={hidePanelSoon}
      onFocus={showPanel}
      onBlur={hidePanelSoon}
    >
      {labelNode}
      {popover}
    </span>
  );
}
