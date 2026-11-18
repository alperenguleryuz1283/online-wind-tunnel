"use strict";
// The polar is a sweep for each section at nonzero freestream speed, independent of the two live setups.
function initializeLiftChart() {
  const svg = document.getElementById("liftPlot"),
    input = document.getElementById("liftProbe");
  const codes = ["0012", "2412"],
    minAngle = -10,
    maxAngle = 20,
    increment = 0.5;
  const angles = Array.from({ length: 61 }, (_, i) => minAngle + i * increment);
  const series = codes.map((code) =>
    angles.map((a) => pressureDistribution(airfoilSections.get(code), a).cl),
  );
  const minCl = Math.floor(2 * Math.min(...series.flat())) / 2;
  const maxCl = Math.ceil(2 * Math.max(...series.flat())) / 2;
  const left = 45,
    top = 21,
    bottom = 230;
  let right;
  const px = (a) =>
    left + ((a - minAngle) / (maxAngle - minAngle)) * (right - left);
  const py = (cl) => bottom - ((cl - minCl) / (maxCl - minCl)) * (bottom - top);
  function node(tag, attrs, text) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs))
      n.setAttribute(key, value);
    if (text !== undefined) n.textContent = text;
    svg.append(n);
    return n;
  }
  function render() {
    const width = Math.max(240, svg.clientWidth);
    right = width - 16;
    svg.setAttribute("viewBox", "0 0 " + width + " 268");
    svg.replaceChildren();
    for (let a = minAngle; a <= maxAngle; a += 5) {
      node("line", {
        x1: px(a),
        y1: top,
        x2: px(a),
        y2: bottom,
        class: a === 0 ? "liftZero" : "liftGrid",
      });
      node(
        "text",
        { x: px(a), y: bottom + 15, "text-anchor": "middle" },
        a + "°",
      );
    }
    for (let y = minCl; y <= maxCl; y += 0.5) {
      node("line", {
        x1: left,
        y1: py(y),
        x2: right,
        y2: py(y),
        class: y === 0 ? "liftZero" : "liftGrid",
      });
      node(
        "text",
        { x: left - 8, y: py(y) + 4, "text-anchor": "end" },
        y.toLocaleString(uiLocale),
      );
    }
    node("text", { x: left - 4, y: 13 }, "cₗ");
    node(
      "text",
      { x: (right + left) / 2, y: 263, "text-anchor": "middle" },
      uiText("Hücum açısı α (°)"),
    );
    const a = Number(input.value),
      index = Math.round((a - minAngle) / increment);
    node("line", {
      x1: px(a),
      x2: px(a),
      y1: top,
      y2: bottom,
      class: "liftCursor",
    });
    series.forEach((values, i) => {
      const path = angles
        .map((angle, j) => (j ? "L" : "M") + px(angle) + " " + py(values[j]))
        .join(" ");
      node("path", {
        d: path,
        class: "liftCurve curve" + i,
        "data-profile": codes[i],
      });
      node("circle", {
        cx: px(a),
        cy: py(values[index]),
        r: 4,
        class: "liftDot dot" + i,
      });
      const cl = values[index];
      document.getElementById("lift" + codes[i]).textContent = formatNumber(
        Math.abs(cl) < 0.0005 ? 0 : cl,
        3,
      );
    });
    document.getElementById("liftDegrees").textContent =
      a.toLocaleString(uiLocale) + "°";
  }
  svg.addEventListener("click", (e) => {
    const fraction =
      (e.clientX - svg.getBoundingClientRect().left - left) / (right - left);
    input.value =
      minAngle +
      Math.round(Math.max(0, Math.min(1, fraction)) * 60) * increment;
    render();
  });
  input.addEventListener("input", render);
  new ResizeObserver(render).observe(svg);
  render();
}
initializeLiftChart();
