const test = require("node:test");
const assert = require("node:assert/strict");
const { airfoilSections } = require("../src/airfoils.js");
const { pressureDistribution } = require("../src/pressure.js");

test("NACA 2412 reaches two percent camber at forty percent chord", () => {
  const cambered = airfoilSections.get("2412");
  assert.ok(Math.abs(cambered.camber(0.4) - 0.02) < 1e-12);
  assert.equal(cambered.camber(0), 0);
  assert.equal(cambered.camber(1), 0);
  assert.equal(airfoilSections.get("0012").camber(0.4), 0);
});

test("a symmetric section has equal surface pressures and zero lift at zero incidence", () => {
  const result = pressureDistribution(airfoilSections.get("0012"), 0);
  assert.ok(Math.abs(result.cl) < 1e-10);
  result.upper.forEach((point, i) => {
    assert.ok(Math.abs(point.cp - result.lower[i].cp) < 1e-9);
  });
});

test("reversing incidence reverses symmetric-section lift; positive camber produces lift at zero incidence", () => {
  const symmetric = airfoilSections.get("0012");
  const positive = pressureDistribution(symmetric, 4).cl;
  assert.ok(positive > 0.4 && positive < 0.55);
  assert.ok(Math.abs(pressureDistribution(symmetric, -4).cl + positive) < 1e-9);
  assert.ok(pressureDistribution(airfoilSections.get("2412"), 0).cl > 0.2);
});

test("doubling the mesh from 80 to 160 panels changes lift by less than 0.01 in the angle sweep", () => {
  for (const section of airfoilSections.values()) {
    const coarse = { contour: section.contour.filter((_, i) => i % 2 === 0) };
    for (let angle = -10; angle <= 20; angle += 0.5) {
      const delta =
        pressureDistribution(section, angle).cl -
        pressureDistribution(coarse, angle).cl;
      assert.ok(
        Math.abs(delta) < 0.01,
        section.code + " at " + angle + " degrees",
      );
    }
  }
});
