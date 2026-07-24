"use client";

import { useEffect, useState } from "react";
import {
  DASHBOARD_CONFIGS,
  type DashboardConfig,
  type DashboardId,
} from "../lib/dashboard-config";

export const DASHBOARD_CONFIG_STORAGE_KEY = "esad-dashboard-configs";
export const DASHBOARD_CONFIG_EVENT = "esad-dashboard-config-change";

type ConfigMap = Record<DashboardId, DashboardConfig>;

function cloneDefaults(): ConfigMap {
  return {
    "1": { ...DASHBOARD_CONFIGS["1"] },
    "2": { ...DASHBOARD_CONFIGS["2"] },
    "3": { ...DASHBOARD_CONFIGS["3"] },
    "4": { ...DASHBOARD_CONFIGS["4"] },
  };
}

function mergeStored(raw: unknown): ConfigMap {
  const defaults = cloneDefaults();
  if (!raw || typeof raw !== "object") return defaults;

  const stored = raw as Partial<Record<DashboardId, Partial<DashboardConfig>>>;
  for (const id of ["1", "2", "3", "4"] as DashboardId[]) {
    const entry = stored[id];
    if (!entry || typeof entry !== "object") continue;
    defaults[id] = {
      ...defaults[id],
      responsibleEngineer:
        typeof entry.responsibleEngineer === "string"
          ? entry.responsibleEngineer
          : defaults[id].responsibleEngineer,
      boardName:
        typeof entry.boardName === "string"
          ? entry.boardName
          : defaults[id].boardName,
      boardNickname:
        typeof entry.boardNickname === "string"
          ? entry.boardNickname
          : defaults[id].boardNickname,
      jiraEpicLink:
        typeof entry.jiraEpicLink === "string"
          ? entry.jiraEpicLink
          : defaults[id].jiraEpicLink,
      smartsheetLink:
        typeof entry.smartsheetLink === "string"
          ? entry.smartsheetLink
          : defaults[id].smartsheetLink,
      dashboardId: id,
    };
  }
  return defaults;
}

export function readDashboardConfigs(): ConfigMap {
  if (typeof window === "undefined") return cloneDefaults();
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CONFIG_STORAGE_KEY);
    if (!raw) return cloneDefaults();
    return mergeStored(JSON.parse(raw));
  } catch {
    return cloneDefaults();
  }
}

export function writeDashboardConfig(config: DashboardConfig): ConfigMap {
  const next = readDashboardConfigs();
  next[config.dashboardId] = { ...config, dashboardId: config.dashboardId };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      DASHBOARD_CONFIG_STORAGE_KEY,
      JSON.stringify(next),
    );
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_CONFIG_EVENT, {
        detail: { config: next[config.dashboardId] },
      }),
    );
  }
  return next;
}

export function useDashboardConfig(dashboardId: DashboardId): DashboardConfig {
  const [config, setConfig] = useState<DashboardConfig>(
    () => DASHBOARD_CONFIGS[dashboardId],
  );

  useEffect(() => {
    setConfig(readDashboardConfigs()[dashboardId]);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ config: DashboardConfig }>).detail;
      if (detail?.config?.dashboardId === dashboardId) {
        setConfig(detail.config);
        return;
      }
      setConfig(readDashboardConfigs()[dashboardId]);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === DASHBOARD_CONFIG_STORAGE_KEY) {
        setConfig(readDashboardConfigs()[dashboardId]);
      }
    };

    window.addEventListener(DASHBOARD_CONFIG_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DASHBOARD_CONFIG_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [dashboardId]);

  return config;
}
