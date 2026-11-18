"use strict";

// Hess–Smith: one source per panel and one uniform vortex sheet.
// The contour runs counterclockwise; the exterior lies to each panel's right.
function panelPressureBasis(contour) {
  const panels = contour.slice(1).map((end, i) => {
    const start = contour[i],
      dx = end.x - start.x,
      dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    return {
      start,
      length,
      tx: dx / length,
      ty: dy / length,
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  });
  const n = panels.length,
    tau = 2 * Math.PI;
  const matrix = [],
    tangential = [];
  for (const [i, p] of panels.entries()) {
    const row = new Float64Array(n + 3),
      tangent = new Float64Array(n + 1);
    for (const [j, q] of panels.entries()) {
      const dx = p.x - q.start.x,
        dy = p.y - q.start.y;
      const x = dx * q.tx + dy * q.ty,
        y = dy * q.tx - dx * q.ty;
      const u =
        i === j
          ? 0
          : Math.log(Math.hypot(x, y) / Math.hypot(x - q.length, y)) / tau;
      const v =
        i === j
          ? -0.5
          : Math.atan2(y * q.length, x * (x - q.length) + y * y) / tau;
      const sx = u * q.tx - v * q.ty,
        sy = u * q.ty + v * q.tx;
      tangent[j] = sx * p.tx + sy * p.ty;
      row[j] = sx * p.ty - sy * p.tx;
      // A unit vortex induces the source velocity rotated anticlockwise by 90°.
      tangent[n] += row[j];
      row[n] -= tangent[j];
    }
    row[n + 1] = -p.ty;
    row[n + 2] = p.tx;
    matrix.push(row);
    tangential.push(tangent);
  }
  // Opposite contour tangents at the two trailing-edge panels (Kutta condition).
  const kutta = new Float64Array(n + 3);
  for (let j = 0; j <= n; j++)
    kutta[j] = tangential[0][j] + tangential[n - 1][j];
  kutta[n + 1] = -panels[0].tx - panels[n - 1].tx;
  kutta[n + 2] = -panels[0].ty - panels[n - 1].ty;
  matrix.push(kutta);
  // Solve both unit freestream directions once, using partial pivoting.
  for (let k = 0; k <= n; k++) {
    let pivot = k;
    for (let i = k + 1; i <= n; i++)
      if (Math.abs(matrix[i][k]) > Math.abs(matrix[pivot][k])) pivot = i;
    [matrix[k], matrix[pivot]] = [matrix[pivot], matrix[k]];
    if (Math.abs(matrix[k][k]) < 1e-12) throw new Error("Tekil panel sistemi");
    for (let i = k + 1; i <= n; i++) {
      const multiplier = matrix[i][k] / matrix[k][k];
      for (let j = k + 1; j < n + 3; j++)
        matrix[i][j] -= multiplier * matrix[k][j];
    }
  }
  for (let i = n; i >= 0; i--) {
    for (const rhs of [n + 1, n + 2]) {
      for (let j = i + 1; j <= n; j++)
        matrix[i][rhs] -= matrix[i][j] * matrix[j][rhs];
      matrix[i][rhs] /= matrix[i][i];
    }
  }
  return panels.map((p, i) => {
    let vx = p.tx,
      vy = p.ty;
    for (let j = 0; j <= n; j++) {
      vx += tangential[i][j] * matrix[j][n + 1];
      vy += tangential[i][j] * matrix[j][n + 2];
    }
    return { ...p, vx, vy };
  });
}
const pressureBases = new Map();
function pressureDistribution(section, degrees) {
  if (!pressureBases.has(section))
    pressureBases.set(section, panelPressureBasis(section.contour));
  const angle = (degrees * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  let forceX = 0,
    forceY = 0;
  const samples = pressureBases.get(section).map((p) => {
    const cp = 1 - (p.vx * c + p.vy * s) ** 2;
    // Chord-normalized geometry, counterclockwise contour: -Cp n ds = Cp(-dy,dx).
    forceX -= cp * p.ty * p.length;
    forceY += cp * p.tx * p.length;
    return { x: p.x, cp };
  });
  return {
    upper: samples.slice(0, samples.length / 2).reverse(),
    lower: samples.slice(samples.length / 2),
    cl: -forceX * s + forceY * c,
  };
}

if (typeof module !== "undefined" && module.exports)
  module.exports = { pressureDistribution };
