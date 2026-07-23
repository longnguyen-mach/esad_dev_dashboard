export const DSB_SHEET_ID = "1RbnLe7FBrnT1njFWnsVyW74Iq2N5miTH9vFmRwagzps";
export const DSB_SHEET_EDIT_URL =
  `https://docs.google.com/spreadsheets/d/${DSB_SHEET_ID}/edit?usp=drive_link`;
export const DSB_SHEET_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${DSB_SHEET_ID}/export?format=csv`;

const DONE_STATUSES = new Set([
  "done",
  "closed",
  "resolved",
  "complete",
  "completed",
]);

/** Google Sheet column D (0-based index 3). */
const LABELS_COLUMN_D_INDEX = 3;

export type DsbOverdueItem = {
  key: string;
  labels: string;
  assignee: string;
  dueDate: string;
};

export type DsbTaskStats = {
  openTasks: number;
  doneTasks: number;
  totalTasks: number;
  /** Incomplete tasks whose Due date is before today. */
  overdueTasks: number;
  /** Open tasks that have a Due date set. */
  openTasksWithDueDate: number;
  /** Overdue rows with Key / Labels / Assignee for hover details. */
  overdueItems: DsbOverdueItem[];
  /** Share of tasks in Done (0-100). Fill for the Open tasks status bar. */
  completionPercent: number;
  /** Share of dated open tasks that are overdue (0-100). */
  overduePercent: number;
  syncedAt: string | null;
};

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
  // Prefer header match, but always fall back to Column D for Labels.
  const labelsHeaderIndex = headers.indexOf("labels");
  const labelsIndex =
    labelsHeaderIndex >= 0 ? labelsHeaderIndex : LABELS_COLUMN_D_INDEX;

  if (statusIndex < 0) {
    throw new Error("DSB sheet is missing a Status column");
  }

  let openTasks = 0;
  let doneTasks = 0;
  let openTasksWithDueDate = 0;
  const overdueItems: DsbOverdueItem[] = [];
  let latestUpdate: Date | null = null;
  const today = startOfLocalDay(now);

  for (const row of rows.slice(1)) {
    const status = (row[statusIndex] ?? "").trim().toLowerCase();
    const isDone = DONE_STATUSES.has(status);
    if (isDone) {
      doneTasks += 1;
    } else {
      openTasks += 1;
    }

    if (dueDateIndex >= 0 && !isDone) {
      const dueDate = parseSheetDate(row[dueDateIndex] ?? "");
      if (dueDate) {
        openTasksWithDueDate += 1;
        if (startOfLocalDay(dueDate) < today) {
          // Labels always come from Column D in the DSB sheet export.
          const labelsFromColumnD = (row[LABELS_COLUMN_D_INDEX] ?? "").trim();
          overdueItems.push({
            key: (keyIndex >= 0 ? row[keyIndex] : "").trim() || "Unknown",
            labels:
              labelsFromColumnD ||
              (labelsIndex >= 0 ? row[labelsIndex] : "").trim(),
            assignee: (assigneeIndex >= 0 ? row[assigneeIndex] : "").trim(),
            dueDate: formatSyncDate(dueDate),
          });
        }
      }
    }

    if (updatedIndex >= 0) {
      const updated = parseSheetDate(row[updatedIndex] ?? "");
      if (updated && (!latestUpdate || updated > latestUpdate)) {
        latestUpdate = updated;
      }
    }
  }

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
    overdueItems,
    completionPercent,
    overduePercent,
    syncedAt: latestUpdate ? formatSyncDate(latestUpdate) : null,
  };
}

export async function fetchDsbTaskStats(
  fetchImpl: typeof fetch = fetch,
): Promise<DsbTaskStats | null> {
  try {
    const response = await fetchImpl(DSB_SHEET_CSV_URL, {
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
