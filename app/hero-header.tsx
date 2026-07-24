"use client";

import { AdminAccountPanel } from "./admin-account-panel";
import { AdminLogin } from "./admin-login";
import { ProgramConfigWindow } from "./program-config-window";
import { ThemePicker } from "./theme-picker";
import { useProgramConfig } from "./program-config-store";
import { useThemeState } from "./theme-store";

type HeroHeaderProps = {
  adminUsername: string;
  adminPassword: string;
};

export function HeroHeader({
  adminUsername,
  adminPassword,
}: HeroHeaderProps) {
  const programConfig = useProgramConfig();
  // Keep theme subscription mounted so document theme applies for all users.
  useThemeState();

  return (
    <>
      <div className="admin-toolbar">
        <ThemePicker />
        <ProgramConfigWindow config={programConfig} />
        <AdminAccountPanel fallbackPassword={adminPassword} />
        <AdminLogin username={adminUsername} password={adminPassword} />
      </div>
      <header className="hero-header">
        <div className="hero-title-row">
          <span className="hero-logo" role="img" aria-label="Mach Industries">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <rect
                className="hero-logo-plate"
                width="100"
                height="100"
                fill="currentColor"
              />
              <path
                className="hero-logo-mark"
                fill="none"
                stroke="currentColor"
                strokeWidth="11"
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M22 28 L50 56 L78 28"
              />
              <path
                className="hero-logo-mark"
                fill="none"
                stroke="currentColor"
                strokeWidth="11"
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M22 48 L50 76 L78 48"
              />
            </svg>
          </span>
          <h1>{programConfig.dashboardName}</h1>
        </div>
        <div className="hero-subtitle">
          <span />
          {programConfig.programLead}
          <span />
        </div>
      </header>
    </>
  );
}
