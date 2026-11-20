#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (v) => "#" + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
const lighten = (h, t) => toHex(rgb(h).map((v) => v + (255 - v) * t));
const darken = (h, f) => toHex(rgb(h).map((v) => v * f));

const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gam = (c) => 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
function toOklch(h) {
  const [r, g, b] = rgb(h).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, C: Math.hypot(a, bb), H: Math.atan2(bb, a) };
}
function fromOklch(L, C, H) {
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function fit(L, C, H) {
  let c = C;
  let v = fromOklch(L, c, H);
  while (v.some((x) => x < -0.001 || x > 1.001) && c > 0.002) {
    c *= 0.94;
    v = fromOklch(L, c, H);
  }
  return toHex(v.map(gam));
}

export const luminance = (h) => {
  const [r, g, b] = rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const PANEL = { light: "#ffffff", dark: "#18181b" };

const LIGHT_MIX = {
  g3a: ["l", 0.8], g3b: ["l", 0.6],
  g2a: ["l", 0.5], g2b: ["l", 0.24],
  g1a: ["l", 0.02], g1b: ["d", 0.8],
  ln1: ["d", 0.52], ln2: ["d", 0.74], ln3: ["l", 0.45],
  edge: ["d", 0.74],
};

const DARK_LEVEL = {
  g3a: [0.74, 0.8], g3b: [0.64, 0.8],
  g2a: [0.87, 1.0], g2b: [0.76, 1.15],
  g1a: [0.68, 1.1], g1b: [0.54, 1.1],
  ln1: [0.3, 0.95], ln2: [0.82, 0.9], ln3: [0.76, 0.6],
  edge: [0.93, 0.45],
};

export function paintsFor(hex) {
  const acc = toOklch(hex);
  const light = {};
  for (const [k, [mode, v]] of Object.entries(LIGHT_MIX)) light[k] = mode === "l" ? lighten(hex, v) : darken(hex, v);
  const dark = {};
  for (const [k, [L, c]] of Object.entries(DARK_LEVEL)) dark[k] = fit(L, acc.C * c, acc.H);
  light.sh = `rgb(${rgb(hex).join(" ")} / .32)`;
  dark.sh = "rgb(0 0 0 / .55)";
  return { light, dark };
}

export function report(hex) {
  const { light, dark } = paintsFor(hex);
  const rows = [];
  const check = (label, a, b, min, mode) => {
    const r = contrast(a, b);
    rows.push({ label: `${mode} ${label}`, ratio: r, min, ok: r >= min });
  };
  for (const [mode, p] of [["light", light], ["dark", dark]]) {
    check("marks (ln1) on body (g2 mid)", p.ln1, p.g2b, 3, mode);
    check("marks (ln1) on plate (g3 mid)", p.ln1, p.g3b, 3, mode);
    check("body (g2) against plate (g3)", p.g2b, p.g3b, 1.15, mode);
    check("t1 body (g1 mid) against panel", p.g1b, PANEL[mode], 3, mode);
    check("t2 body (g2 mid) against panel", p.g2b, PANEL[mode], mode === "dark" ? 6 : 1.6, mode);
    check("t3 plate (g3 mid) against panel", p.g3b, PANEL[mode], mode === "dark" ? 3 : 1.25, mode);
    check("rim (edge) against panel", p.edge, PANEL[mode], mode === "dark" ? 8 : 3, mode);
    check("t2 line (ln2) against panel", p.ln2, PANEL[mode], 2.5, mode);
  }
  return { light, dark, rows };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hex = process.argv[2];
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) {
    console.error("usage: node paints.mjs #RRGGBB [--json]");
    process.exit(1);
  }
  const { light, dark, rows } = report(hex);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ light, dark, rows }, null, 2));
    process.exit(0);
  }
  console.log(`accent ${hex}`);
  console.log("token  light    dark");
  for (const k of Object.keys(light)) console.log(`${k.padEnd(6)} ${light[k].padEnd(8)} ${dark[k]}`);
  console.log("\ncontrast (WCAG ratio)  target");
  for (const r of rows) console.log(`${r.ok ? "ok  " : "LOW "} ${r.ratio.toFixed(2).padStart(5)}  >= ${String(r.min).padEnd(4)} ${r.label}`);
  const low = rows.filter((r) => !r.ok);
  console.log(low.length ? `\n${low.length} LOW: choose a different accent lightness (55 to 65%) or hue shift, not new maths` : "\nall contrast targets met");
}
