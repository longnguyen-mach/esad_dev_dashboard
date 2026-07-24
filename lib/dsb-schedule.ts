import { getSmartsheetSheet } from "./smartsheet.ts";

export const AVIONICS_MASTER_SCHEDULE_SHEET_ID = 2069122061913988;
export const DSB_SCHEDULE_TASK_NAME = "Digital Safety Board (DSB)";

const COLUMN = {
  taskName: 5067326880960388,
  start: 7319126694645636,
  finish: 1689627160432516,
  percentComplete: 282252276879236,
  status: 4785851904249732,
  assignee: 3941426974117764,
} as const;

export type DsbScheduleTask = {
  id: number;
  name: string;
  start: string | null;
  finish: string | null;
  percentComplete: number | null;
  status: string | null;
  assignee: string | null;
  permalink: string;
};

export type DsbScheduleRevision = {
  id: number;
  name: string;
  start: string | null;
  finish: string | null;
  assignee: string | null;
  permalink: string;
  tasks: DsbScheduleTask[];
};

export type DsbScheduleStats = {
  taskName: string;
  href: string;
  revisionCount: number;
  revisions: DsbScheduleRevision[];
  currentTask: DsbScheduleTask | null;
  nextTask: DsbScheduleTask | null;
  overallProgressPercent: number;
  syncedAt: string | null;
};

type SmartsheetCell = {
  columnId: number;
  value?: unknown;
  displayValue?: string;
};

type SmartsheetRow = {
  id: number;
  parentId?: number;
  rowNumber?: number;
  permalink?: string;
  cells?: SmartsheetCell[];
};

function cellValue(row: SmartsheetRow, columnId: number): string | null {
  const cell = row.cells?.find((entry) => entry.columnId === columnId);
  if (!cell) return null;
  if (cell.displayValue != null && String(cell.displayValue).trim() !== "") {
    return String(cell.displayValue);
  }
  if (cell.value == null) return null;
  return String(cell.value);
}

function parsePercent(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace("%", "").trim();
  const num = Number(match);
  return Number.isFinite(num) ? num : null;
}

function formatSyncDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
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

function progressFromDates(
  start: string | null,
  finish: string | null,
  now: Date,
): number {
  if (!start || !finish) return 0;
  const startMs = Date.parse(start);
  const finishMs = Date.parse(finish);
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs) || finishMs <= startMs) {
    return 0;
  }
  const ratio = (now.getTime() - startMs) / (finishMs - startMs);
  return Math.round(Math.max(0, Math.min(100, ratio * 1000))) / 10;
}

function rowPermalink(sheetPermalink: string, rowId: number, existing?: string) {
  if (existing) return existing;
  return `${sheetPermalink}?rowId=${rowId}`;
}

function toScheduleTask(
  row: SmartsheetRow,
  sheetPermalink: string,
): DsbScheduleTask {
  return {
    id: row.id,
    name: cellValue(row, COLUMN.taskName) ?? "Untitled task",
    start: cellValue(row, COLUMN.start),
    finish: cellValue(row, COLUMN.finish),
    percentComplete: parsePercent(cellValue(row, COLUMN.percentComplete)),
    status: cellValue(row, COLUMN.status),
    assignee: cellValue(row, COLUMN.assignee),
    permalink: rowPermalink(sheetPermalink, row.id, row.permalink),
  };
}

export function buildDsbScheduleStats(
  sheet: {
    permalink?: string;
    rows?: SmartsheetRow[];
  },
  now: Date = new Date(),
): DsbScheduleStats | null {
  const rows = sheet.rows ?? [];
  const sheetPermalink =
    sheet.permalink ??
    "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1";

  const childrenByParent = new Map<number, SmartsheetRow[]>();
  for (const row of rows) {
    if (row.parentId == null) continue;
    const list = childrenByParent.get(row.parentId) ?? [];
    list.push(row);
    childrenByParent.set(row.parentId, list);
  }

  const dsbRow = rows.find(
    (row) => cellValue(row, COLUMN.taskName) === DSB_SCHEDULE_TASK_NAME,
  );
  if (!dsbRow) return null;

  const revisionRows = (childrenByParent.get(dsbRow.id) ?? []).filter((row) => {
    const name = (cellValue(row, COLUMN.taskName) ?? "").toLowerCase();
    return name === "rev a" || name === "rev b";
  });

  const revisions: DsbScheduleRevision[] = revisionRows.map((revisionRow) => {
    const tasks = (childrenByParent.get(revisionRow.id) ?? []).map((taskRow) =>
      toScheduleTask(taskRow, sheetPermalink),
    );
    return {
      id: revisionRow.id,
      name: cellValue(revisionRow, COLUMN.taskName) ?? "Revision",
      start: cellValue(revisionRow, COLUMN.start),
      finish: cellValue(revisionRow, COLUMN.finish),
      assignee: cellValue(revisionRow, COLUMN.assignee),
      permalink: rowPermalink(sheetPermalink, revisionRow.id, revisionRow.permalink),
      tasks,
    };
  });

  // Keep Rev A before Rev B when both exist.
  revisions.sort((a, b) => a.name.localeCompare(b.name));

  const dsbStart = cellValue(dsbRow, COLUMN.start);
  const dsbFinish = cellValue(dsbRow, COLUMN.finish);
  const currentTask = findCurrentScheduleTask(revisions, now);
  const nextTask = findNextScheduleTask(revisions, now);

  return {
    taskName: DSB_SCHEDULE_TASK_NAME,
    href: rowPermalink(sheetPermalink, dsbRow.id, dsbRow.permalink),
    revisionCount: revisions.length,
    revisions,
    currentTask,
    nextTask,
    overallProgressPercent: progressFromDates(dsbStart, dsbFinish, now),
    syncedAt: formatSyncDate(dsbFinish),
  };
}

