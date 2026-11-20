#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { screenshot } from "./lib/shot.mjs";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const cdp = flag("--cdp");
const png = flag("--png");
const freeze = Number(flag("--freeze") ?? 0.4);
const [dir, out = "preview.html"] = argv;
if (!dir) {
  console.error("usage: node preview.mjs <dir-with-svgs> [out.html] [--png out.png] [--cdp http://127.0.0.1:9333] [--freeze 0.4]");
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
    while (depth && i < svg.length) (depth += svg[i] === "{" ? 1 : svg[i] === "}" ? -1 : 0), i++;
    const body = svg.slice(match.index + match[0].length, i - 1);
    result += svg.slice(cursor, match.index) + (mode === "dark" ? body : "");
    cursor = i;
  }
  result += svg.slice(cursor);
  return result.replaceAll(":root", mode === "dark" ? ".pd" : ".pl");
}

let counter = 0;
function unique(svg) {
  const n = ++counter;
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  let s = svg;
  for (const id of ids) s = s.replaceAll(`id="${id}"`, `id="${id}-${n}"`).replaceAll(`url(#${id})`, `url(#${id}-${n})`);
  return s;
}

const files = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();
const sizes = [16, 24, 48, 96];
const sized = (svg, size, extra = "") =>
  rewriteSize(svg, size, extra);
function rewriteSize(svg, size, extra) {
  return svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`).replace(/<svg /, `<svg ${extra.replace("hov","")} `).replace(/class="ic /, extra.includes("hov") ? `class="hov ic ` : `class="ic `);
}
const cell = (svg, mode, size, extra = "") => `<span class="cell" style="width:${size}px;height:${size}px">${unique(sized(rewrite(svg, mode), size, extra))}</span>`;
const panel = (svg, mode, cells) => `<div class="p ${mode === "dark" ? "pd dark" : "pl"}">${cells}</div>`;

let motionCss = "";
const rows = files
  .map((f) => {
    const name = basename(f, ".svg");
    const svg = readFileSync(join(dir, f), "utf8");
    const cssPath = join(dir, `${name}.css`);
    const hasMotion = existsSync(cssPath);
    if (hasMotion) {
      const css = readFileSync(cssPath, "utf8");
      motionCss += css + "\n" + css.replace(/:hover/g, ".hov");
    }
    const std = (mode) => panel(svg, mode, sizes.map((s) => cell(svg, mode, s)).join(""));
    const motion = (mode) =>
      hasMotion
        ? panel(
            svg,
            mode,
            [
              `<span class="lab">off</span>${cell(svg, mode, 48)}`,
              `<span class="lab">on</span>${cell(svg, mode, 48, 'data-state="on"')}`,
              `<span class="lab">mid-move</span><span class="hov">${cell(svg, mode, 48, "hov")}</span>`,
              `<span class="lab">hover me</span>${cell(svg, mode, 48)}`,
            ].join(""),
          )
        : panel(svg, mode, '<span class="lab">no motion</span>');
    return `<div class="row"><div class="n">${name}${hasMotion ? "" : " (glyph or static)"}</div>${std("light")}${std("dark")}${motion("light")}${motion("dark")}</div>`;
  })
  .join("\n");

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:12px system-ui;background:#fff}
.head,.row{display:grid;grid-template-columns:130px 330px 330px 340px 340px;align-items:stretch}
.head div{padding:8px 12px;color:#777;border-bottom:1px solid #eee}
.n{padding:14px 12px;color:#444}
.p{display:flex;gap:18px;box-sizing:border-box;align-items:center;padding:14px 18px}
.pl{background:#fff;color:#27272a}.pd{background:#18181b;color:#e4e4e7}
.cell{display:inline-block;line-height:0}
.lab{font-size:10px;color:#999;writing-mode:vertical-rl;transform:rotate(180deg)}
${motionCss}
</style>
<div class="head"><div>icon</div><div>light 16 / 24 / 48 / 96</div><div>dark 16 / 24 / 48 / 96</div><div>light motion</div><div>dark motion</div></div>
${rows}
<script>
const t = ${freeze};
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.querySelectorAll(".hov").forEach((el) => {
    el.getAnimations({ subtree: true }).forEach((a) => {
      const d = a.effect.getComputedTiming().duration;
      a.pause();
      a.currentTime = d * t;
    });
  });
}));
</script>`;

writeFileSync(out, html);
console.log(`wrote ${out} (${files.length} icons)`);
if (png) {
  await screenshot({ htmlPath: resolve(out), out: resolve(png), cdp });
  console.log(`wrote ${png}`);
}
