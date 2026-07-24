"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminAuthenticated } from "./admin-auth";
import { useThemeState, writeThemeSelection } from "./theme-store";
import { THEME_OPTIONS, type ThemeId } from "../lib/themes";

export function ThemePicker() {
  const authenticated = useAdminAuthenticated();
  const theme = useThemeState();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated) setOpen(false);
  }, [authenticated]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!authenticated) return null;

  return (
    <>
      <button
        type="button"
        className="config-window-trigger"
        onClick={() => setOpen(true)}
      >
        Themes
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="config-window-backdrop"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div
                className="config-window theme-picker-window"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className="config-window-header">
                  <div>
                    <p className="config-window-kicker">Appearance</p>
                    <h3 id={titleId}>Dashboard Themes</h3>
                  </div>
                  <div className="config-window-actions">
                    <button
                      type="button"
                      className="config-window-close"
                      onClick={() => setOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </header>
                <p className="config-window-help">
                  Themes change look and feel only. Layout and card format stay
                  the same.
                </p>
                <ul className="theme-picker-list">
                  {THEME_OPTIONS.map((option) => {
                    const selected = theme.selection === option.id;
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          className={`theme-picker-option${
                            selected ? " theme-picker-option--active" : ""
                          }`}
                          aria-pressed={selected}
                          onClick={() => {
                            writeThemeSelection(option.id as ThemeId);
                          }}
                        >
                          <strong>{option.label}</strong>
                          <span>{option.description}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
