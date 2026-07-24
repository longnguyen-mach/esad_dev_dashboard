import {
  ESAD_PROJECT_INTEGRATIONS,
  googleSheetCsvUrl,
  googleSheetEditUrl,
} from "./esad-projects.ts";

export const DSB_SHEET_ID =
  ESAD_PROJECT_INTEGRATIONS.DSB.googleSheetId ??
  "1RbnLe7FBrnT1njFWnsVyW74Iq2N5miTH9vFmRwagzps";
export const DSB_SHEET_EDIT_URL = googleSheetEditUrl(DSB_SHEET_ID);
export const DSB_SHEET_CSV_URL = googleSheetCsvUrl(DSB_SHEET_ID);
export const DSB_JIRA_BROWSE_BASE_URL = "https://mach.atlassian.net/browse";

export function jiraIssueUrl(key: string): string {
  const trimmed = key.trim();
  return `${DSB_JIRA_BROWSE_BASE_URL}/${encodeURIComponent(trimmed)}`;
}

const DONE_STATUSES = new Set([
  "done",
  "closed",
  "resolved",
  "complete",
  "completed",
]);

/** Google Sheet column C (0-based index 2) — Summary. */
const SUMMARY_COLUMN_C_INDEX = 2;

export type DsbTaskItem = {
  key: string;
  summary: string;
  assignee: string;
  dueDate?: string;
};

/** @deprecated Use DsbTaskItem */
export type DsbOverdueItem = DsbTaskItem;

export type DsbTaskStats = {
  openTasks: number;
  doneTasks: number;
  totalTasks: number;
  /** Incomplete tasks whose Due date is before today. */
  overdueTasks: number;
  /** Open tasks that have a Due date set. */
  openTasksWithDueDate: number;
  /** Open rows with Key / Summary / Assignee for hover details. */
  openItems: DsbTaskItem[];
  /** Overdue rows with Key / Summary / Assignee for hover details. */
  overdueItems: DsbTaskItem[];
  /** Share of tasks in Done (0-100). Fill for the Open Tasks status bar. */
  completionPercent: number;
  /** Share of dated open tasks that are overdue (0-100). */
  overduePercent: number;
  syncedAt: string | null;
};

export type DsbIndicatorStatus = "On track" | "At risk" | "Critical";

/**
 * Indicator lights from overdue count:
 * green (On track) when overdue is 0-2,
 * yellow (At risk) when overdue > 2,
 * red (Critical) when overdue > 5.
 */
