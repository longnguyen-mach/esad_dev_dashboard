import assert from "node:assert/strict";
import test from "node:test";
import {
  DASHBOARD_CONFIGS,
  DASHBOARD_ID_BY_CODE,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  formatDashboardConfigText,
  getDashboardConfigForCode,
} from "../lib/dashboard-config.ts";

test("maps dashboard slots to board nicknames", () => {
  assert.equal(DASHBOARD_CONFIGS["1"].boardNickname, "DSB");
  assert.equal(DASHBOARD_CONFIGS["2"].boardNickname, "HVFB");
  assert.equal(DASHBOARD_CONFIGS["3"].boardNickname, "PRI");
  assert.equal(DASHBOARD_CONFIGS["4"].boardNickname, "IND");
  assert.equal(DASHBOARD_ID_BY_CODE.DSB, "1");
  assert.equal(DASHBOARD_ID_BY_CODE.HVFB, "2");
  assert.equal(DASHBOARD_ID_BY_CODE.PRI, "3");
  assert.equal(DASHBOARD_ID_BY_CODE.IND, "4");
});

test("formats DSB configuration text in the requested file style", () => {
  const text = formatDashboardConfigText(DASHBOARD_CONFIGS["1"]);
  assert.equal(
    text,
    [
      'Dash Board ID:  "1"',
      'Responsible Engineer: "Bruno Abousleiman"',
      'Board Name: "Digital Safety Board"',
      'Board Nickname: "DSB"',
      'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
      'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    ].join("\n"),
  );
});

test("resolves dashboard config by project code", () => {
  assert.equal(getDashboardConfigForCode("DSB").dashboardId, "1");
  assert.equal(getDashboardConfigForCode("IND").boardName, "CPLD - Independent");
});

test("exposes default admin credentials", () => {
  assert.equal(DEFAULT_ADMIN_USERNAME, "admin");
  assert.equal(DEFAULT_ADMIN_PASSWORD, "esad");
});
