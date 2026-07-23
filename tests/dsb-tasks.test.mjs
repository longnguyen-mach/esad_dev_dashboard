import assert from "node:assert/strict";
import test from "node:test";
import {
  countOpenTasksFromCsv,
  fetchDsbTaskStats,
} from "../lib/dsb-tasks.ts";

const sampleCsv = `Issue Type,Key,Summary,Status,Updated,Due date
Task,EE-1,Layout,TO DO,7/20/2026 13:59:36,7/20/2026
Task,EE-2,Requirements,Review,7/21/2026 09:00:00,7/22/2026
Task,EE-3,Bring up,In Progress,7/22/2026 10:15:00,7/23/2026
Task,EE-4,Ship,Done,7/23/2026 11:30:00,7/21/2026
Task,EE-5,Future work,TO DO,7/23/2026 12:00:00,8/10/2026
Task,EE-6,No due date,TO DO,7/23/2026 12:30:00,
`;

test("counts non-done DSB sheet rows as open tasks", () => {
  const stats = countOpenTasksFromCsv(sampleCsv, new Date(2026, 6, 23));
  assert.equal(stats.totalTasks, 6);
  assert.equal(stats.openTasks, 5);
  assert.equal(stats.doneTasks, 1);
  assert.equal(stats.completionPercent, 16.7);
  assert.equal(stats.syncedAt, "Jul 23, 2026");
});

test("counts overdue open tasks from Due date before today", () => {
  const stats = countOpenTasksFromCsv(sampleCsv, new Date(2026, 6, 23));
  // EE-1 (7/20) and EE-2 (7/22) are overdue; EE-3 is due today; EE-4 is done; EE-5 future; EE-6 blank.
  assert.equal(stats.overdueTasks, 2);
  assert.equal(stats.openTasksWithDueDate, 4);
  assert.equal(stats.overduePercent, 50);
  assert.deepEqual(
    stats.overdueItems.map((item) => item.key),
    ["EE-1", "EE-2"],
  );
});

test("includes key, labels, and assignee for overdue items", () => {
  const csv = `Issue Type,Key,Summary,Status,Updated,Due date,Labels,Assignee
Task,EE-9,Late item,TO DO,7/20/2026 13:59:36,7/20/2026,ESAD;ESAF,Bruno Abousleiman
`;
  const stats = countOpenTasksFromCsv(csv, new Date(2026, 6, 23));
  assert.deepEqual(stats.overdueItems, [
    {
      key: "EE-9",
      labels: "ESAD;ESAF",
      assignee: "Bruno Abousleiman",
      dueDate: "Jul 20, 2026",
    },
  ]);
});

test("does not count due-today or done tasks as overdue", () => {
  const stats = countOpenTasksFromCsv(sampleCsv, new Date(2026, 6, 20));
  // On 7/20, only dates before 7/20 count. None of the open dated tasks are before 7/20.
  assert.equal(stats.overdueTasks, 0);
});

test("fetchDsbTaskStats reads open and overdue tasks from the live sheet", async () => {
  const stats = await fetchDsbTaskStats();
  assert.ok(stats, "expected live DSB sheet stats");
  assert.ok(stats.totalTasks > 0);
  assert.ok(stats.openTasks >= 0);
  assert.ok(stats.doneTasks >= 0);
  assert.equal(stats.openTasks + stats.doneTasks, stats.totalTasks);
  assert.ok(stats.overdueTasks >= 0);
  assert.ok(stats.overdueTasks <= stats.openTasksWithDueDate);
  assert.ok(stats.completionPercent >= 0);
  assert.ok(stats.completionPercent <= 100);
  assert.ok(stats.overduePercent >= 0);
  assert.ok(stats.overduePercent <= 100);
  assert.match(stats.syncedAt ?? "", /[A-Za-z]{3} \d{1,2}, \d{4}/);
});