export function statusFromOverdueCount(overdueTasks: number): DsbIndicatorStatus {
  if (overdueTasks > 5) return "Critical";
  if (overdueTasks > 2) return "At risk";
  return "On track";
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

function parseSheetDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const slashMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/,
  );
  if (slashMatch) {
    const [, month, day, year, hour = "0", minute = "0", second = "0"] =
      slashMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (isoMatch) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] =
      isoMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatSyncDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function countOpenTasksFromCsv(
  csvText: string,
  now: Date = new Date(),
): DsbTaskStats {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      openTasks: 0,
      doneTasks: 0,
      totalTasks: 0,
      overdueTasks: 0,
      openTasksWithDueDate: 0,
      openItems: [],
      overdueItems: [],
      completionPercent: 0,
      overduePercent: 0,
      syncedAt: null,
    };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const statusIndex = headers.indexOf("status");
  const updatedIndex = headers.indexOf("updated");
  const dueDateIndex = headers.indexOf("due date");
  const keyIndex = headers.indexOf("key");
  const assigneeIndex = headers.indexOf("assignee");
  // Prefer header match, but always fall back to Column C for Summary.
  const summaryHeaderIndex = headers.indexOf("summary");
  const summaryIndex =
    summaryHeaderIndex >= 0 ? summaryHeaderIndex : SUMMARY_COLUMN_C_INDEX;

  if (statusIndex < 0) {
    throw new Error("DSB sheet is missing a Status column");
  }

  let doneTasks = 0;
  let openTasksWithDueDate = 0;
  const openItems: DsbTaskItem[] = [];
  const overdueItems: DsbTaskItem[] = [];
  let latestUpdate: Date | null = null;
  const today = startOfLocalDay(now);

  for (const row of rows.slice(1)) {
    const status = (row[statusIndex] ?? "").trim().toLowerCase();
    const isDone = DONE_STATUSES.has(status);

    if (updatedIndex >= 0) {
      const updated = parseSheetDate(row[updatedIndex] ?? "");
      if (updated && (!latestUpdate || updated > latestUpdate)) {
        latestUpdate = updated;
      }
    }

    if (isDone) {
      doneTasks += 1;
      continue;
    }

    const summaryFromColumnC = (row[SUMMARY_COLUMN_C_INDEX] ?? "").trim();
    const item: DsbTaskItem = {
      key: (keyIndex >= 0 ? row[keyIndex] : "").trim() || "Unknown",
      summary:
        summaryFromColumnC ||
        (summaryIndex >= 0 ? row[summaryIndex] : "").trim(),
      assignee: (assigneeIndex >= 0 ? row[assigneeIndex] : "").trim(),
    };
    openItems.push(item);

    if (dueDateIndex >= 0) {
      const dueDate = parseSheetDate(row[dueDateIndex] ?? "");
      if (dueDate) {
        openTasksWithDueDate += 1;
        if (startOfLocalDay(dueDate) < today) {
          overdueItems.push({
            ...item,
            dueDate: formatSyncDate(dueDate),
          });
        }
      }
    }
  }

  const openTasks = openItems.length;
  const totalTasks = rows.length - 1;
  const overdueTasks = overdueItems.length;
  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 1000) / 10;
  const overduePercent =
    openTasksWithDueDate === 0
      ? 0
      : Math.round((overdueTasks / openTasksWithDueDate) * 1000) / 10;

  return {
    openTasks,
    doneTasks,
    totalTasks,
    overdueTasks,
    openTasksWithDueDate,
    openItems,
    overdueItems,
    completionPercent,
    overduePercent,
    syncedAt: latestUpdate ? formatSyncDate(latestUpdate) : null,
  };
}

export async function fetchProjectTaskStats(
  sheetId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DsbTaskStats | null> {
  try {
    const response = await fetchImpl(googleSheetCsvUrl(sheetId), {
      headers: {
        Accept: "text/csv,text/plain,*/*",
        "User-Agent": "mach-esad-dashboard/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const csvText = await response.text();
    if (!csvText.trim() || csvText.includes("<!DOCTYPE html>")) {
      return null;
    }

    return countOpenTasksFromCsv(csvText);
  } catch {
    return null;
  }
}

export async function fetchDsbTaskStats(
  fetchImpl: typeof fetch = fetch,
): Promise<DsbTaskStats | null> {
  return fetchProjectTaskStats(DSB_SHEET_ID, fetchImpl);
}

/** Fetch Google Sheet task stats for every configured ESAD board. */
export async function fetchAllProjectTaskStats(
  fetchImpl: typeof fetch = fetch,
): Promise<Partial<Record<"DSB" | "HVFB" | "PRI" | "IND", DsbTaskStats>>> {
  const entries = await Promise.all(
    (Object.values(ESAD_PROJECT_INTEGRATIONS) as Array<{
      code: "DSB" | "HVFB" | "PRI" | "IND";
      googleSheetId: string | null;
    }>).map(async (project) => {
      if (!project.googleSheetId) return [project.code, null] as const;
      const stats = await fetchProjectTaskStats(project.googleSheetId, fetchImpl);
      return [project.code, stats] as const;
    }),
  );

  const result: Partial<Record<"DSB" | "HVFB" | "PRI" | "IND", DsbTaskStats>> =
    {};
  for (const [code, stats] of entries) {
    if (stats) result[code] = stats;
  }
  return result;
}
