import assert from "node:assert/strict";
import test from "node:test";
import {
  DASHBOARD_CONFIGS,
  DASHBOARD_ID_BY_CODE,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  formatDashboardConfigText,
  getDashboardConfigForCode,
  parseDashboardConfigText,
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

test("formats DSB configuration text without Dash Board ID", () => {
  const text = formatDashboardConfigText(DASHBOARD_CONFIGS["1"]);
  assert.equal(
    text,
    [
      'Responsible Engineer: "Bruno Abousleiman"',
      'Board Name: "Digital Safety Board"',
      'Board Nickname: "DSB"',
      'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
      'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    ].join("\n"),
  );
  assert.doesNotMatch(text, /Dash Board ID/);
});

test("parses editable configuration text back into card fields", () => {
  const edited = [
    'Responsible Engineer: "Alex Rivera"',
    'Board Name: "Digital Safety Board Rev C"',
    'Board Nickname: "DSB-C"',
    'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
    'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
  ].join("\n");

  const parsed = parseDashboardConfigText(edited, DASHBOARD_CONFIGS["1"]);
  assert.ok("config" in parsed);
  assert.equal(parsed.config.dashboardId, "1");
  assert.equal(parsed.config.responsibleEngineer, "Alex Rivera");
  assert.equal(parsed.config.boardName, "Digital Safety Board Rev C");
  assert.equal(parsed.config.boardNickname, "DSB-C");
});

test("rejects malformed configuration text", () => {
  const parsed = parseDashboardConfigText(
    'Board Name: "Only one field"',
    DASHBOARD_CONFIGS["1"],
  );
  assert.ok("error" in parsed);
});

test("resolves dashboard config by project code", () => {
  assert.equal(getDashboardConfigForCode("DSB").dashboardId, "1");
  assert.equal(getDashboardConfigForCode("IND").boardName, "CPLD - Independent");
});

test("exposes default admin credentials", () => {
  assert.equal(DEFAULT_ADMIN_USERNAME, "admin");
  assert.equal(DEFAULT_ADMIN_PASSWORD, "esad");
});
