import assert from "node:assert/strict";
import test from "node:test";
import {
  countOpenTasksFromCsv,
  fetchDsbTaskStats,
} from "../lib/dsb-tasks.ts";

const sampleCsv = `Issue Type,Key,Summary,Status,Updated
Task,EE-1,Layout,TO DO,7/20/2026 13:59:36
Task,EE-2,Requirements,Review,7/21/2026 09:00:00
Task,EE-3,Bring up,In Progress,7/22/2026 10:15:00
Task,EE-4,Ship,Done,7/23/2026 11:30:00
`;

test("counts non-done DSB sheet rows as open tasks", () => {
  const stats = countOpenTasksFromCsv(sampleCsv);
  assert.equal(stats.totalTasks, 4);
  assert.equal(stats.openTasks, 3);
  assert.equal(stats.syncedAt, "Jul 23, 2026");
});

test("fetchDsbTaskStats reads open tasks from the live sheet", async () => {
  const stats = await fetchDsbTaskStats();
  assert.ok(stats, "expected live DSB sheet stats");
  assert.ok(stats.totalTasks > 0);
  assert.ok(stats.openTasks >= 0);
  assert.ok(stats.openTasks <= stats.totalTasks);
  assert.match(stats.syncedAt ?? "", /[A-Za-z]{3} \d{1,2}, \d{4}/);
});
