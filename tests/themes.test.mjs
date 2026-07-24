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

test("Lucky is its own concrete theme (not a roll into Futuristic)", () => {
  assert.deepEqual([...LUCKY_THEME_POOL], ["lucky"]);
  assert.equal(resolveThemeId("lucky"), "lucky");
  assert.equal(resolveThemeId("lucky", () => 0.9), "lucky");
  assert.equal(resolveThemeId("futuristic"), "futuristic");
  assert.equal(resolveThemeId("light"), "light");
  assert.notEqual(resolveThemeId("lucky"), "futuristic");
});

test("validates theme ids", () => {
  assert.equal(isThemeId("futuristic"), true);
  assert.equal(isThemeId("lucky"), true);
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

test("dark theme uses graphite steel palette distinct from default blue", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /Graphite \/ steel|ops-black|#121316|#c8ccd6/);
  // Dark should not reuse Default’s bright blue accent.
  const darkBlock = css.match(
    /\/\* Graphite[\s\S]*?\[data-theme="dark"\] \{[\s\S]*?\n\}/,
  );
  assert.ok(darkBlock);
  assert.doesNotMatch(darkBlock[0], /--blue:\s*#248dff/);
  assert.doesNotMatch(darkBlock[0], /--blue:\s*#3d8de0/);
  assert.match(darkBlock[0], /--blue:\s*#aeb4c2/);
});

test("lucky theme ships a distinct warm brass motif set", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-theme="lucky"\]/);
  assert.match(css, /lucky-motifs\.svg/);
  assert.match(css, /lucky-motifs-dense\.svg/);
  assert.match(css, /#e0b45a|#c8963a|#140e08/);

  const primary = await readFile(
    new URL("../public/themes/lucky-motifs.svg", import.meta.url),
    "utf8",
  );
  const dense = await readFile(
    new URL("../public/themes/lucky-motifs-dense.svg", import.meta.url),
    "utf8",
  );
  assert.match(primary, /Compass|Star|luck|reticle|chevron|brass/i);
  assert.match(dense, /stars|chevron|compass|olive|hash/i);
  assert.doesNotMatch(primary, /#3ec7ff/);
  assert.doesNotMatch(dense, /#3ec7ff/);
});
