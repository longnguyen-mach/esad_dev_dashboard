import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PROGRAM_CONFIG,
  formatProgramConfigText,
  overdueThresholdsFromProgramConfig,
  parseProgramConfigText,
  validateProgramConfigSyntax,
} from "../lib/program-config.ts";

test("formats Dashboard Configuration text with LED overdue thresholds", () => {
  assert.equal(
    formatProgramConfigText(DEFAULT_PROGRAM_CONFIG),
    [
      'Dashboard Name: "MACH ESAD Development Dashboard"',
      'Program Lead: "Engineering Program Office"',
      'Green: "< 1"',
      'Yellow: "> 2"',
      'Red: "> 5"',
    ].join("\n"),
  );
  assert.deepEqual(overdueThresholdsFromProgramConfig(DEFAULT_PROGRAM_CONFIG), {
    greenLessThan: 1,
    yellowGreaterThan: 2,
    redGreaterThan: 5,
  });
});

test("parses Dashboard Configuration text including LED thresholds", () => {
  const text = [
    'Dashboard Name: "ESAD Avionics Dashboard"',
    'Program Lead: "Long Nguyen"',
    'Green: "< 2"',
    'Yellow: "> 4"',
    'Red: "> 9"',
  ].join("\n");
  const parsed = parseProgramConfigText(text);
  assert.ok("config" in parsed);
  assert.equal(parsed.config.dashboardName, "ESAD Avionics Dashboard");
  assert.equal(parsed.config.programLead, "Long Nguyen");
  assert.equal(parsed.config.ledGreenLessThan, 2);
  assert.equal(parsed.config.ledYellowGreaterThan, 4);
  assert.equal(parsed.config.ledRedGreaterThan, 9);
});

test("flags syntax errors when Dashboard Configuration values are unquoted", () => {
  const text = [
    "Dashboard Name: MACH ESAD Development Dashboard",
    'Program Lead: "Engineering Program Office"',
    'Green: "< 1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");
  const errors = validateProgramConfigSyntax(text);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Dashboard Name value must be inside " "/);
});

test("flags invalid LED threshold syntax in Dashboard Configuration", () => {
  const text = [
    'Dashboard Name: "MACH ESAD Development Dashboard"',
    'Program Lead: "Engineering Program Office"',
    'Green: "1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");
  const errors = validateProgramConfigSyntax(text);
  assert.ok(errors.some((error) => /Green must use Green: "< N"/i.test(error)));
});

test("flags missing closing quote for Program Lead", () => {
  const text = [
    'Dashboard Name: "MACH ESAD Development Dashboard"',
    'Program Lead: "Engineering Program Office',
    'Green: "< 1"',
    'Yellow: "> 2"',
    'Red: "> 5"',
  ].join("\n");
  const errors = validateProgramConfigSyntax(text);
  assert.ok(errors.some((error) => /missing a closing "/i.test(error)));
});
