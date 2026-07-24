import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the MACH ESAD dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MACH ESAD Development Dashboard<\/title>/i);
  assert.match(
    html,
    /<meta(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']Engineering project health, progress, and work tracking at a glance\.["'])[^>]*>/i,
  );
  assert.match(html, /Engineering Program Office/);
  assert.match(html, /Digital Safety Board/);
  assert.match(html, /High Voltage Fireset Board/);
  assert.match(html, /CPLD - Primary/);
  assert.match(html, /CPLD - Independent/);
  assert.match(html, /Program status/);
  assert.match(html, /Task progress [\d.]+ percent done versus open/);
  assert.match(html, /\d+(?:\.\d+)?% done · \d+ done \/ \d+ open/);
  assert.match(html, /SYNC <!-- -->JUL 21, 2026/);
  assert.match(
    html,
    /href="https:\/\/docs\.google\.com\/spreadsheets\/d\/1RbnLe7FBrnT1njFWnsVyW74Iq2N5miTH9vFmRwagzps\/edit\?usp=drive_link"/,
  );
  assert.match(html, />Open Tasks<\/a>/);
  assert.match(html, /Over Due/);
  assert.match(html, /Current Task/);
  assert.match(html, /Next Task/);
  assert.match(
    html,
    /Digital Safety Board[\s\S]*?Open Tasks[\s\S]*?<dd>\d+<\/dd>/,
  );
  assert.match(
    html,
    /Digital Safety Board[\s\S]*?Over Due[\s\S]*?<dd>\d+<\/dd>/,
  );
  assert.match(html, /task-hover-trigger--open/);
  assert.match(html, /task-hover-trigger--overdue/);
  assert.match(html, /task-hover-trigger--schedule/);
  assert.match(html, /metric-row--text/);
  assert.match(html, /metric-task-name/);
  assert.match(html, /metric-task-name-link/);
  assert.match(html, /Current Task[\s\S]*?Next Task/);
  assert.doesNotMatch(html, />Schedule</);
  assert.doesNotMatch(
    html,
    /metric-task-name[\s\S]*?Digital Safety Board \(DSB\)/,
  );
  assert.match(
    html,
    /href="https:\/\/app\.smartsheet\.com\/sheets\/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1\?rowId=\d+"/,
  );
  assert.match(html, /Over Due/);
  assert.match(
    html,
    /aria-label="\d+ of \d+ tasks done"[^>]*>[\s\S]*?class="metric-fill metric-fill--0"[^>]*style="width:\d+(?:\.\d+)?%"/,
  );
  assert.match(
    html,
    /aria-label="(?:No open tasks with due dates|\d+ of \d+ dated open tasks overdue)"/,
  );
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|Codex/i);
});

test("keeps dashboard metadata and project data in source", async () => {
  const [page, layout, packageJson, hover, scheduleHover] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/task-hover.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/schedule-hover.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const projects: Project\[\] = \[/);
  assert.match(page, /name: "Digital Safety Board"/);
  assert.match(page, /label: "Open Tasks"/);
  assert.match(page, /label: "Over Due"/);
  assert.match(page, /label: "Current Task"/);
  assert.match(page, /label: "Next Task"/);
  assert.match(page, /valueText: scheduleStats\.currentTask\?\.name/);
  assert.match(page, /valueText: scheduleStats\.nextTask\?\.name/);
  assert.match(page, /focusTaskId: scheduleStats\.currentTask\?\.id/);
  assert.match(page, /focusTaskId: scheduleStats\.nextTask\?\.id/);
  assert.match(page, /valueHref:\s*\n?\s*scheduleStats\.currentTask\?\.permalink/);
  assert.match(page, /valueHref:\s*\n?\s*scheduleStats\.nextTask\?\.permalink/);
  assert.match(page, /hideValueBar: true/);
  assert.match(scheduleHover, /focusTaskIdProp/);
  assert.match(page, /stats\.overdueTasks/);
  assert.match(page, /TaskHoverLabel/);
  assert.match(page, /ScheduleHoverLabel/);
  assert.match(scheduleHover, /findCurrentScheduleTaskId/);
  assert.match(scheduleHover, /findNextScheduleTaskId/);
  assert.match(scheduleHover, /is-\$\{focus\}-work/);
  assert.match(scheduleHover, /schedule-focus-arrow/);
  assert.match(scheduleHover, /focus === "next"/);
  assert.match(page, /detailItems: stats\.openItems/);
  assert.match(page, /detailItems: stats\.overdueItems/);
  assert.match(page, /fetchDsbTaskStats/);
  assert.match(page, /fetchDsbScheduleStats/);
  assert.match(page, /DSB_SHEET_EDIT_URL/);
  assert.match(hover, /jiraIssueUrl\(item\.key\)/);
  assert.match(page, /name: "High Voltage Fireset Board"/);
  assert.match(page, /name: "CPLD - Primary"/);
  assert.match(page, /name: "CPLD - Independent"/);
  assert.match(page, /function HealthCore\(\)/);
  assert.match(layout, /title: "MACH ESAD Development Dashboard"/);
  assert.match(layout, /og\.png/);
  assert.match(packageJson, /"name": "site-creator-vinext-starter"/);
  assert.doesNotMatch(page, /SkeletonPreview|react-loading-skeleton/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|themeColor|\bViewport\b/);
});
