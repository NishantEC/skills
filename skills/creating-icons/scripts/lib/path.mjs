const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

export function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const segs = [];
  let i = 0;
  let cmd = null;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      cmd = tokens[i++];
      if (/z/i.test(cmd)) {
        segs.push({ cmd: "Z", args: [] });
        continue;
      }
    }
    const up = cmd.toUpperCase();
    const n = ARGS[up];
    const args = [];
    if (up === "A") {
      const flags = [];
      for (let k = 0; k < 7; k++) {
        let t = tokens[i];
        if ((k === 3 || k === 4) && t && t.length > 1 && /^[01]/.test(t) && !t.includes(".")) {
          tokens[i] = t.slice(1);
          t = t[0];
        } else i++;
        flags.push(+t);
      }
      args.push(...flags);
    } else {
      for (let k = 0; k < n; k++) args.push(+tokens[i++]);
    }
    segs.push({ cmd, args });
    if (up === "M") cmd = cmd === "M" ? "L" : "l";
  }
  return segs;
}

export function toAbsolute(segs) {
  const out = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const { cmd, args } of segs) {
    const rel = cmd === cmd.toLowerCase();
    const up = cmd.toUpperCase();
    let a = args.slice();
    if (up === "Z") {
      out.push({ cmd: "Z", args: [] });
      x = sx; y = sy;
      continue;
    }
    if (rel) {
      if (up === "H") a[0] += x;
      else if (up === "V") a[0] += y;
      else if (up === "A") { a[5] += x; a[6] += y; }
      else a = a.map((v, k) => v + (k % 2 === 0 ? x : y));
    }
    out.push({ cmd: up, args: a });
    if (up === "H") x = a[0];
    else if (up === "V") y = a[0];
    else { x = a[a.length - 2]; y = a[a.length - 1]; }
    if (up === "M") { sx = x; sy = y; }
  }
  return out;
}

function arcPoints(x1, y1, [rx, ry, rot, large, sweep, x2, y2]) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const phi = (rot * Math.PI) / 180;
  const c = Math.cos(phi), s = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = c * dx + s * dy, y1p = -s * dx + c * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2;
  const den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2;
  let k = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) k = -k;
  const cxp = (k * rx * y1p) / ry, cyp = (-k * ry * x1p) / rx;
  const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dth > 0) dth -= 2 * Math.PI;
  if (sweep && dth < 0) dth += 2 * Math.PI;
  const pts = [];
  for (let t = 0; t <= 24; t++) {
    const th = th1 + (dth * t) / 24;
    pts.push([cx + rx * Math.cos(th) * c - ry * Math.sin(th) * s, cy + rx * Math.cos(th) * s + ry * Math.sin(th) * c]);
  }
  return pts;
}

export function bbox(d) {
  const pts = [];
  let x = 0, y = 0;
  for (const { cmd, args } of toAbsolute(parsePath(d))) {
    if (cmd === "Z") continue;
    if (cmd === "A") pts.push(...arcPoints(x, y, args));
    else if (cmd === "H") pts.push([args[0], y]);
    else if (cmd === "V") pts.push([x, args[0]]);
    else for (let k = 0; k < args.length; k += 2) pts.push([args[k], args[k + 1]]);
    if (cmd === "H") x = args[0];
    else if (cmd === "V") y = args[0];
    else { x = args[args.length - 2]; y = args[args.length - 1]; }
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

const r3 = (n) => String(Math.round(n * 1000) / 1000);

export function mirrorPath(d, axis = 12) {
  const fx = (v) => 2 * axis - v;
  let out = "";
  for (const { cmd, args } of parsePath(d)) {
    const rel = cmd === cmd.toLowerCase();
    const up = cmd.toUpperCase();
    let a = args.slice();
    if (up === "Z") { out += "Z"; continue; }
    if (up === "H") a[0] = rel ? -a[0] : fx(a[0]);
    else if (up === "V") {}
    else if (up === "A") {
      a[4] = a[4] ? 0 : 1;
      a[2] = -a[2];
      a[5] = rel ? -a[5] : fx(a[5]);
    } else a = a.map((v, k) => (k % 2 === 0 ? (rel ? -v : fx(v)) : v));
    out += cmd + a.map(r3).join(" ");
  }
  return out;
}

export function pointInfo(d) {
  return toAbsolute(parsePath(d));
}
