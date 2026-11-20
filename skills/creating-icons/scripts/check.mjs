#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { bbox } from "./lib/path.mjs";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node check.mjs <dir-with-svgs>");
  process.exit(1);
}

let failures = 0;
const files = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();
for (const f of files) {
  const name = basename(f, ".svg");
  const svg = readFileSync(join(dir, f), "utf8");
  const glyph = /class="[^"]*\bgl\b/.test(svg);
  const errs = [];
  const warns = [];
  const stripped = svg.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<defs>[\s\S]*?<\/defs>/g, "").replace(/<circle[^>]*data-part="badge"[^>]*>/g, "");

  if (!/viewBox="0 0 24 24"/.test(svg)) errs.push('viewBox must be "0 0 24 24"');
  if (/<!--/.test(svg)) errs.push("comments inside the file");
  if (/<(image|script|foreignObject)/.test(svg) || /href=/.test(svg)) errs.push("external or active content");
  if (!new RegExp(`${glyph ? "gl" : "ic"}-${name.replace(/[^a-z0-9-]/g, "")}`).test(svg)) errs.push(`class ${glyph ? "gl" : "ic"}-${name} missing`);
  for (const id of [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])) {
    if (!id.startsWith(`${glyph ? "gl" : "ic"}-${name}-`)) errs.push(`id "${id}" must start with ${glyph ? "gl" : "ic"}-${name}-`);
  }

  const paths = [...stripped.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*>/g)].map((m) => ({ d: m[1], tag: m[0] }));
  const live = glyph ? [3, 21] : [2.5, 21.5];
  const all = { x0: 99, y0: 99, x1: -99, y1: -99 };
  for (const p of paths) {
    const b = bbox(p.d);
    all.x0 = Math.min(all.x0, b.x0); all.y0 = Math.min(all.y0, b.y0);
    all.x1 = Math.max(all.x1, b.x1); all.y1 = Math.max(all.y1, b.y1);
  }
  for (const c of stripped.matchAll(/<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*r="([\d.]+)"/g)) {
    const [cx, cy, r] = [+c[1], +c[2], +c[3]];
    all.x0 = Math.min(all.x0, cx - r); all.y0 = Math.min(all.y0, cy - r);
    all.x1 = Math.max(all.x1, cx + r); all.y1 = Math.max(all.y1, cy + r);
  }
  const eps = 0.05;
  if (all.x0 < live[0] - eps || all.y0 < live[0] - eps || all.x1 > live[1] + eps || all.y1 > live[1] + eps)
    errs.push(`geometry ${all.x0.toFixed(1)},${all.y0.toFixed(1)} to ${all.x1.toFixed(1)},${all.y1.toFixed(1)} leaves the live area ${live[0]} to ${live[1]}`);
  const w = all.x1 - all.x0, h = all.y1 - all.y0;
  if (Math.max(w, h) < (glyph ? 11 : 16)) warns.push(`shape spans only ${w.toFixed(1)} x ${h.toFixed(1)}: too small, grow it`);
  if (!glyph && Math.min(w, h) < 11) warns.push(`narrow axis is only ${Math.min(w, h).toFixed(1)} units: widen the body to at least 11 or add wings, fins or a halo that carry the silhouette`);
  const cx = (all.x0 + all.x1) / 2, cy = (all.y0 + all.y1) / 2;
  if (Math.abs(cx - 12) > 1.6 || Math.abs(cy - 12) > 1.6) warns.push(`visual box centre is ${cx.toFixed(1)},${cy.toFixed(1)}, off the 12,12 centre: fine only if mass sits the other way`);

  if (!glyph) {
    const count = (re) => (svg.match(re) || []).length;
    const fills = [1, 2, 3].map((t) => count(new RegExp(`fill="url\\(#ic-${name}-g${t}\\)"`, "g")) + count(new RegExp(`class="l${t}"`, "g")));
    const shapes = fills.reduce((a, b) => a + b, 0) + count(/class="hl"/g);
    if (shapes < 4) errs.push(`only ${shapes} pieces: colour icons need at least 4`);
    const tiers = fills.filter((n) => n > 0).length;
    if (tiers < 3) errs.push(`uses ${tiers} of 3 tiers (t1 ${fills[0]}, t2 ${fills[1]}, t3 ${fills[2]}): need all three`);
    if (shapes > 14) warns.push(`${shapes} pieces: over the detail budget, merge or drop`);
    if (!/<filter/.test(svg)) errs.push("no drop shadow filter");
    if (!/class="rim"/.test(svg) && !/--edge/.test(svg)) errs.push("no rim");
    if (!/<linearGradient/.test(svg)) errs.push("no gradients (depth cue missing)");
    const parts = (svg.match(/data-part="/g) || []).length;
    if (parts === 0) warns.push("no data-part: nothing can move");
    let cssExists = true;
    try { readFileSync(join(dir, `${name}.css`)); } catch { cssExists = false; }
    if (!cssExists) warns.push(`no ${name}.css: colour icons ship hover motion and an on state`);
    else {
      const css = readFileSync(join(dir, `${name}.css`), "utf8");
      if (!/prefers-reduced-motion/.test(css)) errs.push("css missing prefers-reduced-motion block");
      if (!/@keyframes ei-/.test(css)) errs.push("css has no ei- hover keyframes");
      if (!/data-state="on"/.test(css)) errs.push('css has no [data-state="on"] pose');
    }
    for (const p of paths) {
      const sw = p.tag.match(/stroke-width="([\d.]+)"/);
      if (sw && /class="l\d"/.test(p.tag) && +sw[1] < 1.6) warns.push(`line width ${sw[1]} is under 1.6: it fades at 16px`);
    }
  } else {
    if (!/stroke-width="1.75"/.test(svg) && paths.length) errs.push("glyph stroke must be 1.75");
    if (/class="[^"]*\bt[123]\b/.test(svg) || /linearGradient/.test(svg)) errs.push("glyphs are mono: no tiers or gradients");
  }
  const status = errs.length ? "FAIL" : warns.length ? "warn" : "ok  ";
  if (errs.length) failures++;
  console.log(`${status} ${name}`);
  for (const e of errs) console.log(`     error: ${e}`);
  for (const w of warns) console.log(`     note:  ${w}`);
}
console.log(failures ? `\n${failures} icon(s) failing` : "\nstatic checks pass (still look at the preview)");
process.exit(failures ? 1 : 0);
