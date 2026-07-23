import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DSB_SCHEDULE_TASK_NAME,
  buildDsbScheduleStats,
  fetchDsbScheduleStats,
  findCurrentScheduleTaskId,
  findNextScheduleTask,
} from "../lib/dsb-schedule.ts";

const fixtureSheet = {
  permalink:
    "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1",
  rows: [
    {
      id: 1,
      cells: [{ columnId: 5067326880960388, value: "Other Program" }],
    },
    {
      id: 128284846915460,
      cells: [
        { columnId: 5067326880960388, value: "Digital Safety Board (DSB)" },
        { columnId: 7319126694645636, value: "2026-07-02T08:00:00" },
        { columnId: 1689627160432516, value: "2026-11-27T16:59:59" },
      ],
    },
    {
      id: 4631884474285956,
      parentId: 128284846915460,
      cells: [
        { columnId: 5067326880960388, value: "Rev A" },
        { columnId: 7319126694645636, value: "2026-07-02T08:00:00" },
        { columnId: 1689627160432516, value: "2026-09-29T16:59:59" },
        { columnId: 3941426974117764, displayValue: "George Madden" },
      ],
    },
    {
      id: 2380084660600708,
      parentId: 4631884474285956,
      cells: [
        { columnId: 5067326880960388, value: "Detail Architecture Work" },
        { columnId: 7319126694645636, value: "2026-07-02T08:00:00" },
        { columnId: 1689627160432516, value: "2026-07-16T16:59:59" },
      ],
    },
    {
      id: 409759823626116,
      parentId: 128284846915460,
      cells: [
        { columnId: 5067326880960388, value: "Rev B" },
        { columnId: 7319126694645636, value: "2026-09-29T16:59:59" },
        { columnId: 1689627160432516, value: "2026-11-11T16:59:59" },
      ],
    },
    {
      id: 4913359450996612,
      parentId: 409759823626116,
      cells: [
        { columnId: 5067326880960388, value: "Requirements" },
        { columnId: 7319126694645636, value: "2026-09-29T16:59:59" },
        { columnId: 1689627160432516, value: "2026-09-29T16:59:59" },
      ],
    },
    {
      id: 6602209311260548,
      parentId: 128284846915460,
      cells: [{ columnId: 5067326880960388, value: "EMI/EMC on Iron-Bird" }],
    },
  ],
};

async function loadEnvToken() {
  if (process.env.SMARTSHEET_ACCESS_TOKEN?.trim()) {
    return process.env.SMARTSHEET_ACCESS_TOKEN.trim();
  }
  try {
    const envText = await readFile(new URL("../.env", import.meta.url), "utf8");
    const match = envText.match(/^\s*SMARTSHEET_ACCESS_TOKEN\s*=\s*(.+)\s*$/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

test("builds Rev A and Rev B schedule groups for Digital Safety Board task", () => {
  const stats = buildDsbScheduleStats(fixtureSheet, new Date("2026-07-23T12:00:00Z"));
  assert.ok(stats);
  assert.equal(stats.taskName, DSB_SCHEDULE_TASK_NAME);
  assert.equal(stats.revisionCount, 2);
  assert.deepEqual(
    stats.revisions.map((revision) => revision.name),
    ["Rev A", "Rev B"],
  );
  assert.equal(stats.revisions[0]?.tasks[0]?.name, "Detail Architecture Work");
  assert.equal(stats.revisions[1]?.tasks[0]?.name, "Requirements");
  assert.match(stats.href, /rowId=128284846915460/);
  assert.ok(stats.overallProgressPercent > 0);
});

test("highlights the in-window task as current work", () => {
  const stats = buildDsbScheduleStats(fixtureSheet, new Date("2026-07-10T12:00:00Z"));
  assert.ok(stats);
  assert.equal(
    findCurrentScheduleTaskId(stats.revisions, new Date("2026-07-10T12:00:00Z")),
    2380084660600708,
  );
  assert.equal(stats.currentTask?.id, 2380084660600708);
  assert.equal(stats.currentTask?.name, "Detail Architecture Work");
  assert.equal(stats.nextTask?.name, "Requirements");
  assert.equal(
    findNextScheduleTask(stats.revisions, new Date("2026-07-10T12:00:00Z"))?.name,
    "Requirements",
  );
});

test("falls back to the next upcoming task when none are active", () => {
  const stats = buildDsbScheduleStats(fixtureSheet, new Date("2026-08-01T12:00:00Z"));
  assert.ok(stats);
  assert.equal(
    findCurrentScheduleTaskId(stats.revisions, new Date("2026-08-01T12:00:00Z")),
    4913359450996612,
  );
  assert.equal(stats.nextTask, null);
});

test("fetches live DSB schedule from Smartsheet when token is configured", async () => {
  const token = await loadEnvToken();
  if (!token) {
    console.log("skip: SMARTSHEET_ACCESS_TOKEN not configured");
    return;
  }

  const stats = await fetchDsbScheduleStats(token, new Date("2026-07-23T12:00:00Z"));
  assert.ok(stats, "expected live DSB schedule stats");
  assert.equal(stats.taskName, DSB_SCHEDULE_TASK_NAME);
  assert.equal(stats.revisionCount, 2);
  assert.deepEqual(
    stats.revisions.map((revision) => revision.name),
    ["Rev A", "Rev B"],
  );
  assert.ok(stats.revisions[0].tasks.length > 0);
  assert.ok(stats.revisions[1].tasks.length > 0);
  assert.ok(stats.currentTask?.name);
  assert.ok(stats.nextTask?.name);
  assert.notEqual(stats.currentTask?.id, stats.nextTask?.id);
});
