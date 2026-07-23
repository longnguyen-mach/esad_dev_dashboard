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

export type DsbTaskStats = {
  openTasks: number;
  doneTasks: number;
  totalTasks: number;
  /** Share of tasks in Done (0-100). Fill for the Open tasks status bar. */
  completionPercent: number;
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

  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/,
  );
  if (!match) return null;

  const [, month, day, year, hour = "0", minute = "0", second = "0"] = match;
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

export function countOpenTasksFromCsv(csvText: string): DsbTaskStats {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      openTasks: 0,
      doneTasks: 0,
      totalTasks: 0,
      completionPercent: 0,
      syncedAt: null,
    };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const statusIndex = headers.indexOf("status");
  const updatedIndex = headers.indexOf("updated");

  if (statusIndex < 0) {
    throw new Error("DSB sheet is missing a Status column");
  }

  let openTasks = 0;
  let doneTasks = 0;
  let latestUpdate: Date | null = null;

  for (const row of rows.slice(1)) {
    const status = (row[statusIndex] ?? "").trim().toLowerCase();
    if (DONE_STATUSES.has(status)) {
      doneTasks += 1;
    } else {
      openTasks += 1;
    }

    if (updatedIndex >= 0) {
      const updated = parseSheetDate(row[updatedIndex] ?? "");
      if (updated && (!latestUpdate || updated > latestUpdate)) {
        latestUpdate = updated;
      }
    }
  }

  const totalTasks = rows.length - 1;
  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 1000) / 10;

  return {
    openTasks,
    doneTasks,
    totalTasks,
    completionPercent,
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
