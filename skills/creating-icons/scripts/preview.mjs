#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, basename, resolve, dirname } from "node:path";
import { openBrowser } from "./lib/cdp.mjs";
import { recordMotion } from "./lib/motion.mjs";

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
const motionDir = flag("--motion");
const freeze = Number(flag("--freeze") ?? 0.4);
const fps = Number(flag("--fps") ?? 30);
const [dir, out = "preview.html"] = argv;
if (!dir) {
  console.error(`usage: node preview.mjs <dir-with-svgs> [out.html] [--png out.png] [--motion outDir] [--cdp http://127.0.0.1:9333] [--freeze 0.4] [--fps 30]

--png     one sheet: light | dark by prefers-color-scheme | dark by .dark class. The three are real renders of the
          unmodified SVG CSS, and the script asserts the two dark ones resolve to identical paints (computed CSS variables) and that .light beats a dark OS.
--motion  records each icon's hover, on and off motion to <outDir>/<name>.gif and .mp4, writes frames and a contact sheet,
          and reports overflow past the 24 box, loop seams and reduced-motion behaviour.`);
  process.exit(1);
}

let counter = 0;
function unique(svg) {
  const n = ++counter;
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  let s = svg;
  for (const id of ids) s = s.replaceAll(`id="${id}"`, `id="${id}-${n}"`).replaceAll(`url(#${id})`, `url(#${id}-${n})`);
  return s;
}

