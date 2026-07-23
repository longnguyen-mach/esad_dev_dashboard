import {
  DSB_SHEET_EDIT_URL,
  fetchDsbTaskStats,
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
};

type Project = {
  name: string;
  code: string;
  status: "Critical" | "At risk" | "On track";
  boards: Board[];
  metrics: Metric[];
  updated: string;
};

export const dynamic = "force-dynamic";

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
        label: "Open tasks",
        href: DSB_SHEET_EDIT_URL,
        // Fallback when the sheet cannot be fetched: 1 Done / 26 total.
        barPercent: 3.8,
        barLabel: "1 of 26 tasks done",
      },
      { value: 4, label: "Schedule" },
      { value: 2, label: "On order" },
    ],
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
      { value: 41, label: "Open tasks" },
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
      { value: 21, label: "Open tasks" },
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
      { value: 66, label: "Open tasks" },
      { value: 1, label: "Open rework" },
      { value: 5, label: "On order" },
    ],
    updated: "Jul 21, 2026",
  },
];

const metricIcons = ["◷", "▤", "▥"];

function ProjectPanel({ project, index }: { project: Project; index: number }) {
  const average = Math.round(
    project.boards.reduce((total, board) => total + board.progress, 0) / project.boards.length,
  );

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
          <div className="board-summary" aria-label={`Average board progress ${average} percent`}>
            <span style={{ width: `${average}%` }} />
          </div>
          <small>{average}% average progress</small>
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
          return (
            <div className="metric-row" key={metric.label}>
              <span className="metric-icon" aria-hidden="true">{metricIcons[metricIndex]}</span>
              <div className="metric-copy">
                <dt>
                  {metric.href ? (
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
                <dd>{metric.value}</dd>
              </div>
              <div
                className="metric-track"
                aria-label={metric.barLabel}
                aria-hidden={metric.barLabel ? undefined : true}
              >
                <span className={`metric-fill metric-fill--${metricIndex}`} style={{ width: `${width}%` }} />
              </div>
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
): Project[] {
  if (!stats) return projectList;

  return projectList.map((project) => {
    if (project.code !== "DSB") return project;

    return {
      ...project,
      updated: stats.syncedAt ?? project.updated,
      metrics: project.metrics.map((metric) =>
        metric.label === "Open tasks"
          ? {
              ...metric,
              value: stats.openTasks,
              href: DSB_SHEET_EDIT_URL,
              barPercent: stats.completionPercent,
              barLabel: `${stats.doneTasks} of ${stats.totalTasks} tasks done`,
            }
          : metric,
      ),
    };
  });
}

export default async function Home() {
  const dsbStats = await fetchDsbTaskStats();
  const dashboardProjects = applyDsbTaskStats(projects, dsbStats);

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
