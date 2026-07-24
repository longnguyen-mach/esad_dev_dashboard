import { ScheduleHoverLabel } from "./schedule-hover";
import { TaskHoverLabel } from "./task-hover";
import {
  fetchDsbScheduleStats,
  type DsbScheduleRevision,
  type DsbScheduleStats,
} from "../lib/dsb-schedule";
import {
  DSB_SHEET_EDIT_URL,
  fetchDsbTaskStats,
  type DsbTaskItem,
  type DsbTaskStats,
} from "../lib/dsb-tasks";

type Board = { name: string; progress: number };
type Metric = {
  value: number;
  label: string;
  href?: string;
  /** When set, status bar uses this completion percent instead of value/scale. */
  barPercent?: number;
  barLabel?: string;
  /** Replaces the numeric value + progress bar (used by Current/Next Task). */
  valueText?: string;
  valueHref?: string;
  hideValueBar?: boolean;
  detailItems?: DsbTaskItem[];
  scheduleRevisions?: DsbScheduleRevision[];
  /** Keeps Current/Next Task popup highlight aligned with valueText. */
  focusTaskId?: number;
};

type Project = {
  name: string;
  code: string;
  status: "Critical" | "At risk" | "On track";
  boards: Board[];
  metrics: Metric[];
  updated: string;
  /** When set, header progress uses Done/(Done+Open) instead of board average. */
  taskProgressPercent?: number;
  taskProgressCaption?: string;
};

export const dynamic = "force-dynamic";

const dsbScheduleFallbackRevisions: DsbScheduleRevision[] = [
  {
    id: 4631884474285956,
    name: "Rev A",
    start: "2026-07-02T08:00:00",
    finish: "2026-09-29T16:59:59",
    assignee: "George Madden",
    permalink:
      "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=4631884474285956",
    tasks: [
      {
        id: 2380084660600708,
        name: "Detail Architecture Work",
        start: "2026-07-02T08:00:00",
        finish: "2026-07-16T16:59:59",
        percentComplete: null,
        status: null,
        assignee: null,
        permalink:
          "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=2380084660600708",
      },
      {
        id: 6602209311260999,
        name: "Block Diagram + Review",
        start: "2026-07-17T08:00:00",
        finish: "2026-07-23T16:59:59",
        percentComplete: null,
        status: null,
        assignee: null,
        permalink:
          "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=6602209311260999",
      },
    ],
  },
  {
    id: 409759823626116,
    name: "Rev B",
    start: "2026-09-29T16:59:59",
    finish: "2026-11-11T16:59:59",
    assignee: null,
    permalink:
      "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=409759823626116",
    tasks: [
      {
        id: 4913359450996612,
        name: "Requirements",
        start: "2026-09-29T16:59:59",
        finish: "2026-09-29T16:59:59",
        percentComplete: null,
        status: null,
        assignee: null,
        permalink:
          "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=4913359450996612",
      },
    ],
  },
];

