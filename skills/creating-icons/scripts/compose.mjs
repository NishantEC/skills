#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { paintsFor } from "./paints.mjs";
import { mirrorPath, bbox } from "./lib/path.mjs";

const usage = `usage: node compose.mjs <spec.json> [outDir]
Writes <name>.svg (and <name>.css when the spec has "motion") next to the spec or into outDir.`;

const [specPath, outDir = dirname(specPath)] = process.argv.slice(2);
if (!specPath) {
  console.error(usage);
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const name = spec.name || basename(specPath, ".json");
mkdirSync(outDir, { recursive: true });

const num = (n) => String(Math.round(n * 100) / 100);

function composeGlyph() {
  const c = `gl-${name}`;
  const parts = [];
  for (const d of spec.washes || []) parts.push(`<path d="${d}" fill="currentColor" fill-opacity=".22"/>`);
  if (spec.lines) parts.push(`<path d="${spec.lines}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`);
  for (const [x, y] of spec.dots || []) parts.push(`<circle cx="${x}" cy="${y}" r="1.5" fill="currentColor"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="gl ${c}" fill="none">
  <style>
    .${c}{color:var(--icon-ink,#27272a)}
    @media (prefers-color-scheme:dark){:root:not(.light):not([data-theme=light]) .${c}{color:var(--icon-ink,#e4e4e7)}}
    :root.dark .${c},:root[data-theme=dark] .${c}{color:var(--icon-ink,#e4e4e7)}
  </style>
  ${parts.join("\n  ")}
</svg>
`;
}

function expand(pieces) {
  const out = [];
  for (const p of pieces) {
    out.push(p);
    if (p.mirror) out.push({ ...p, d: mirrorPath(p.d, p.mirror === true ? 12 : p.mirror), mirror: false });
  }
  return out;
}

function resolveSmall(pieces) {
  const out = [];
  for (const p of pieces) {
    if (p.tier === "gloss") {
      if (p.sm === true) out.push(p);
      continue;
    }
    if (p.sm === false) continue;
    const q = p.sm && typeof p.sm === "object" ? { ...p, ...p.sm } : { ...p };
    delete q.sm;
    if (q.kind === "line") q.width = Math.max(q.width || 1.8, 2);
    out.push(q);
  }
  return out;
}

function smallWarnings(pieces) {
  const warns = [];
  const t1 = pieces.filter((p) => p.tier === 1).length;
  if (t1 > 3) warns.push(`${t1} tier-1 pieces at 16px (max 3): mark more with "sm":false`);
  if (!pieces.some((p) => p.tier === 3)) warns.push("no tier-3 piece at 16px: keep one depth cue");
  for (const p of pieces) {
    if (p.kind === "line" || p.tier === "gloss") continue;
    const b = bbox(p.d);
    const w = Math.min(b.x1 - b.x0, b.y1 - b.y0);
    if (w < 2.5) warns.push(`a tier-${p.tier}${p.part ? ` "${p.part}"` : ""} shape is ${w.toFixed(1)} units on its narrow axis: under 2.5 it vanishes at 16px, grow it with an "sm" override`);
  }
  return warns;
}

function composeIcon(small = false) {
  const c = `ic-${name}`;
  const idp = small ? `ic-${name}-sm` : c;
  const edge = spec.edge || "outside";
  const { light, dark } = paintsFor(spec.accent);
  const vars = (p) => Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(";");
  const ring = { light: "#fff", dark: "#18181b" };
  const pieces = expand(small ? resolveSmall(spec.pieces) : spec.pieces);
  if (small) for (const w of smallWarnings(pieces)) console.error(`warn ${name}-16: ${w}`);
  const clips = [];
  let defs = "";
  for (const t of [1, 2, 3]) {
    defs += `<linearGradient id="${idp}-g${t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="g${t}a"/><stop offset="1" class="g${t}b"/></linearGradient>`;
  }
  defs += `<filter id="${idp}-sh" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.1"/><feOffset dy="1.3" result="o"/><feFlood class="sh"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const cuts = (spec.cuts || []).filter((k) => !(small && k.sm === false));
  const globalCuts = cuts.filter((k) => !k.part);
  const maskFor = (list, id) =>
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28"><rect x="-2" y="-2" width="28" height="28" fill="#fff"/>${list
      .map((k) => (k.width ? `<path d="${k.d}" stroke="#000" stroke-width="${k.width}" stroke-linecap="round" fill="none"/>` : `<path d="${k.d}" fill="#000"/>`))
      .join("")}</mask>`;
  if (globalCuts.length) defs += maskFor(globalCuts, `${idp}-m`);
  const partCuts = {};
  for (const k of cuts.filter((k) => k.part)) (partCuts[k.part] ||= []).push(k);
  for (const [part, list] of Object.entries(partCuts)) defs += maskFor(list, `${idp}-m-${part}`);

  let clipN = 0;
  const draw = (p) => {
    if (p.tier === "gloss") return `<path class="hl" d="${p.d}"/>`;
    if (p.kind === "line") return `<path class="l${p.tier}" d="${p.d}" stroke-width="${p.width || 1.8}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const fill = `<path d="${p.d}" fill="url(#${idp}-g${p.tier})"/>`;
    if (edge === "none" || (edge === "inside" && p.tier === 1)) return fill;
    if (edge === "outside") return `<path class="rim" d="${p.d}" stroke-width="1.5" stroke-linejoin="round"/>${fill}`;
    const id = `${idp}-c${clipN++}`;
    clips.push(id);
    return `<clipPath id="${id}"><path d="${p.d}"/></clipPath>${fill}<path class="rim" d="${p.d}" stroke-width="2.2" stroke-linejoin="round" clip-path="url(#${id})"/>`;
  };

  const groups = [];
  for (const p of pieces) {
    const last = groups[groups.length - 1];
    if (last && p.part && last.part === p.part) last.items.push(p);
    else groups.push({ part: p.part, items: [p] });
  }
  const body = groups
    .map((g) => {
      const inner = g.items.map(draw).join("");
      if (!g.part) return inner;
      const m = partCuts[g.part] ? ` mask="url(#${idp}-m-${g.part})"` : "";
      return `<g data-part="${g.part}"${m}>${inner}</g>`;
    })
    .join("\n    ");
  const badge = spec.badge
    ? `\n    <circle data-part="badge" class="bd" cx="${spec.badge.cx}" cy="${spec.badge.cy}" r="${spec.badge.r}" fill="url(#${idp}-g1)" stroke-width="1.2"/>`
    : "";

  const css = `
    .${c}{${vars(light)};--ring:${ring.light}}
    @media (prefers-color-scheme:dark){:root:not(.light):not([data-theme=light]) .${c}{${vars(dark)};--ring:${ring.dark}}}
    :root.dark .${c},:root[data-theme=dark] .${c}{${vars(dark)};--ring:${ring.dark}}
    .${c} .g1a{stop-color:var(--g1a)}.${c} .g1b{stop-color:var(--g1b)}
    .${c} .g2a{stop-color:var(--g2a)}.${c} .g2b{stop-color:var(--g2b)}
    .${c} .g3a{stop-color:var(--g3a)}.${c} .g3b{stop-color:var(--g3b)}
    .${c} .l1{stroke:var(--ln1)}.${c} .l2{stroke:var(--ln2)}.${c} .l3{stroke:var(--ln3)}
    .${c} .rim{stroke:var(--edge)}.${c} .bd{stroke:var(--ring)}
    .${c} .sh{flood-color:var(--sh)}
    .${c} .hl{fill:#fff;fill-opacity:.42}${spec.badge ? `
    .${c} [data-part=badge]{transform-box:fill-box;transform-origin:center;transform:scale(0)}
    .${c}[data-state=on] [data-part=badge]{transform:scale(1)}` : ""}`;
  const cutAttr = globalCuts.length ? ` mask="url(#${idp}-m)"` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${small ? 16 : 24}" height="${small ? 16 : 24}" class="ic ${c}${small ? " ic-sm" : ""}" fill="none" overflow="visible">
  <style>${css}
  </style>
  <defs>${defs}</defs>
  <g filter="url(#${idp}-sh)">
  <g${cutAttr}>
    ${body}
  </g>${badge}
  </g>
</svg>
`;
  return svg;
}

function composeCss() {
  const m = spec.motion;
  const c = `.ic-${name}`;
  const hov = `${c}:hover,:hover>${c}`;
  const on = `${c}[data-state="on"]`;
  const part = (p) => `[data-part="${p}"]`;
  const out = [];
  out.push(`${c} [data-part]{transform-box:fill-box;transform-origin:center}`);
  const parts = new Set([...(m.hover || []).map((h) => h.part), ...(m.on || []).map((h) => h.part)]);
  const trans = `transform 380ms cubic-bezier(.34,1.45,.64,1),opacity 260ms ease,stroke-dashoffset 380ms ease`;
  for (const p of parts) {
    const spec2 = [...(m.hover || []), ...(m.on || [])].find((h) => h.part === p && h.origin);
    const box = spec2?.box === "view" ? "transform-box:view-box;" : "";
    out.push(`${c} ${part(p)}{${box}${spec2 ? `transform-origin:${spec2.origin};` : ""}transition:${trans}}`);
  }
  if (spec.badge) out.push(`${c} [data-part="badge"]{transform:scale(0);transform-origin:center;transition:transform 420ms cubic-bezier(.68,-.55,.27,1.55)}`);
  for (const h of m.rest || []) out.push(`${c} ${part(h.part)}{${h.css}}`);
  out.push("");
  for (const h of m.hover || []) {
    const kf = `ei-${name}-${h.move || h.part}`;
    out.push(`${hov.split(",").map((s) => `${s} ${part(h.part)}`).join(",")}{animation:${kf} ${h.duration || 900}ms ${h.ease || "ease-in-out"}${h.delay ? ` ${h.delay}ms` : ""}}`);
  }
  out.push("");
  for (const h of m.on || []) out.push(`${on} ${part(h.part)}{${h.css}${h.delay ? `;transition-delay:${h.delay}ms` : ""}}`);
  if (spec.badge) out.push(`${on} [data-part="badge"]{transform:scale(1);transition-delay:${m.badgeDelay ?? 200}ms}`);
  out.push("");
  for (const h of m.hover || []) out.push(`@keyframes ei-${name}-${h.move || h.part}{${h.keyframes}}`);
  for (const l of m.loops || []) {
    out.push(`${on} ${part(l.part)}{animation:es-${name}-${l.move} ${l.duration || 2400}ms ease-in-out infinite}`);
    out.push(`@keyframes es-${name}-${l.move}{${l.keyframes}}`);
  }
  out.push("");
  out.push(`@media (prefers-reduced-motion:reduce){${c} [data-part],${c}:hover [data-part],:hover>${c} [data-part]{animation:none!important;transition:none!important}}`);
  return out.join("\n") + "\n";
}

const svg = spec.kind === "glyph" ? composeGlyph() : composeIcon();
writeFileSync(join(outDir, `${name}.svg`), svg);
const wrote = [`${name}.svg`];
if (spec.kind !== "glyph") {
  writeFileSync(join(outDir, `${name}-16.svg`), composeIcon(true));
  wrote.push(`${name}-16.svg`);
}
if (spec.motion && spec.kind !== "glyph") {
  writeFileSync(join(outDir, `${name}.css`), composeCss());
  wrote.push(`${name}.css`);
}
console.log(`wrote ${wrote.join(", ")} in ${outDir}`);
