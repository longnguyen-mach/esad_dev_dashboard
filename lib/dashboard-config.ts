import { AVIONICS_MASTER_SCHEDULE_PERMALINK } from "./esad-projects.ts";
import type { EsadProjectCode } from "./esad-projects.ts";

/** Dashboard slot IDs: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right. */
export type DashboardId = "1" | "2" | "3" | "4";

export type DashboardConfig = {
  /** Internal slot id — not shown in the editable Configuration Window text. */
  dashboardId: DashboardId;
  responsibleEngineer: string;
  boardName: string;
  boardNickname: string;
  jiraEpicLink: string;
  smartsheetLink: string;
};

/** Default admin credentials (override with ADMIN_USERNAME / ADMIN_PASSWORD). */
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "esad";

export function getAdminCredentials(): { username: string; password: string } {
  const username =
    process.env.ADMIN_USERNAME?.trim() ||
    (globalThis as { ADMIN_USERNAME?: string }).ADMIN_USERNAME?.trim() ||
    DEFAULT_ADMIN_USERNAME;
  const password =
    process.env.ADMIN_PASSWORD?.trim() ||
    (globalThis as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD?.trim() ||
    DEFAULT_ADMIN_PASSWORD;
  return { username, password };
}

/**
 * Per-dashboard configuration.
 * Layout: #1 top-left, #2 top-right, #3 bottom-left, #4 bottom-right.
 * Quoted values in the Configuration Window populate each card.
 */
export const DASHBOARD_CONFIGS: Record<DashboardId, DashboardConfig> = {
  "1": {
    dashboardId: "1",
    responsibleEngineer: "Bruno Abousleiman",
    boardName: "Digital Safety Board",
    boardNickname: "DSB",
    jiraEpicLink: "https://mach-industries.atlassian.net/browse/EE-2220",
    smartsheetLink: AVIONICS_MASTER_SCHEDULE_PERMALINK,
  },
  "2": {
    dashboardId: "2",
    responsibleEngineer: "Bruno Abousleiman",
    boardName: "High Voltage Fireset Board",
    boardNickname: "HVFB",
    jiraEpicLink: "",
    smartsheetLink: AVIONICS_MASTER_SCHEDULE_PERMALINK,
  },
  "3": {
    dashboardId: "3",
    responsibleEngineer: "Shane Olson",
    boardName: "CPLD - Primary",
    boardNickname: "PRI",
    jiraEpicLink: "",
    smartsheetLink: AVIONICS_MASTER_SCHEDULE_PERMALINK,
  },
  "4": {
    dashboardId: "4",
    responsibleEngineer: "Gary Mejia Martinez",
    boardName: "CPLD - Independent",
    boardNickname: "IND",
    jiraEpicLink: "",
    smartsheetLink: AVIONICS_MASTER_SCHEDULE_PERMALINK,
  },
};

export const DASHBOARD_ID_BY_CODE: Record<EsadProjectCode, DashboardId> = {
  DSB: "1",
  HVFB: "2",
  PRI: "3",
  IND: "4",
};

/** Text-based configuration content shown/edited in the Configuration Window. */
export function formatDashboardConfigText(config: DashboardConfig): string {
  return [
    `Responsible Engineer: "${config.responsibleEngineer}"`,
    `Board Name: "${config.boardName}"`,
    `Board Nickname: "${config.boardNickname}"`,
    `JIRA Epic Link: "${config.jiraEpicLink}"`,
    `Smartsheet Link: "${config.smartsheetLink}"`,
  ].join("\n");
}

function readQuotedField(text: string, label: string): string | null {
  const pattern = new RegExp(
    `${label}:\\s*"([^"]*)"`,
    "i",
  );
  const match = text.match(pattern);
  return match ? match[1] : null;
}

/**
 * Parse editable Configuration Window text back into a config object.
 * Dash Board ID is not part of the editable text and is preserved from `base`.
 */
export function parseDashboardConfigText(
  text: string,
  base: DashboardConfig,
): { config: DashboardConfig } | { error: string } {
  const responsibleEngineer = readQuotedField(text, "Responsible Engineer");
  const boardName = readQuotedField(text, "Board Name");
  const boardNickname = readQuotedField(text, "Board Nickname");
  const jiraEpicLink = readQuotedField(text, "JIRA Epic Link");
  const smartsheetLink = readQuotedField(text, "Smartsheet Link");

  if (
    responsibleEngineer == null ||
    boardName == null ||
    boardNickname == null ||
    jiraEpicLink == null ||
    smartsheetLink == null
  ) {
    return {
      error:
        'Keep each field on its own line as Label: "value" (Board Name, Board Nickname, Responsible Engineer, JIRA Epic Link, Smartsheet Link).',
    };
  }

  if (!boardName.trim()) {
    return { error: "Board Name cannot be empty." };
  }
  if (!boardNickname.trim()) {
    return { error: "Board Nickname cannot be empty." };
  }

  return {
    config: {
      dashboardId: base.dashboardId,
      responsibleEngineer: responsibleEngineer.trim(),
      boardName: boardName.trim(),
      boardNickname: boardNickname.trim(),
      jiraEpicLink: jiraEpicLink.trim(),
      smartsheetLink: smartsheetLink.trim(),
    },
  };
}

export function getDashboardConfigForCode(
  code: EsadProjectCode,
): DashboardConfig {
  return DASHBOARD_CONFIGS[DASHBOARD_ID_BY_CODE[code]];
}