function cell(svg, size, attrs = "") {
  const sized = svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`).replace(/<svg /, `<svg ${attrs} `);
  return `<span class="cell" style="width:${size}px;height:${size}px">${unique(sized)}</span>`;
}

const files = readdirSync(dir).filter((f) => f.endsWith(".svg") && !/-16\.svg$/.test(f)).sort();
const names = files.map((f) => basename(f, ".svg"));

let motionCss = "";
const rows = names
  .map((name) => {
    const full = readFileSync(join(dir, `${name}.svg`), "utf8");
    const smallPath = join(dir, `${name}-16.svg`);
    const small = existsSync(smallPath) ? readFileSync(smallPath, "utf8") : full;
    const cssPath = join(dir, `${name}.css`);
    const hasMotion = existsSync(cssPath);
    if (hasMotion) {
      const css = readFileSync(cssPath, "utf8");
      motionCss += css + "\n" + css.replace(/:hover/g, ".hov");
    }
    const cells = [
      cell(small, 16),
      cell(full, 16),
      cell(full, 24),
      cell(full, 48),
      cell(full, 96),
      hasMotion ? `<i class="sep"></i>${cell(full, 48, 'data-state="on"')}<span class="hov">${cell(full, 48)}</span>` : "",
    ].join("");
    return `<div class="row"><div class="n">${name}</div><div class="p">${cells}</div></div>`;
  })
  .join("\n");

const css = `
body{margin:0;font:12px system-ui;background:#fff;color:#27272a}
@media (prefers-color-scheme:dark){html:not(.light) body{background:#18181b;color:#e4e4e7}}
html.dark body{background:#18181b;color:#e4e4e7}
.row{display:flex;align-items:center}
.n{width:100px;flex:none;padding:0 12px;color:#777;font-size:11px}
.names-off .n{display:none}
.p{display:flex;gap:16px;align-items:center;padding:14px 18px}
.cell{display:inline-block;line-height:0}
.sep{width:1px;height:48px;background:currentColor;opacity:.15}
${motionCss}`;

const script = `
const t = ${freeze};
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.querySelectorAll(".hov").forEach((el) => {
    el.getAnimations({ subtree: true }).forEach((a) => {
      const d = a.effect.getComputedTiming().duration;
      a.pause();
      a.currentTime = d * t;
    });
  });
}));`;

const page = ({ interactive, names: showNames }) => `<!doctype html><meta charset="utf-8"><meta name="color-scheme" content="light dark"><style>${css}</style>
<body class="${showNames ? "" : "names-off"}">
${interactive ? `<div style="padding:10px 14px;font-size:11px;opacity:.7">columns: 16 small variant, 16 full, 24, 48, 96, on state, mid-move. Follows the OS theme. <button onclick="document.documentElement.classList.toggle('dark')">toggle .dark</button></div>` : ""}
${rows}
<script>${script}</script>`;

writeFileSync(out, page({ interactive: true, names: true }));
console.log(`wrote ${out} (${names.length} icons)`);

const tmpDir = join(dirname(resolve(out)), ".preview-tmp");
mkdirSync(tmpDir, { recursive: true });
const stem = join(tmpDir, "sheet");
const runs = [
  { key: "light", scheme: "light", cls: "", names: true },
  { key: "media", scheme: "dark", cls: "", names: false },
  { key: "class", scheme: "light", cls: "dark", names: false },
  { key: "darkOsLightClass", scheme: "dark", cls: "light", names: true },
];

const browser = png || motionDir ? await openBrowser(cdp) : null;
try {
  if (png) {
    const shots = {};
    const vars = {};
    for (const r of runs) {
      const file = `${stem}.${r.key}.html`;
      writeFileSync(file, page({ interactive: false, names: r.names }).replace("<!doctype html>", `<!doctype html><html class="${r.cls}">`));
      const p = await browser.newPage({ width: r.names ? 580 : 480, colorScheme: r.scheme });
      try {
        await p.load(file);
        await new Promise((res) => setTimeout(res, 400));
        await p.fitHeight();
        await new Promise((res) => setTimeout(res, 150));
        shots[r.key] = await p.shot();
        vars[r.key] = await p.eval(`[...document.querySelectorAll('svg.ic')].map((s) => { const c = getComputedStyle(s); return ['g1a','g1b','g2a','g2b','g3a','g3b','ln1','ln2','ln3','edge','sh','ring'].map((k) => c.getPropertyValue('--' + k).trim()).join('|'); }).join('\\n')`);
      } finally {
        await p.close();
      }
    }
    const darkSame = vars.media === vars.class && vars.media !== vars.light;
    const lightWins = vars.light === vars.darkOsLightClass;
    const uri = (b) => `data:image/png;base64,${b.toString("base64")}`;
    const sheet = `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:12px system-ui;background:#888;display:flex;gap:6px}
figure{margin:0}figcaption{background:#444;color:#fff;padding:6px 10px}img{display:block;zoom:.5}</style>
<figure><figcaption>light</figcaption><img src="${uri(shots.light)}"></figure>
<figure><figcaption>dark: prefers-color-scheme (${darkSame ? "matches .dark" : "DIFFERS from .dark"})</figcaption><img src="${uri(shots.media)}"></figure>
<figure><figcaption>dark: .dark class on html, OS light</figcaption><img src="${uri(shots.class)}"></figure>`;
    const sheetFile = `${stem}.sheet.html`;
    writeFileSync(sheetFile, sheet);
    const p = await browser.newPage({ width: 1600, height: 900, dpr: 2 });
    try {
      await p.load(sheetFile);
      await new Promise((res) => setTimeout(res, 300));
      await p.fitHeight();
      writeFileSync(resolve(png), await p.shot());
    } finally {
      await p.close();
    }
    console.log(`wrote ${png}`);
    console.log(`dark paths (prefers-color-scheme vs .dark), computed paints of every icon: ${darkSame ? "identical" : "DIFFER: fix the CSS in compose.mjs"}`);
    console.log(`.light class beats a dark OS: ${lightWins ? "yes" : "NO: fix the :not(.light) guard"}`);
    if (!darkSame || !lightWins) process.exitCode = 1;
  }
  if (motionDir) {
    const bad = await recordMotion({ browser, dir: resolve(dir), names, outDir: resolve(motionDir), fps });
    if (bad) process.exitCode = 1;
  }
} finally {
  await browser?.close();
  rmSync(tmpDir, { recursive: true, force: true });
}
