#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const [dir, out = "preview.html"] = process.argv.slice(2);
if (!dir) {
  console.error("usage: node preview.mjs <dir-with-svgs> [out.html]");
  process.exit(1);
}

const MEDIA = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g;

function rewrite(svg, mode) {
  let result = "";
  let cursor = 0;
  for (const match of svg.matchAll(MEDIA)) {
    if (match.index < cursor) continue;
    let depth = 1;
    let i = match.index + match[0].length;
    while (depth && i < svg.length) depth += svg[i] === "{" ? 1 : svg[i] === "}" ? -1 : 0, i++;
    const body = svg.slice(match.index + match[0].length, i - 1);
    result += svg.slice(cursor, match.index) + (mode === "dark" ? body : "");
    cursor = i;
  }
  result += svg.slice(cursor);
  return result.replaceAll(":root", mode === "dark" ? ".pd" : ".pl");
}

const files = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();
const sizes = [16, 24, 48];
const cell = (svg, mode, size) =>
  `<span class="cell" style="width:${size}px;height:${size}px">${rewrite(svg, mode).replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)}</span>`;
const panel = (svg, mode) =>
  `<div class="p ${mode === "dark" ? "pd dark" : "pl"}">${sizes.map((s) => cell(svg, mode, s)).join("")}</div>`;

const rows = files
  .map((f) => {
    const svg = readFileSync(join(dir, f), "utf8");
    return `<div class="row"><div class="n">${basename(f, ".svg")}</div>${panel(svg, "light")}${panel(svg, "dark")}</div>`;
  })
  .join("\n");

writeFileSync(
  out,
  `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:13px system-ui;background:#fff}
.row{display:grid;grid-template-columns:130px 1fr 1fr;align-items:stretch}
.n{padding:18px;color:#444}
.p{display:flex;gap:28px;align-items:center;padding:18px 24px}
.pl{background:#fff;color:#27272a}.pd{background:#18181b;color:#e4e4e7}
.cell{display:inline-block;line-height:0}
</style>${rows}`,
);
console.log(`wrote ${out} (${files.length} icons)`);
