"use client";

import { AdminLogin } from "./admin-login";
import { ProgramConfigWindow } from "./program-config-window";
import { useProgramConfig } from "./program-config-store";

type HeroHeaderProps = {
  adminUsername: string;
  adminPassword: string;
};

export function HeroHeader({
  adminUsername,
  adminPassword,
}: HeroHeaderProps) {
  const programConfig = useProgramConfig();

  return (
    <>
      <div className="admin-toolbar">
        <ProgramConfigWindow config={programConfig} />
        <AdminLogin username={adminUsername} password={adminPassword} />
      </div>
      <header className="hero-header">
        <h1>{programConfig.dashboardName}</h1>
        <div className="hero-subtitle">
          <span />
          {programConfig.programLead}
          <span />
        </div>
      </header>
    </>
  );
}
