"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminAuthenticated } from "./admin-auth";
import { writeDashboardConfig } from "./dashboard-config-store";
import type { DashboardConfig } from "../lib/dashboard-config";
import {
  formatDashboardConfigText,
  parseDashboardConfigText,
} from "../lib/dashboard-config";

type ConfigWindowProps = {
  config: DashboardConfig;
};

export function ConfigWindow({ config }: ConfigWindowProps) {
  const authenticated = useAdminAuthenticated();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(() => formatDashboardConfigText(config));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated) setOpen(false);
  }, [authenticated]);

  useEffect(() => {
    if (!open) return;
    setDraft(formatDashboardConfigText(config));
    setError(null);
    setSaved(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, config]);

  function handleSave() {
    const parsed = parseDashboardConfigText(draft, config);
    if ("error" in parsed) {
      setError(parsed.error);
      setSaved(false);
      return;
    }
    writeDashboardConfig(parsed.config);
    setDraft(formatDashboardConfigText(parsed.config));
    setError(null);
    setSaved(true);
  }

  if (!authenticated) return null;

  return (
    <>
      <button
        type="button"
        className="config-window-trigger"
        onClick={() => setOpen(true)}
      >
        Configuration
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
                className="config-window"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className="config-window-header">
                  <div>
                    <p className="config-window-kicker">Configuration Window</p>
                    <h3 id={titleId}>
                      {config.boardNickname} · editable card fields
                    </h3>
                  </div>
                  <div className="config-window-actions">
                    <button
                      type="button"
                      className="config-window-save"
                      onClick={handleSave}
                    >
                      Save
                    </button>
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
                  Edit values inside quotes. Board Nickname, Board Name, and
                  Responsible Engineer update the card.
                </p>
                <textarea
                  className="config-window-editor"
                  value={draft}
                  spellCheck={false}
                  aria-label={`Configuration for ${config.boardNickname}`}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSaved(false);
                    setError(null);
                  }}
                />
                {error ? <p className="config-window-error">{error}</p> : null}
                {saved ? (
                  <p className="config-window-saved">Configuration saved</p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
