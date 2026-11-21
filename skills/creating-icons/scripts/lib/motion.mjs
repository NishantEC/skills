import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const STAGE = 144;
const SCALE = 4;
const MARGIN = 24;
const RIM = 0.75;
const SEAM_TOLERANCE = 0.08;
const hasFfmpeg = () => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

function stageHtml(svg, css, dark) {
  const sized = svg.replace(/width="\d+" height="\d+"/, `width="${24 * SCALE}" height="${24 * SCALE}"`);
  const live = css.replace(/:hover/g, ".hov");
  return `<!doctype html><html class="${dark ? "dark" : ""}"><meta charset="utf-8"><style>
body{margin:0;background:${dark ? "#18181b" : "#fff"}}
#wrap{position:absolute;left:${MARGIN}px;top:${MARGIN}px;width:${24 * SCALE}px;height:${24 * SCALE}px}
#guide{position:absolute;inset:0;outline:1px dashed rgb(228 68 68 / .55);pointer-events:none}
#live{position:absolute;left:${2.5 * SCALE}px;top:${2.5 * SCALE}px;width:${19 * SCALE}px;height:${19 * SCALE}px;outline:1px dotted rgb(120 120 120 / .35);pointer-events:none}
svg{display:block}
${live}</style>
<div id="wrap">${sized}<div id="live"></div><div id="guide"></div></div>
<script>
const wrap = document.getElementById("wrap");
const svg = wrap.querySelector("svg");
const M = (window.M = {
  cur: [],
  settle() {
    svg.querySelectorAll("[data-part]").forEach((e) => getComputedStyle(e).transform);
    getComputedStyle(svg).opacity;
  },
  begin(kind) {
    M.cur.forEach((a) => a.cancel());
    if (kind === "hover") { svg.classList.add("hov"); wrap.classList.add("hov"); }
    if (kind === "endhover") { svg.classList.remove("hov"); wrap.classList.remove("hov"); }
    if (kind === "on") svg.setAttribute("data-state", "on");
    if (kind === "off") svg.removeAttribute("data-state");
    M.settle();
    M.cur = document.getAnimations();
    M.cur.forEach((a) => a.pause());
    const finite = M.cur.map((a) => a.effect.getComputedTiming().endTime).filter(Number.isFinite);
    return { count: M.cur.length, end: finite.length ? Math.max(...finite) : 0, loops: M.cur.some((a) => !Number.isFinite(a.effect.getComputedTiming().endTime)) };
  },
  seek(t) {
    M.cur.forEach((a) => {
      const end = a.effect.getComputedTiming().endTime;
      a.currentTime = Number.isFinite(end) ? Math.min(t, end - 0.01) : t;
    });
    M.settle();
  },
  parts() {
    const s = svg.getBoundingClientRect();
    return [...svg.querySelectorAll("[data-part]")].filter((e) => e.dataset.part !== "badge").map((e) => {
      let x0 = 99, y0 = 99, x1 = -99, y1 = -99;
      e.querySelectorAll("path").forEach((path) => {
        if (path.classList.contains("hl")) return;
        const m = path.getScreenCTM();
        const len = path.getTotalLength();
        for (let i = 0; i <= 64; i++) {
          const pt = path.getPointAtLength((len * i) / 64).matrixTransform(m);
          const x = (pt.x - s.left) / ${SCALE}, y = (pt.y - s.top) / ${SCALE};
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
      });
      return { part: e.dataset.part, x0, y0, x1, y1 };
    });
  },
  count() { return document.getAnimations().length; },
  transitionDurations() { return [...svg.querySelectorAll("[data-part]")].map((e) => getComputedStyle(e).transitionDuration); },
});
</script>`;
}

const overflowOf = (parts) => {
  let worst = { amount: 0, part: "" };
  for (const p of parts) {
    const amount = Math.max(0 - (p.x0 - RIM), 0 - (p.y0 - RIM), p.x1 + RIM - 24, p.y1 + RIM - 24);
    if (amount > worst.amount) worst = { amount, part: p.part };
  }
  return worst;
};