const projects: Project[] = [
  {
    name: "Digital Safety Board",
    code: "DSB",
    status: "Critical",
    boards: [
      { name: "Main Carrier Board Rev B", progress: 70 },
      { name: "Main Carrier Board Rev C", progress: 50 },
      { name: "IO Board Rev B", progress: 75 },
      { name: "RF Carrier Board Rev B", progress: 77 },
      { name: "Nose Board Rev C", progress: 71 },
      { name: "Tail Board Rev A", progress: 90 },
    ],
    metrics: [
      {
        value: 25,
        label: "Open Tasks",
        href: DSB_SHEET_EDIT_URL,
        // Fallback when the sheet cannot be fetched: 1 Done / 26 total.
        barPercent: 3.8,
        barLabel: "1 of 26 tasks done",
        detailItems: [
          {
            key: "EE-2221",
            summary: "ESAD DIGITAL SAFETY BOARD - Layout & Release Checklist Complete",
            assignee: "",
          },
        ],
      },
      {
        value: 1,
        label: "Over Due",
        href: DSB_SHEET_EDIT_URL,
        // Fallback when the sheet cannot be fetched.
        barPercent: 20,
        barLabel: "1 of 5 dated open tasks overdue",
        detailItems: [
          {
            key: "EE-2226",
            summary: "ESAD DIGITAL SAFETY BOARD - Requirements Locked",
            assignee: "Bruno Abousleiman",
            dueDate: "Jul 20, 2026",
          },
        ],
      },
      {
        value: 0,
        label: "Current Task",
        href: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=128284846915460",
        valueText: "Detail Architecture Work",
        valueHref:
          "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=2380084660600708",
        focusTaskId: 2380084660600708,
        hideValueBar: true,
        scheduleRevisions: dsbScheduleFallbackRevisions,
      },
      {
        value: 0,
        label: "Next Task",
        href: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=6602209311260999",
        valueText: "Block Diagram + Review",
        valueHref:
          "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1?rowId=6602209311260999",
        focusTaskId: 6602209311260999,
        hideValueBar: true,
        scheduleRevisions: dsbScheduleFallbackRevisions,
      },
    ],
    // Fallback when the sheet cannot be fetched: 1 done / 25 open.
    taskProgressPercent: 3.8,
    taskProgressCaption: "3.8% done · 1 done / 25 open",
    updated: "Jul 15, 2026",
  },
  {
    name: "High Voltage Fireset Board",
    code: "HVFB",
    status: "Critical",
    boards: [
      { name: "IO Board Rev A", progress: 100 },
      { name: "GSE Board Rev A", progress: 92 },
      { name: "Servo Board Rev A", progress: 85 },
      { name: "Pyro Board Rev A", progress: 68 },
      { name: "3 Phase PDB Board Rev A", progress: 32 },
      { name: "Array Launcher Rev A", progress: 50 },
    ],
    metrics: [
      { value: 41, label: "Open Tasks" },
      { value: 5, label: "Open rework" },
      { value: 3, label: "On order" },
    ],
    updated: "Jul 21, 2026",
  },
  {
    name: "CPLD - Primary",
    code: "PRI",
    status: "Critical",
    boards: [{ name: "Servo Board", progress: 5 }],
    metrics: [
      { value: 21, label: "Open Tasks" },
      { value: 0, label: "Open rework" },
      { value: 0, label: "On order" },
    ],
    updated: "Jun 23, 2026",
  },
  {
    name: "CPLD - Independent",
    code: "IND",
    status: "At risk",
    boards: [
      { name: "Carrier Board Rev A", progress: 50 },
      { name: "Autofill Board Rev A", progress: 73 },
      { name: "LED Board Rev A", progress: 45 },
      { name: "Bulkhead Board Rev A", progress: 50 },
      { name: "BMS Rev A", progress: 41 },
      { name: "BMS Connector Rev A", progress: 41 },
    ],
    metrics: [
      { value: 66, label: "Open Tasks" },
      { value: 1, label: "Open rework" },
      { value: 5, label: "On order" },
    ],
    updated: "Jul 21, 2026",
  },
];

const metricIcons = ["◷", "▤", "▥", "▸"];

