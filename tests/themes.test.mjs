import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  LUCKY_THEME_POOL,
  isThemeId,
  resolveThemeId,
  THEME_OPTIONS,
} from "../lib/themes.ts";

test("exposes Default plus four selectable themes", () => {
  assert.deepEqual(
    THEME_OPTIONS.map((option) => option.id),
    ["default", "light", "dark", "futuristic", "lucky"],
  );
  assert.equal(THEME_OPTIONS[0]?.label, "Theme Default");
  assert.equal(THEME_OPTIONS[4]?.label, "Theme 4: Lucky");
});

test("Lucky resolves only to defense / war themes", () => {
  assert.deepEqual([...LUCKY_THEME_POOL], ["default", "dark", "futuristic"]);
  assert.equal(resolveThemeId("lucky", () => 0), "default");
  assert.equal(resolveThemeId("lucky", () => 0.4), "dark");
  assert.equal(resolveThemeId("lucky", () => 0.9), "futuristic");
  assert.equal(resolveThemeId("light"), "light");
});

test("validates theme ids", () => {
  assert.equal(isThemeId("futuristic"), true);
  assert.equal(isThemeId("neon"), false);
});

test("futuristic theme ships layered defense motif artwork", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /futuristic-motifs\.svg/);
  assert.match(css, /futuristic-motifs-dense\.svg/);

  const primary = await readFile(
    new URL("../public/themes/futuristic-motifs.svg", import.meta.url),
    "utf8",
  );
  const dense = await readFile(
    new URL("../public/themes/futuristic-motifs-dense.svg", import.meta.url),
    "utf8",
  );
  assert.match(primary, /Fighter jet|Stealth|Quadcopter|Ballistic|Rocket|Satellite|Radar/i);
  assert.match(dense, /Jet|Drone|Missile|Rocket|UAV|Chevron/i);
  assert.match(primary, /<circle/);
  assert.match(dense, /stroke-dasharray/);
});
