import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PROGRAM_CONFIG,
  formatProgramConfigText,
  parseProgramConfigText,
  validateProgramConfigSyntax,
} from "../lib/program-config.ts";

test("formats Dashboard Configuration text with quoted fields", () => {
  assert.equal(
    formatProgramConfigText(DEFAULT_PROGRAM_CONFIG),
    [
      'Dashboard Name: "MACH ESAD Development Dashboard"',
      'Program Lead: "Engineering Program Office"',
    ].join("\n"),
  );
});

test("parses Dashboard Configuration text", () => {
  const text = [
    'Dashboard Name: "ESAD Avionics Dashboard"',
    'Program Lead: "Long Nguyen"',
  ].join("\n");
  const parsed = parseProgramConfigText(text);
  assert.ok("config" in parsed);
  assert.equal(parsed.config.dashboardName, "ESAD Avionics Dashboard");
  assert.equal(parsed.config.programLead, "Long Nguyen");
});

test("flags syntax errors when Dashboard Configuration values are unquoted", () => {
  const text = [
    "Dashboard Name: MACH ESAD Development Dashboard",
    'Program Lead: "Engineering Program Office"',
  ].join("\n");
  const errors = validateProgramConfigSyntax(text);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Dashboard Name value must be inside " "/);
});

test("flags missing closing quote for Program Lead", () => {
  const text = [
    'Dashboard Name: "MACH ESAD Development Dashboard"',
    'Program Lead: "Engineering Program Office',
  ].join("\n");
  const errors = validateProgramConfigSyntax(text);
  assert.ok(errors.some((error) => /missing a closing "/i.test(error)));
});
