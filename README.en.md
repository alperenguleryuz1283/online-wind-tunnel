# Online Wind Tunnel

[Türkçe](README.md) · **English**

Online Wind Tunnel is an interactive browser application for comparing the NACA 0012 and NACA 2412 airfoils. Explore a 3D wind tunnel, inspect surface pressure, and compare the two sections’ lift at the same angle of attack.

## Run locally

Extract the entire repository and open `index.html` in a browser with WebGL enabled. Select **English** in the header. Three.js is bundled, so the application also works offline.

## Try a comparison

1. Select **Compare two experiments**. Choose NACA 0012 in Experiment A and NACA 2412 in Experiment B.
2. Set Experiment A to **0°** and **20 m/s**, then select **Match B’s angle and speed to A**.
3. Turn on the **Measurement overlay** to compare the chord and mean camber lines. Click either pressure curve to locate that point on the wing. You can also click the colored wing surface to move the chart probe.
4. Open the **Lift chart** and move the comparison-angle slider to read both section lift coefficients at the same angle.

## Aerodynamic model

A 160-panel Hess–Smith solver computes two-dimensional potential flow around the selected section. Surface tangential velocity gives the pressure coefficient, and integrating the panel pressures gives the section lift coefficient. Surface colors repeat the 2D result across the displayed span. The moving streamlines are illustrative. The solver assumes incompressible, inviscid, attached flow and excludes stall, tunnel-wall effects and finite-wing effects.

## Repository layout

- [index.html](index.html) is the application entry point.
- [src/](src/) contains the airfoil geometry, panel solver, 3D scene and interactive charts. Start with [airfoils.js](src/airfoils.js) for geometry or [pressure.js](src/pressure.js) for the aerodynamic calculations. Interface translations are in [language.js](src/language.js).
- [assets/](assets/) contains the stylesheet.
- [vendor/three/](vendor/three/) contains Three.js r159 for offline use and its [MIT license](vendor/three/LICENSE.txt).
- [tests/](tests/) contains the automated physics checks.

## Run the tests

From the repository root, run this command with Node.js 22:

```sh
node --test tests/physics.test.cjs
```

The tests cover airfoil geometry, pressure symmetry, lift direction and sensitivity to panel count. They require no additional packages.

## GitHub Pages

Place the repository files at the root of your branch in the `online-wind-tunnel` repository. In **Settings → Pages**, choose **Deploy from a branch**, select that branch, and choose **/(root)**. Append `?lang=en` to the page URL to share the English view.
