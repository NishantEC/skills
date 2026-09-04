"""A jellyfish as a density field. No video, no drawn frames.

Written for --cols 72 --rows 40. Every term is periodic in t, so the loop
closes exactly at the wrap with no three-copy trick.

The bell is a dome outline rather than a filled shape: a jellyfish is
translucent, and the thing that makes it read as one is a bright rim with a
faint interior, not a solid mass.
"""
import math

CX = 0.5
Y_RIM = 0.44
BELL_W = (0.155, 0.265)   # half-width: contracted, relaxed
BELL_H = (0.395, 0.255)   # dome height: contracted, relaxed
ARM_L = (0.150, 0.235)
TEN_L = (0.300, 0.470)

ARMS = (-0.58, -0.21, 0.21, 0.58)
TENTS = (-0.95, -0.68, -0.40, -0.13, 0.15, 0.43, 0.70, 0.96)

# A cell is 0.6 as wide as it is tall, so a circle in (x, y) is only round if
# dy is scaled by rows / (cols * 0.6). 40 / (72 * 0.6).
AY = 40.0 / (72.0 * 0.6)

_cache: dict = {}


def _lerp(pair, p):
    return pair[0] + (pair[1] - pair[0]) * p


def _pose(t):
    """Curve points for this frame, bucketed by row so a cell checks ~1/10."""
    got = _cache.get(t)
    if got is not None:
        return got

    # Dwell contracted, snap open: p=1 relaxed. Still smooth at the wrap.
    p = ((1 + math.sin(t)) / 2) ** 1.45
    w = _lerp(BELL_W, p)
    yrim = Y_RIM + (1 - p) * 0.025
    la, lt = _lerp(ARM_L, p), _lerp(TEN_L, p)

    pts = []
    for i, u in enumerate(ARMS):
        for k in range(16):
            s = (k + 0.5) / 16
            # The trailing wave lags the pulse: the arms are dragged, not driven.
            x = CX + w * u * (1 - 0.22 * s) + 0.030 * math.sin(3.4 * s - t + i * 1.3) * s * s
            pts.append((x, yrim + s * la, 0.026 * (1 - 0.55 * s), 0.80))
    for j, u in enumerate(TENTS):
        for k in range(26):
            s = (k + 0.5) / 26
            x = CX + w * u * (1 + 0.16 * s) + 0.052 * math.sin(2.8 * s - t + j * 1.7) * s * s
            pts.append((x, yrim + s * lt, 0.0092 * (1 - 0.30 * s), 0.56))

    buckets: dict = {}
    for x, y, r, a in pts:
        span = int(3 * r / AY / 0.025) + 1
        b = int(y / 0.025)
        for d in range(-span, span + 1):
            buckets.setdefault(b + d, []).append((x, y, r, a))

    _cache[t] = (w, yrim, _lerp(BELL_H, p), buckets)
    if len(_cache) > 128:
        _cache.clear()
    return _cache[t]


def field(x, y, t):
    w, yrim, h, buckets = _pose(t)

    v = (yrim - y) / h
    best = 0.0
    if -0.55 < v < 1.35:
        u = (x - CX) / w
        if abs(u) < 1.9:
            if v > -0.02:
                d = math.hypot(u, v)
                # Bright rim, faint fill — translucency is the whole read.
                best = math.exp(-((d - 1) ** 2) / 0.0180)
                if d < 1:
                    best = max(best, 0.30 * (1 - d) ** 0.75 * (1 - 0.45 * v))
            if abs(u) <= 1.04:
                # The near rim of the bell, bowing down through the middle.
                vm = -0.125 * (1 - u * u)
                best = max(best, 0.95 * math.exp(-((v - vm) ** 2) / 0.0150))

    for px, py, r, amp in buckets.get(int(y / 0.025), ()):
        dx, dy = x - px, (y - py) / AY
        q = (dx * dx + dy * dy) / (r * r)
        if q < 9.0:
            got = amp * math.exp(-q * 0.5)
            if got > best:
                best = got
    return best
