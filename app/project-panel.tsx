"use client";

import { ConfigWindow } from "./config-window";
import { useDashboardConfig } from "./dashboard-config-store";
import { ScheduleHoverLabel } from "./schedule-hover";
import { TaskHoverLabel } from "./task-hover";
import type { DashboardConfig } from "../lib/dashboard-config";
import type { EsadProjectCode } from "../lib/esad-projects";
import type { DsbScheduleRevision } from "../lib/dsb-schedule";
import type { DsbTaskItem } from "../lib/dsb-tasks";

type Board = { name: string; progress: number };
type Metric = {
  value: number;
  label: string;
  href?: string;
  barPercent?: number;
  barLabel?: string;
  valueText?: string;
  valueHref?: string;
  hideValueBar?: boolean;
  detailItems?: DsbTaskItem[];
  scheduleRevisions?: DsbScheduleRevision[];
  focusTaskId?: number;
};

export type ProjectPanelProject = {
  name: string;
  code: EsadProjectCode;
  status: "Critical" | "At risk" | "On track";
  boards: Board[];
  metrics: Metric[];
  updated: string;
  taskProgressPercent?: number;
  taskProgressCaption?: string;
  config: DashboardConfig;
};

const metricIcons = ["◷", "▤", "▥", "▸"];

export function ProjectPanel({
  project,
  index,
}: {
  project: ProjectPanelProject;
  index: number;
}) {
  const config = useDashboardConfig(project.config.dashboardId);
  const boardAverage = Math.round(
    project.boards.reduce((total, board) => total + board.progress, 0) /
      project.boards.length,
  );
  const progressPercent = project.taskProgressPercent ?? boardAverage;
  const progressCaption =
    project.taskProgressCaption ?? `${boardAverage}% average progress`;
  const progressAriaLabel =
    project.taskProgressPercent != null
      ? `Task progress ${progressPercent} percent done versus open`
      : `Average board progress ${boardAverage} percent`;

  return (
    <article
      className={`project-panel project-panel--${index + 1}`}
      data-dashboard-id={config.dashboardId}
    >
      <div className="panel-topline" aria-hidden="true" />
      <header className="panel-header">
        <div className="panel-identity">
          <div className="blueprint-tile" aria-hidden="true">
            <span>{config.boardNickname}</span>
            <i />
          </div>
          <p className="responsible-engineer">
            <span>Responsible Engineer</span>
            <strong>{config.responsibleEngineer || "—"}</strong>
          </p>
        </div>
        <div className="panel-title">
          <p>{project.status}</p>
          <h2 title={config.boardName}>{config.boardName}</h2>
          <div className="board-summary" aria-label={progressAriaLabel}>
            <span
              style={{
                width: `${Math.max(0, Math.min(100, progressPercent))}%`,
              }}
            />
          </div>
          <small>{progressCaption}</small>
        </div>
        <div className="panel-header-actions">
          <ConfigWindow config={config} />
          <div
            className="signal-lights"
            aria-label={`${project.status} project`}
          >
            <i className={project.status === "On track" ? "active" : ""} />
            <i className={project.status === "At risk" ? "active" : ""} />
            <i className={project.status === "Critical" ? "active" : ""} />
          </div>
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
              <span className="metric-icon" aria-hidden="true">
                {metricIcons[metricIndex]}
              </span>
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
