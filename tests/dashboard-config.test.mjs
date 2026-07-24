import assert from "node:assert/strict";
import test from "node:test";
import {
  DASHBOARD_CONFIGS,
  DASHBOARD_ID_BY_CODE,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  formatDashboardConfigText,
  getDashboardConfigForCode,
  overdueThresholdsFromConfig,
  parseDashboardConfigText,
  validateDashboardConfigSyntax,
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

test("formats DSB configuration text with LED overdue thresholds", () => {
  const text = formatDashboardConfigText(DASHBOARD_CONFIGS["1"]);
  assert.equal(
    text,
    [
      'Responsible Engineer: "Bruno Abousleiman"',
      'Board Name: "Digital Safety Board"',
      'Board Nickname: "DSB"',
      'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
      'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
      'Green: "< 1"',
      'Yellow: "> 2"',
      'Red: "> 5"',
    ].join("\n"),
  );
  assert.doesNotMatch(text, /Dash Board ID/);
  assert.deepEqual(overdueThresholdsFromConfig(DASHBOARD_CONFIGS["1"]), {
    greenLessThan: 1,
    yellowGreaterThan: 2,
    redGreaterThan: 5,
  });
});

test("parses editable configuration text back into card fields", () => {
  const edited = [
    'Responsible Engineer: "Alex Rivera"',
    'Board Name: "Digital Safety Board Rev C"',
    'Board Nickname: "DSB-C"',
    'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
    'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    'Green: "< 2"',
    'Yellow: "> 4"',
    'Red: "> 9"',
  ].join("\n");

  const parsed = parseDashboardConfigText(edited, DASHBOARD_CONFIGS["1"]);
  assert.ok("config" in parsed);
  assert.equal(parsed.config.dashboardId, "1");
  assert.equal(parsed.config.responsibleEngineer, "Alex Rivera");
  assert.equal(parsed.config.boardName, "Digital Safety Board Rev C");
  assert.equal(parsed.config.boardNickname, "DSB-C");
  assert.equal(parsed.config.ledGreenLessThan, 2);
  assert.equal(parsed.config.ledYellowGreaterThan, 4);
  assert.equal(parsed.config.ledRedGreaterThan, 9);
});

test("rejects malformed configuration text", () => {
  const parsed = parseDashboardConfigText(
    'Board Name: "Only one field"',
    DASHBOARD_CONFIGS["1"],
  );
  assert.ok("error" in parsed);
});

test("flags syntax errors when values are not inside quotes", () => {
  const text = [
    "Responsible Engineer: Bruno Abousleiman",
    'Board Name: "Digital Safety Board"',
    'Board Nickname: "DSB"',
    'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
    'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    'Green: "< 1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");

  const errors = validateDashboardConfigSyntax(text);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Responsible Engineer value must be inside " "/);

  const parsed = parseDashboardConfigText(text, DASHBOARD_CONFIGS["1"]);
  assert.ok("error" in parsed);
  assert.match(parsed.error, /must be inside " "/);
});

test("flags invalid LED threshold syntax", () => {
  const text = [
    'Responsible Engineer: "Bruno Abousleiman"',
    'Board Name: "Digital Safety Board"',
    'Board Nickname: "DSB"',
    'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
    'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    'Green: "1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");

  const errors = validateDashboardConfigSyntax(text);
  assert.ok(errors.some((error) => /Green must use Green: "< N"/i.test(error)));
});

test("flags missing closing quote as a syntax error", () => {
  const text = [
    'Responsible Engineer: "Bruno Abousleiman"',
    'Board Name: "Digital Safety Board',
    'Board Nickname: "DSB"',
    'JIRA Epic Link: "https://mach-industries.atlassian.net/browse/EE-2220"',
    'Smartsheet Link: "https://app.smartsheet.com/sheets/MQWP7M7WVcg7J7q5JFqvwV8mMpHVMx8w3wmXwMW1"',
    'Green: "< 1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");

  const errors = validateDashboardConfigSyntax(text);
  assert.ok(errors.some((error) => /missing a closing "/i.test(error)));
});

test("resolves dashboard config by project code", () => {
  assert.equal(getDashboardConfigForCode("DSB").dashboardId, "1");
  assert.equal(getDashboardConfigForCode("IND").boardName, "CPLD - Independent");
});

test("exposes default admin credentials", () => {
  assert.equal(DEFAULT_ADMIN_USERNAME, "admin");
  assert.equal(DEFAULT_ADMIN_PASSWORD, "esad");
});
