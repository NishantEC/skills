#!/usr/bin/env node
const hex = process.argv[2];
if (!/^#[0-9a-f]{6}$/i.test(hex || "")) {
  console.error("usage: node paints.mjs #RRGGBB");
  process.exit(1);
}

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (v) =>
  "#" + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
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
  while (v.some((x) => x < 0 || x > 1) && c > 0.002) {
    c *= 0.94;
    v = fromOklch(L, c, H);
  }
  return toHex(v.map(gam));
}
const forDark = (light) => {
  const src = toOklch(light);
  const acc = toOklch(hex);
  return fit(0.34 + 0.54 * src.L, Math.max(src.C * 1.2, acc.C * 0.5), acc.H);
};

const light = { t1: darken(hex, 0.76), t2: lighten(hex, 0.32), t3: lighten(hex, 0.58), line: darken(hex, 0.78) };
const dark = {
  t1: forDark(light.t1),
  t2: forDark(light.t2),
  t3: forDark(lighten(hex, 0.75)),
  line: forDark(light.line),
};

console.log(`accent ${hex}`);
for (const k of ["t1", "t2", "t3", "line"]) console.log(`${k.padEnd(5)} light ${light[k]}  dark ${dark[k]}`);
