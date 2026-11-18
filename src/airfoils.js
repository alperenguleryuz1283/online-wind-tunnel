"use strict";
// Coordinates are fractions of chord, measured from the nominal leading edge.
const airfoilSections = new Map(
  ["0012", "2412"].map((code) => {
    const m = Number(code[0]) / 100,
      p = Number(code[1]) / 10;
    const t = Number(code.slice(2)) / 100;
    function camber(x) {
      if (!m) return 0;
      const interval = x < p ? p : 1 - p;
      return m * (1 - ((x - p) / interval) ** 2);
    }
    function halfThickness(x) {
      // Closed trailing-edge form of the four-digit NACA thickness law.
      return (
        5 *
        t *
        (0.2969 * Math.sqrt(x) -
          0.126 * x -
          0.3516 * x * x +
          0.2843 * x ** 3 -
          0.1036 * x ** 4)
      );
    }
    function surface(x, sign) {
      const interval = x < p ? p : 1 - p;
      const slope = m ? (2 * m * (p - x)) / (interval * interval) : 0;
      const theta = Math.atan(slope),
        offset = sign * halfThickness(x);
      return {
        x: x - offset * Math.sin(theta),
        y: camber(x) + offset * Math.cos(theta),
      };
    }
    const upper = [],
      lower = [];
    for (let i = 0; i <= 80; i++) {
      const x = (1 - Math.cos((i * Math.PI) / 80)) / 2;
      upper.push(surface(x, 1));
      lower.push(surface(x, -1));
    }
    const contour = upper.reverse().concat(lower.slice(1));
    const centerline = Array.from({ length: 51 }, (_, i) => ({
      x: i / 50,
      y: camber(i / 50),
    }));
    return [code, { code, camber, halfThickness, contour, centerline }];
  }),
);

if (typeof module !== "undefined" && module.exports)
  module.exports = { airfoilSections };
