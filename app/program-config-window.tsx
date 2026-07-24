"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminAuthenticated } from "./admin-auth";
import { writeProgramConfig } from "./program-config-store";
import type { ProgramConfig } from "../lib/program-config";
import {
  formatProgramConfigText,
  parseProgramConfigText,
  validateProgramConfigSyntax,
} from "../lib/program-config";

type ProgramConfigWindowProps = {
  config: ProgramConfig;
};

export function ProgramConfigWindow({ config }: ProgramConfigWindowProps) {
  const authenticated = useAdminAuthenticated();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(() => formatProgramConfigText(config));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const titleId = useId();
  const errorId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated) setOpen(false);
  }, [authenticated]);

  useEffect(() => {
    if (!open) return;
    const nextDraft = formatProgramConfigText(config);
    setDraft(nextDraft);
    setErrors(validateProgramConfigSyntax(nextDraft));
    setSaved(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, config]);

  function handleDraftChange(value: string) {
    setDraft(value);
    setSaved(false);
    setErrors(validateProgramConfigSyntax(value));
  }

  function handleSave() {
    const syntaxErrors = validateProgramConfigSyntax(draft);
    if (syntaxErrors.length > 0) {
      setErrors(syntaxErrors);
      setSaved(false);
      return;
    }

    const parsed = parseProgramConfigText(draft);
    if ("error" in parsed) {
      setErrors(parsed.errors);
      setSaved(false);
      return;
    }

    writeProgramConfig(parsed.config);
    const savedText = formatProgramConfigText(parsed.config);
    setDraft(savedText);
    setErrors([]);
    setSaved(true);
  }

  if (!authenticated) return null;

  const hasSyntaxErrors = errors.length > 0;

  return (
    <>
      <button
        type="button"
        className="config-window-trigger"
        onClick={() => setOpen(true)}
      >
        Dashboard Configuration
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
                aria-describedby={hasSyntaxErrors ? errorId : undefined}
              >
                <header className="config-window-header">
                  <div>
                    <p className="config-window-kicker">
                      Dashboard Configuration
                    </p>
                    <h3 id={titleId}>Hero title and program lead</h3>
                  </div>
                  <div className="config-window-actions">
                    <button
                      type="button"
                      className="config-window-save"
                      onClick={handleSave}
                      disabled={hasSyntaxErrors}
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
                  Each value must be inside quotes, e.g. Dashboard Name: "MACH
                  ESAD Development Dashboard".
                </p>
                <textarea
                  className={`config-window-editor${
                    hasSyntaxErrors ? " config-window-editor--error" : ""
                  }`}
                  value={draft}
                  spellCheck={false}
                  aria-invalid={hasSyntaxErrors}
                  aria-label="Dashboard Configuration"
                  onChange={(event) => handleDraftChange(event.target.value)}
                />
                {hasSyntaxErrors ? (
                  <ul
                    id={errorId}
                    className="config-window-errors"
                    role="alert"
                  >
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
                {saved && !hasSyntaxErrors ? (
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
