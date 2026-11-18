"use strict";
let probePercent = 40;
let probeSurface = "upper";
const formatNumber = (v, digits = 2) =>
  v.toLocaleString(uiLocale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

function pressureAt(surface, x) {
  const right = surface.findIndex((p) => p.x >= x);
  if (right === -1) return surface[surface.length - 1].cp;
  if (right === 0) return surface[0].cp;
  const a = surface[right - 1],
    b = surface[right];
  return a.cp + ((b.cp - a.cp) * (x - a.x)) / (b.x - a.x);
}
function pressureAxis(minimum) {
  // Negative Cp at the top, with identical axes across the active panels.
  const steps = [0.25, 0.5, 1, 2, 4, 5, 10, 20, 50];
  const step = steps.find((v) => (1 - minimum) / v <= 6) || 50;
  return {
    top: Math.min(-step, Math.floor(minimum / step) * step),
    bottom: Math.ceil(1 / step) * step,
    step,
  };
}
function drawPressureCard(card, axis) {
  const canvas = card.panel.querySelector(".cpPlot"),
    w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const plot = {
    left: w < 240 ? 29 : 40,
    right: w - 9,
    top: 16,
    bottom: h - 32,
  };
  const px = (x) => plot.left + x * (plot.right - plot.left);
  const py = (y) =>
    plot.top +
    ((y - axis.top) / (axis.bottom - axis.top)) * (plot.bottom - plot.top);
  const line = (a, b, c, d) => {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  };
  ctx.font = "11px Segoe UI, sans-serif";
  ctx.fillStyle = "#374e49";
  ctx.textAlign = "right";
  ctx.fillText("Cp", plot.left - 5, 10);
  for (let y = axis.top; y <= axis.bottom; y += axis.step) {
    ctx.strokeStyle = y === 0 ? "#94a7a0" : "#e1e7e3";
    line(px(0), py(y), px(1), py(y));
    ctx.fillText(
      formatNumber(y, Math.abs(y) % 1 ? 2 : 0),
      plot.left - 4,
      py(y) + 3,
    );
  }
  ctx.textAlign = "center";
  for (const x of w < 240 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]) {
    ctx.strokeStyle = "#e1e7e3";
    line(px(x), plot.top, px(x), plot.bottom);
    ctx.fillText(x.toLocaleString(uiLocale), px(x), plot.bottom + 13);
  }
  ctx.fillText("x/c", (plot.left + plot.right) / 2, h - 2);
  const probe = probePercent / 100,
    readout = card.panel.querySelector(".cpReadout");
  card.panel.querySelector(".station").value = probePercent;
  card.panel.querySelector(".stationValue").textContent = formatNumber(probe);
  card.panel.querySelector(".probeSide").value = probeSurface;
  const keyBar = card.panel.querySelector(".cpColorKey");
  keyBar.hidden =
    !card.data || !card.panel.querySelector(".paintToggle").checked;
  keyBar
    .querySelector(".scaleBar")
    .style.setProperty(
      "--zero",
      (-axis.top / (axis.bottom - axis.top)) * 100 + "%",
    );
  keyBar.querySelector(".lowCp").textContent = formatNumber(axis.top, 1);
  keyBar.querySelector(".highCp").textContent = formatNumber(axis.bottom, 1);
  canvas.onclick = null;
  if (!card.data) {
    readout.textContent = uiText("Hız sıfır olduğu için Cp tanımsız.");
    return;
  }
  ctx.strokeStyle = "#828d86";
  ctx.setLineDash([2, 3]);
  line(px(probe), plot.top, px(probe), plot.bottom);
  ctx.setLineDash([]);
  const values = [];
  for (const [key, color] of [
    ["upper", "#006863"],
    ["lower", "#b24d23"],
  ]) {
    const surface = card.data[key],
      value = pressureAt(surface, probe);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(key === "lower" ? [6, 3] : []);
    ctx.beginPath();
    for (const p of surface) ctx.lineTo(px(p.x), py(p.cp));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(probe), py(value), 3, 0, 2 * Math.PI);
    ctx.fill();
    if (key === probeSurface) {
      ctx.beginPath();
      ctx.arc(px(probe), py(value), 5.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "#142c27";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    values.push(value);
  }
  canvas.onclick = (e) => {
    const r = canvas.getBoundingClientRect(),
      mx = e.clientX - r.left,
      my = e.clientY - r.top;
    if (mx < plot.left || mx > plot.right || my < plot.top || my > plot.bottom)
      return;
    // Find the nearest point on either drawn polyline in screen space (important at the suction peak).
    let best = null;
    for (const side of [
      probeSurface,
      probeSurface === "upper" ? "lower" : "upper",
    ]) {
      const points = card.data[side];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          ax = px(a.x),
          ay = py(a.cp),
          dx = px(b.x) - ax,
          dy = py(b.cp) - ay;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((mx - ax) * dx + (my - ay) * dy) / (dx * dx + dy * dy || 1),
          ),
        );
        const dist = (mx - ax - t * dx) ** 2 + (my - ay - t * dy) ** 2;
        if (!best || dist < best.dist - 1e-8)
          best = { dist, side, x: a.x + t * (b.x - a.x) };
      }
    }
    probeSurface = best.side;
    probePercent = Math.max(0, Math.min(100, best.x * 100));
    refreshPressure();
  };
  const q = 0.5 * 1.225 * card.speed ** 2;
  readout.textContent = (english ? ["Upper", "Lower"] : ["Üst", "Alt"])
    .map(
      (name, i) =>
        name +
        "  " +
        formatNumber(values[i]) +
        "  (" +
        formatNumber(q * values[i], 1) +
        " Pa)",
    )
    .join("   ·   ");
}
function refreshPressure() {
  const cards = [firstPanel, ...(lab.compare ? [secondPanel] : [])].map(
    (panel) => {
      const val = (key) =>
        document.getElementById(key + (panel === secondPanel ? "B" : "")).value;
      const section = airfoilSections.get(val("foilChoice")),
        speed = Number(val("speed"));
      const data = speed
        ? pressureDistribution(section, Number(val("angle")))
        : null;
      panel.querySelector(".caseLift").textContent = data
        ? uiText("Kesit kaldırma katsayısı cₗ = ") +
          formatNumber(Math.abs(data.cl) < 0.0005 ? 0 : data.cl, 3)
        : uiText("Kesit kaldırma katsayısı cₗ · Hız sıfırken tanımsız");
      panel.querySelector(".cpCase").textContent =
        "NACA " +
        section.code +
        " · " +
        Number(val("angle")).toLocaleString(uiLocale) +
        "° · " +
        speed +
        " m/s";
      return { panel, data, speed, section };
    },
  );
  const axis = pressureAxis(
    Math.min(
      0,
      ...cards.flatMap((card) =>
        card.data
          ? [...card.data.upper, ...card.data.lower].map((p) => p.cp)
          : [],
      ),
    ),
  );
  cards.forEach((card) => {
    pressureSkins
      .get(card.panel)
      ?.update(card, axis, probeSurface, probePercent / 100);
    drawPressureCard(card, axis);
  });
}