/** Parse Smartsheet datetimes consistently as UTC when no timezone is present. */
function parseSmartsheetDate(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return Date.parse(trimmed);
  }
  // Smartsheet returns local-wall values like 2026-07-24T08:00:00 with no zone.
  // Anchor them as UTC so server display and client popup use the same instant.
  return Date.parse(`${trimmed}Z`);
}

function utcDayStartMs(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function taskTimeBounds(task: Pick<DsbScheduleTask, "start" | "finish">): {
  startMs: number;
  finishMs: number;
} | null {
  if (!task.start || !task.finish) return null;
  const startMs = parseSmartsheetDate(task.start);
  const finishMs = parseSmartsheetDate(task.finish);
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs)) return null;
  return { startMs, finishMs };
}

function overlapsCalendarDay(
  startMs: number,
  finishMs: number,
  dayStartMs: number,
): boolean {
  const startDay = utcDayStartMs(startMs);
  const finishDay = utcDayStartMs(finishMs);
  return startDay <= dayStartMs && finishDay >= dayStartMs;
}

/**
 * Pick the schedule task that covers today's calendar date.
 * Never selects a future-dated task that has not started yet.
 */
export function findCurrentScheduleTask(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): DsbScheduleTask | null {
  const todayStartMs = utcDayStartMs(now.getTime());
  const tasks = revisions.flatMap((revision) => revision.tasks);

  const todaysTasks = tasks
    .map((task) => {
      const bounds = taskTimeBounds(task);
      if (!bounds) return null;
      // Exclude future work that starts after today.
      if (utcDayStartMs(bounds.startMs) > todayStartMs) return null;
      if (!overlapsCalendarDay(bounds.startMs, bounds.finishMs, todayStartMs)) {
        return null;
      }
      return { task, startMs: bounds.startMs, finishMs: bounds.finishMs };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);

  if (todaysTasks.length === 0) return null;

  todaysTasks.sort((a, b) => {
    // Prefer the latest-started task that still covers today.
    if (a.startMs !== b.startMs) return b.startMs - a.startMs;
    return a.finishMs - b.finishMs;
  });

  return todaysTasks[0]?.task ?? null;
}

export function findCurrentScheduleTaskId(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): number | null {
  return findCurrentScheduleTask(revisions, now)?.id ?? null;
}

/** Tasks in Smartsheet order: Rev A then Rev B, each in sheet row order. */
function sheetOrderedTasks(revisions: DsbScheduleRevision[]): DsbScheduleTask[] {
  return revisions.flatMap((revision) => revision.tasks);
}

/**
 * Next step in the Smartsheet schedule after today's current task.
 * Uses sheet order so the displayed Next Task matches the following row.
 */
export function findNextScheduleTask(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): DsbScheduleTask | null {
  const ordered = sheetOrderedTasks(revisions);
  if (ordered.length === 0) return null;

  const current = findCurrentScheduleTask(revisions, now);
  if (current) {
    const currentIndex = ordered.findIndex((task) => task.id === current.id);
    if (currentIndex < 0) return null;
    return ordered[currentIndex + 1] ?? null;
  }

  // No task covers today: next step is the first future-dated Smartsheet row.
  const todayStartMs = utcDayStartMs(now.getTime());
  return (
    ordered.find((task) => {
      const bounds = taskTimeBounds(task);
      if (!bounds) return false;
      return utcDayStartMs(bounds.startMs) > todayStartMs;
    }) ?? null
  );
}

export function findNextScheduleTaskId(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): number | null {
  return findNextScheduleTask(revisions, now)?.id ?? null;
}

export async function fetchDsbScheduleStats(
  token?: string,
  now: Date = new Date(),
): Promise<DsbScheduleStats | null> {
  try {
    const columnIds = Object.values(COLUMN).join(",");
    const sheet = await getSmartsheetSheet(
      `${AVIONICS_MASTER_SCHEDULE_SHEET_ID}?columnIds=${columnIds}`,
      token,
    );
    return buildDsbScheduleStats(
      sheet as {
        permalink?: string;
        rows?: SmartsheetRow[];
      },
      now,
    );
  } catch {
    return null;
  }
}
