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
              viewBox="0 0 110 111"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 0 L21 0 L55 34 L89 0 L109 0 L55 54 Z"
                fill="currentColor"
              />
              <path
                d="M1 46 L21 46 L55 80 L89 46 L109 46 L55 100 Z"
                fill="currentColor"
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