function ProjectPanel({ project, index }: { project: Project; index: number }) {
  const boardAverage = Math.round(
    project.boards.reduce((total, board) => total + board.progress, 0) / project.boards.length,
  );
  const progressPercent = project.taskProgressPercent ?? boardAverage;
  const progressCaption =
    project.taskProgressCaption ?? `${boardAverage}% average progress`;
  const progressAriaLabel =
    project.taskProgressPercent != null
      ? `Task progress ${progressPercent} percent done versus open`
      : `Average board progress ${boardAverage} percent`;

  return (
    <article className={`project-panel project-panel--${index + 1}`}>
      <div className="panel-topline" aria-hidden="true" />
      <header className="panel-header">
        <div className="blueprint-tile" aria-hidden="true">
          <span>{project.code}</span>
          <i />
        </div>
        <div className="panel-title">
          <p>{project.status} · {project.boards.length} board{project.boards.length === 1 ? "" : "s"}</p>
          <h2>{project.name}</h2>
          <div className="board-summary" aria-label={progressAriaLabel}>
            <span style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
          </div>
          <small>{progressCaption}</small>
        </div>
        <div className="signal-lights" aria-label={`${project.status} project`}>
          <i className={project.status === "On track" ? "active" : ""} />
          <i className={project.status === "At risk" ? "active" : ""} />
          <i className={project.status === "Critical" ? "active" : ""} />
        </div>
      </header>

      <div className="tech-divider" />

      <dl className="panel-metrics">
        {project.metrics.map((metric, metricIndex) => {
          const scale = metricIndex === 0 ? 80 : 10;
          const width =
            metric.barPercent != null
              ? Math.max(0, Math.min(100, metric.barPercent))
              : metric.value === 0
                ? 2
                : Math.max(10, Math.min(100, (metric.value / scale) * 100));
          const showValueBar = !metric.hideValueBar;

          return (
            <div
              className={`metric-row${showValueBar ? "" : " metric-row--text"}`}
              key={metric.label}
            >
              <span className="metric-icon" aria-hidden="true">{metricIcons[metricIndex]}</span>
              <div className="metric-copy">
                <dt>
                  {metric.label === "Open Tasks" && metric.detailItems ? (
                    <TaskHoverLabel
                      label={metric.label}
                      href={metric.href}
                      items={metric.detailItems}
                      title="Open tasks"
                      emptyText="No open tasks"
                      tone="open"
                    />
                  ) : metric.label === "Over Due" ? (
                    <TaskHoverLabel
                      label={metric.label}
                      href={metric.href}
                      items={metric.detailItems ?? []}
                      title="Overdue items"
                      emptyText="No overdue tasks"
                      tone="overdue"
                    />
                  ) : (metric.label === "Current Task" ||
                      metric.label === "Next Task") &&
                    metric.scheduleRevisions ? (
                    <ScheduleHoverLabel
                      label={metric.label}
                      href={metric.href}
                      revisions={metric.scheduleRevisions}
                      focus={
                        metric.label === "Next Task" ? "next" : "current"
                      }
                      focusTaskId={metric.focusTaskId}
                    />
                  ) : metric.href ? (
                    <a
                      className="metric-link"
                      href={metric.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {metric.label}
                    </a>
                  ) : (
                    metric.label
                  )}
                </dt>
                {showValueBar ? <dd>{metric.value}</dd> : null}
              </div>
              {showValueBar ? (
                <div
                  className="metric-track"
                  aria-label={metric.barLabel}
                  aria-hidden={metric.barLabel ? undefined : true}
                >
                  <span
                    className={`metric-fill metric-fill--${metricIndex}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              ) : metric.valueText ? (
                metric.valueHref || metric.href ? (
                  <dd className="metric-task-name">
                    <a
                      className="metric-task-name-link"
                      href={metric.valueHref ?? metric.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {metric.valueText}
                    </a>
                  </dd>
                ) : (
                  <dd className="metric-task-name">{metric.valueText}</dd>
                )
              ) : null}
            </div>
          );
        })}
      </dl>

      <p className="panel-updated">SYNC {project.updated.toUpperCase()}</p>
    </article>
  );
}

function HealthCore() {
  return (
    <aside className="health-core" aria-label="Program status: 60 percent on track, 25 percent at risk, 15 percent critical">
      <div className="orbit orbit--outer" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="orbit orbit--inner" aria-hidden="true" />
      <div className="health-donut">
        <div className="health-center">
          <h2>Program<br />status</h2>
          <div className="health-stat health-stat--green"><i /><span>On track</span><strong>60%</strong></div>
          <div className="health-stat health-stat--amber"><i /><span>At risk</span><strong>25%</strong></div>
          <div className="health-stat health-stat--red"><i /><span>Critical</span><strong>15%</strong></div>
        </div>
      </div>
    </aside>
  );
}

function applyDsbTaskStats(
  projectList: Project[],
  stats: DsbTaskStats | null,
  scheduleStats: DsbScheduleStats | null,
): Project[] {
  return projectList.map((project) => {
    if (project.code !== "DSB") return project;

    let nextProject = { ...project, metrics: [...project.metrics] };

    if (stats) {
      const doneOverOpenPercent =
        stats.openTasks + stats.doneTasks === 0
          ? 0
          : Math.round(
              (stats.doneTasks / (stats.doneTasks + stats.openTasks)) * 1000,
            ) / 10;

      nextProject = {
        ...nextProject,
        updated: stats.syncedAt ?? nextProject.updated,
        taskProgressPercent: doneOverOpenPercent,
        taskProgressCaption: `${doneOverOpenPercent}% done · ${stats.doneTasks} done / ${stats.openTasks} open`,
        metrics: nextProject.metrics.map((metric) => {
          if (metric.label === "Open Tasks") {
            return {
              ...metric,
              value: stats.openTasks,
              href: DSB_SHEET_EDIT_URL,
              barPercent: stats.completionPercent,
              barLabel: `${stats.doneTasks} of ${stats.totalTasks} tasks done`,
              detailItems: stats.openItems,
            };
          }

          if (metric.label === "Over Due") {
            return {
              ...metric,
              value: stats.overdueTasks,
              href: DSB_SHEET_EDIT_URL,
              barPercent: stats.overduePercent,
              barLabel:
                stats.openTasksWithDueDate === 0
                  ? "No open tasks with due dates"
                  : `${stats.overdueTasks} of ${stats.openTasksWithDueDate} dated open tasks overdue`,
              detailItems: stats.overdueItems,
            };
          }

          return metric;
        }),
      };
    }

    if (scheduleStats) {
      nextProject = {
        ...nextProject,
        metrics: nextProject.metrics.map((metric) => {
          if (metric.label === "Current Task") {
            return {
              ...metric,
              value: 0,
              href: scheduleStats.href,
              valueText: scheduleStats.currentTask?.name ?? "—",
              valueHref:
                scheduleStats.currentTask?.permalink ?? scheduleStats.href,
              focusTaskId: scheduleStats.currentTask?.id,
              hideValueBar: true,
              barPercent: undefined,
              barLabel: undefined,
              scheduleRevisions: scheduleStats.revisions,
            };
          }

          if (metric.label === "Next Task") {
            return {
              ...metric,
              value: 0,
              href: scheduleStats.nextTask?.permalink ?? scheduleStats.href,
              valueText: scheduleStats.nextTask?.name ?? "—",
              valueHref:
                scheduleStats.nextTask?.permalink ?? scheduleStats.href,
              focusTaskId: scheduleStats.nextTask?.id,
              hideValueBar: true,
              barPercent: undefined,
              barLabel: undefined,
              scheduleRevisions: scheduleStats.revisions,
            };
          }

          return metric;
        }),
      };
    }

    return nextProject;
  });
}

export default async function Home() {
  const [dsbStats, scheduleStats] = await Promise.all([
    fetchDsbTaskStats(),
    fetchDsbScheduleStats(),
  ]);
  const dashboardProjects = applyDsbTaskStats(projects, dsbStats, scheduleStats);

  return (
    <main className="dashboard-shell">
      <header className="hero-header">
        <h1>MACH ESAD Development Dashboard</h1>
        <div className="hero-subtitle"><span />Engineering Program Office<span /></div>
      </header>

      <section className="systems-grid" aria-label="Engineering project portfolio">
        {dashboardProjects.map((project, index) => (
          <ProjectPanel key={project.name} project={project} index={index} />
        ))}
        <HealthCore />
      </section>
    </main>
  );
}
