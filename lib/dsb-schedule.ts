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

function taskTimeBounds(task: Pick<DsbScheduleTask, "start" | "finish">): {
  startMs: number;
  finishMs: number;
} | null {
  if (!task.start || !task.finish) return null;
  const startMs = Date.parse(task.start);
  const finishMs = Date.parse(task.finish);
  if (!Number.isFinite(startMs) || !Number.isFinite(finishMs)) return null;
  return { startMs, finishMs };
}

/** Pick the in-window schedule task, or the next upcoming task when none is active. */
export function findCurrentScheduleTask(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): DsbScheduleTask | null {
  const nowMs = now.getTime();
  const tasks = revisions.flatMap((revision) => revision.tasks);

  const inProgress = tasks
    .map((task) => {
      const bounds = taskTimeBounds(task);
      if (!bounds) return null;
      if (nowMs < bounds.startMs || nowMs > bounds.finishMs) return null;
      return { task, startMs: bounds.startMs, finishMs: bounds.finishMs };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);

  if (inProgress.length > 0) {
    inProgress.sort((a, b) => {
      // Prefer the latest-started active task; break ties by earliest finish.
      if (a.startMs !== b.startMs) return b.startMs - a.startMs;
      return a.finishMs - b.finishMs;
    });
    return inProgress[0]?.task ?? null;
  }

  const upcoming = tasks
    .map((task) => {
      const bounds = taskTimeBounds(task);
      if (!bounds || bounds.startMs < nowMs) return null;
      return { task, startMs: bounds.startMs };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .sort((a, b) => a.startMs - b.startMs);

  return upcoming[0]?.task ?? null;
}

export function findCurrentScheduleTaskId(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): number | null {
  return findCurrentScheduleTask(revisions, now)?.id ?? null;
}

function orderedScheduleTasks(
  revisions: DsbScheduleRevision[],
): Array<{ task: DsbScheduleTask; startMs: number; finishMs: number }> {
  return revisions
    .flatMap((revision) => revision.tasks)
    .map((task) => {
      const bounds = taskTimeBounds(task);
      if (!bounds) return null;
      return { task, startMs: bounds.startMs, finishMs: bounds.finishMs };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .sort((a, b) => {
      if (a.startMs !== b.startMs) return a.startMs - b.startMs;
      return a.finishMs - b.finishMs;
    });
}

/** Task immediately after the current schedule task. */
export function findNextScheduleTask(
  revisions: DsbScheduleRevision[],
  now: Date = new Date(),
): DsbScheduleTask | null {
  const ordered = orderedScheduleTasks(revisions);
  if (ordered.length === 0) return null;

  const current = findCurrentScheduleTask(revisions, now);
  if (!current) return ordered[0]?.task ?? null;

  const currentIndex = ordered.findIndex((entry) => entry.task.id === current.id);
  if (currentIndex < 0) return ordered[0]?.task ?? null;
  return ordered[currentIndex + 1]?.task ?? null;
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
