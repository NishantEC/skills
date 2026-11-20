import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function viaCdp(endpoint, htmlPath, out, width) {
  const info = await (await fetch(`${endpoint}/json/version`)).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
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
  try {
    const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const call = (m, p) => send(m, p, sessionId);
    await call("Page.enable");
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: false });
    const loaded = new Promise((res) => listeners.push((m) => m.method === "Page.loadEventFired" && m.sessionId === sessionId && res()));
    await call("Page.navigate", { url: "file://" + htmlPath });
    await loaded;
    await wait(500);
    const { result } = await call("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true });
    await call("Emulation.setDeviceMetricsOverride", { width, height: Math.ceil(result.value), deviceScaleFactor: 2, mobile: false });
    await wait(150);
    const shot = await call("Page.captureScreenshot", { format: "png" });
    writeFileSync(out, Buffer.from(shot.data, "base64"));
  } finally {
    await send("Target.disposeBrowserContext", { browserContextId }).catch(() => {});
    ws.close();
  }
}

function viaSystemChrome(htmlPath, out, width) {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const bin = candidates.find((p) => existsSync(p));
  if (!bin) throw new Error("no Chrome found: pass --cdp http://127.0.0.1:PORT, or set CHROME_BIN");
  execFileSync(bin, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},2400`, "--force-device-scale-factor=2", `--screenshot=${out}`, "file://" + htmlPath], { stdio: "ignore" });
}

export async function screenshot({ htmlPath, out, width = 1500, cdp }) {
  const endpoint = cdp || process.env.ICON_PREVIEW_CDP;
  if (endpoint) return viaCdp(endpoint, htmlPath, out, width);
  return viaSystemChrome(htmlPath, out, width);
}