const drift = (a, b) => {
  let worst = 0;
  for (const p of a) {
    const q = b.find((x) => x.part === p.part);
    if (q) worst = Math.max(worst, Math.abs(p.x0 - q.x0), Math.abs(p.y0 - q.y0), Math.abs(p.x1 - q.x1), Math.abs(p.y1 - q.y1));
  }
  return worst;
};

export async function recordMotion({ browser, dir, names, outDir, fps = 30 }) {
  const ffmpeg = hasFfmpeg();
  mkdirSync(outDir, { recursive: true });
  const step = 1000 / fps;
  const sheet = [];
  const report = [];
  let failures = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const name of names) {
    const cssPath = join(dir, `${name}.css`);
    if (!existsSync(cssPath)) continue;
    const svg = readFileSync(join(dir, `${name}.svg`), "utf8");
    const css = readFileSync(cssPath, "utf8");
    const html = join(outDir, `.stage-${name}.html`);
    writeFileSync(html, stageHtml(svg, css, false));
    const tmp = join(outDir, `.frames-${name}`);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const page = await browser.newPage({ width: STAGE, height: STAGE, dpr: 2 });
    const clip = { x: 0, y: 0, width: STAGE, height: STAGE };
    const frames = [];
    const phases = [];
    let overflow = { amount: 0, part: "", phase: "" };
    const track = async (phase) => {
      const o = overflowOf(await page.eval("M.parts()"));
      if (o.amount > overflow.amount) overflow = { ...o, phase };
    };
    const write = (buf) => {
      const file = join(tmp, `${String(frames.length).padStart(4, "0")}.png`);
      writeFileSync(file, buf);
      frames.push(file);
    };
    try {
      await page.load(html);
      await wait(150);
      await page.eval("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))");
      const rest = await page.shot(clip);
      const restParts0 = await page.eval("M.parts()");
      const holdFrames = (n, phase) => {
        const start = frames.length;
        for (let i = 0; i < n; i++) write(rest);
        phases.push({ phase, from: start, to: frames.length - 1 });
      };
      const play = async (kind, hold, phase) => {
        const info = await page.eval(`M.begin(${JSON.stringify(kind)})`);
        const total = info.end + hold;
        const start = frames.length;
        let firstParts = null;
        let lastParts = null;
        for (let t = 0; t <= total; t += step) {
          await page.eval(`M.seek(${t})`);
          if (t === 0) firstParts = await page.eval("M.parts()");
          lastParts = await page.eval("M.parts()");
          await track(phase);
          write(await page.shot(clip));
        }
        phases.push({ phase, from: start, to: frames.length - 1, info });
        return { info, firstParts, lastParts };
      };

      holdFrames(Math.round(fps * 0.25), "rest");
      const hover = await play("hover", 0, "hover");
      let seam = 0;
      if (hover.info.count) {
        await page.eval(`M.seek(${hover.info.end})`);
        const atEnd = await page.eval("M.parts()");
        seam = drift(hover.firstParts, atEnd);
      }
      await page.eval('M.begin("endhover"); M.cur.forEach((a) => a.cancel())');
      holdFrames(Math.round(fps * 0.25), "rest");
      const on = await play("on", 900, "on");
      const off = await play("off", 250, "off");
      await page.eval("M.cur.forEach((a) => a.cancel())");
      await wait(120);
      const final = await page.shot(clip);
      const restParts = await page.eval("M.parts()");
      const restsAgain = drift(restParts0, restParts) < 0.02;

      await page.close();
      const rm = await browser.newPage({ width: STAGE, height: STAGE, dpr: 2, reducedMotion: "reduce" });
      let reduced;
      try {
        await rm.load(html);
        await wait(100);
        await rm.eval('M.begin("hover"); M.begin("on")');
        const running = await rm.eval("M.count()");
        const durations = await rm.eval("M.transitionDurations()");
        reduced = running === 0 && durations.every((d) => parseFloat(d) === 0);
      } finally {
        await rm.close();
      }

      const clipMs = Math.round((frames.length * 1000) / fps);
      const gif = join(outDir, `${name}.gif`);
      const mp4 = join(outDir, `${name}.mp4`);
      if (ffmpeg) {
        const inp = ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(tmp, "%04d.png")];
        execFileSync("ffmpeg", [...inp, "-vf", "split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none", "-loop", "0", gif]);
        execFileSync("ffmpeg", [...inp, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart", mp4]);
      }

      const pick = (ph, n) => {
        const p = phases.find((x) => x.phase === ph);
        return Array.from({ length: n }, (_, i) => frames[Math.round(p.from + ((p.to - p.from) * (i + (n === 1 ? 0 : 0))) / Math.max(1, n - (ph === "hover" ? 0 : 1)))]);
      };
      const sampled = [...pick("hover", 7), ...pick("on", 4), ...pick("off", 3)];
      sheet.push({ name, files: sampled, hoverMs: Math.round(hover.info.end), onMs: Math.round(on.info.end), offMs: Math.round(off.info.end), loops: on.info.loops });
      const issues = [];
      if (overflow.amount > 0.05) issues.push(`part "${overflow.part}" leaves the 24 box by ${overflow.amount.toFixed(2)} units during ${overflow.phase}`);
      if (seam > SEAM_TOLERANCE) issues.push(`hover does not loop cleanly: last frame is ${seam.toFixed(2)} units from the first`);
      if (!hover.info.count) issues.push("hover starts no animation");
      if (hover.info.end && (hover.info.end < 600 || hover.info.end > 1300)) issues.push(`hover lasts ${Math.round(hover.info.end)}ms (target 700 to 1100)`);
      if (!on.info.count) issues.push("on state starts no transition");
      if (!restsAgain) issues.push("off does not return to the resting drawing");
      if (!reduced) issues.push("prefers-reduced-motion still animates or transitions");
      if (issues.length) failures++;
      report.push(`${issues.length ? "FIX " : "ok  "} ${name.padEnd(14)} hover ${Math.round(hover.info.end)}ms  on ${Math.round(on.info.end)}ms  overflow ${overflow.amount.toFixed(2)}  seam ${seam.toFixed(2)}  reduced-motion ${reduced ? "ok" : "BAD"}  ${clipMs}ms clip`);
      for (const i of issues) report.push(`       ${i}`);

      mkdirSync(join(outDir, "frames"), { recursive: true });
      for (const [i, f] of sampled.entries()) writeFileSync(join(outDir, "frames", `${name}-${String(i).padStart(2, "0")}.png`), readFileSync(f));
    } finally {
      await page.close().catch(() => {});
      rmSync(tmp, { recursive: true, force: true });
      rmSync(html, { force: true });
    }
  }

  const labels = ["hover", "hover", "hover", "hover", "hover", "hover", "hover", "on", "on", "on", "on", "off", "off", "off"];
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:11px system-ui;background:#fff}
.r{display:flex;align-items:center;border-bottom:1px solid #eee}.n{width:90px;padding:0 10px;color:#555}
figure{margin:0;position:relative}figcaption{position:absolute;left:4px;top:2px;font-size:9px;color:#999}img{display:block;width:${STAGE}px;height:${STAGE}px}</style>
${sheet.map((s) => `<div class="r"><div class="n">${s.name}<br>${s.hoverMs}ms</div>${s.files.map((_, i) => `<figure><img src="file://${join(outDir, "frames", `${s.name}-${String(i).padStart(2, "0")}.png`)}"><figcaption>${labels[i]}</figcaption></figure>`).join("")}</div>`).join("\n")}`;
  const sheetHtml = join(outDir, "contact-sheet.html");
  writeFileSync(sheetHtml, html);
  const p = await browser.newPage({ width: 90 + STAGE * 14 + 20, height: 600, dpr: 1 });
  try {
    await p.load(sheetHtml);
    await wait(500);
    await p.fitHeight();
    writeFileSync(join(outDir, "contact-sheet.png"), await p.shot());
  } finally {
    await p.close();
  }
  rmSync(sheetHtml, { force: true });
  console.log(report.join("\n"));
  console.log(`motion: ${sheet.length} icons recorded to ${outDir}${ffmpeg ? " (gif + mp4)" : " (no ffmpeg: frames only)"}; contact sheet ${join(outDir, "contact-sheet.png")}`);
  return failures;
}
