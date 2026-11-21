import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

async function launchLocal() {
  const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!bin) throw new Error("no Chrome found: pass --cdp http://127.0.0.1:PORT (a shared browser), or set CHROME_BIN");
  const profile = mkdtempSync(join(tmpdir(), "icons-chrome-"));
  const child = spawn(bin, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const url = await new Promise((res, rej) => {
    let buf = "";
    child.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) res(m[1]);
    });
    child.on("exit", () => rej(new Error("Chrome exited before it was ready")));
    setTimeout(() => rej(new Error("Chrome did not start in 15s")), 15000);
  });
  return { url, stop: () => child.kill() };
}

export async function openBrowser(endpoint = process.env.ICON_PREVIEW_CDP) {
  let local = null;
  let wsUrl;
  if (endpoint) wsUrl = (await (await fetch(`${endpoint}/json/version`)).json()).webSocketDebuggerUrl;
  else {
    local = await launchLocal();
    wsUrl = local.url;
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else listeners.forEach((l) => l(m));
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
  const { browserContextId } = await send("Target.createBrowserContext");

  async function newPage({ width = 1200, height = 900, dpr = 2, colorScheme = "light", reducedMotion = "no-preference" } = {}) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const call = (m, p) => send(m, p, sessionId);
    await call("Page.enable");
    await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile: false });
    await call("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: colorScheme },
        { name: "prefers-reduced-motion", value: reducedMotion },
      ],
    });
    return {
      call,
      async load(htmlPath) {
        const loaded = new Promise((res) => {
          const l = (m) => m.method === "Page.loadEventFired" && m.sessionId === sessionId && (listeners.delete(l), res());
          listeners.add(l);
        });
        await call("Page.navigate", { url: "file://" + htmlPath });
        await loaded;
      },
      async eval(expression) {
        const r = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      async fitHeight() {
        const h = await this.eval("document.documentElement.scrollHeight");
        await call("Emulation.setDeviceMetricsOverride", { width, height: Math.ceil(h), deviceScaleFactor: dpr, mobile: false });
      },
      async shot(clip) {
        const r = await call("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
        return Buffer.from(r.data, "base64");
      },
      async close() {
        await send("Target.closeTarget", { targetId }).catch(() => {});
      },
    };
  }

  return {
    newPage,
    async close() {
      await send("Target.disposeBrowserContext", { browserContextId }).catch(() => {});
      ws.close();
      local?.stop();
    },
  };
}
