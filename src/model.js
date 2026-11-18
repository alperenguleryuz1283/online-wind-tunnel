/* Laboratory wind tunnel. Air flows left to right along local X. */
window.buildTunnel = function buildTunnel(THREE) {
  const group = new THREE.Group();
  const shell = new THREE.Group();
  const fan = new THREE.Group();
  const wing = new THREE.Group();
  group.add(shell, fan, wing);
  const pickables = [];
  function finish(mesh, parent, part) {
    parent.add(mesh);
    if (part) {
      mesh.userData.part = part;
      pickables.push(mesh);
    }
    return mesh;
  }
  const metal = (color, metalness = 0.35, roughness = 0.47) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const enamel = metal(0xbac8c9, 0.25);
  const edging = metal(0x697c80, 0.55);
  const chassis = metal(0x334649, 0.4);
  const dark = metal(0x202e30, 0.17, 0.63);
  const alloy = metal(0xcbd3d4, 0.65);
  const ochre = metal(0xd27d3d, 0.24, 0.42);
  const foil = metal(0xdeb16d, 0.52, 0.38);
  const glass = new THREE.MeshStandardMaterial({
    color: 0xb5e5e7,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.25,
    metalness: 0.12,
  });
  const boxShape = new THREE.BoxGeometry(1, 1, 1);
  function box(x, y, z, sx, sy, sz, mat, part, parent = group) {
    const m = new THREE.Mesh(boxShape, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return finish(m, parent, part);
  }
  function cylinder(x, y, z, r, length, axis, mat, part, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 32), mat);
    m.position.set(x, y, z);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    return finish(m, parent, part);
  }
  function strut(a, b, w, mat, depth = w) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start),
      mid = start.add(end).multiplyScalar(0.5);
    const m = box(mid.x, mid.y, mid.z, w, delta.length(), depth, mat);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return m;
  }
  // Rounded rectangular stations keep the duct open and give each flange a real lip.
  function station(x, height, width, radius) {
    const points = [];
    for (let corner = 0; corner < 4; corner++) {
      const quadrant = ((corner + 0.5) * Math.PI) / 2;
      const cy = Math.sign(Math.cos(quadrant)) * (height - radius);
      const cz = Math.sign(Math.sin(quadrant)) * (width - radius);
      for (let j = 0; j <= 5; j++) {
        const angle = ((corner + j / 5) * Math.PI) / 2;
        points.push([
          x,
          cy + radius * Math.cos(angle),
          cz + radius * Math.sin(angle),
        ]);
      }
    }
    return points;
  }
  function skin(sections, mat, part) {
    const rings = sections.map((d) => station(...d));
    const n = rings[0].length,
      indices = [];
    for (let i = 1; i < rings.length; i++) {
      for (let j = 0; j < n; j++) {
        const a = (i - 1) * n + j,
          b = (i - 1) * n + ((j + 1) % n);
        indices.push(a, b, a + n, b, b + n, a + n);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(rings.flat(2), 3),
    );
    geom.setIndex(indices);
    geom.computeVertexNormals();
    mat.side = THREE.DoubleSide;
    return finish(new THREE.Mesh(geom, mat), group, part);
  }
  function flange(x, h, w, r, part, tint = edging) {
    skin(
      [
        [x - 0.052, h, w, r],
        [x - 0.052, h + 0.058, w + 0.058, r + 0.025],
        [x + 0.052, h + 0.058, w + 0.058, r + 0.025],
        [x + 0.052, h, w, r],
      ],
      tint,
      part,
    );
  }
  const chamberStart = -1.65,
    chamberEnd = 1.65,
    h = 0.99,
    w = 1.53;
  skin(
    [
      [-4.5, 1.34, 1.88, 0.32],
      [-4.36, 1.37, 1.92, 0.35],
      [-3.97, 1.37, 1.92, 0.35],
      [-3.57, 1.33, 1.87, 0.32],
      [-3.13, 1.23, 1.78, 0.26],
      [-2.53, 1.06, 1.58, 0.17],
      [-2.1, h, w, 0.11],
      [chamberStart, h, w, 0.11],
    ],
    enamel,
    "inlet",
  );
  flange(-4.45, 1.35, 1.9, 0.33, "inlet");
  flange(-3.98, 1.37, 1.92, 0.35, "inlet");
  flange(-2.12, h, w, 0.11, "inlet", alloy);
  // A recessed flow straightener with actual hexagonal cells at the intake.
  const segments = [];
  for (let row = -8; row <= 8; row++)
    for (let col = -14; col <= 14; col++) {
      const r = 0.092,
        y = row * 1.5 * r,
        z = (col + (Math.abs(row) % 2) * 0.5) * Math.sqrt(3) * r;
      if (Math.abs(y) > 1.24 || Math.abs(z) > 1.77) continue;
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3,
          b = ((k + 1) * Math.PI) / 3;
        segments.push(
          -4.35,
          y + r * Math.cos(a),
          z + r * Math.sin(a),
          -4.35,
          y + r * Math.cos(b),
          z + r * Math.sin(b),
        );
      }
    }
  const honey = new THREE.BufferGeometry();
  honey.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
  group.add(
    new THREE.LineSegments(
      honey,
      new THREE.LineBasicMaterial({ color: 0x536566 }),
    ),
  );
  for (const x of [chamberStart, chamberEnd])
    flange(x, h, w, 0.11, "test", chassis);
  for (const sign of [-1, 1]) {
    box(0, 0, sign * w, 3.2, 1.93, 0.016, glass, "test", shell);
    box(0, sign * h, 0, 3.2, 0.016, 2.96, glass, "test", shell);
    for (const side of [-1, 1])
      box(0, sign * h, side * w, 3.26, 0.06, 0.062, alloy, "test");
  }
  skin(
    [
      [chamberEnd, h, w, 0.11],
      [1.9, h, w, 0.11],
      [2.45, 1.075, 1.5, 0.25],
      [3.12, 1.18, 1.43, 0.57],
      [3.71, 1.24, 1.34, 0.96],
      [4.03, 1.26, 1.28, 1.22],
    ],
    enamel,
    "fan",
  );
  flange(3.12, 1.18, 1.43, 0.57, "fan", alloy);
  skin(
    [
      [4.03, 1.26, 1.28, 1.22],
      [4.43, 1.26, 1.28, 1.22],
    ],
    chassis,
    "fan",
  );
  flange(4.39, 1.26, 1.28, 1.22, "fan");
  fan.position.x = 4.22;
  cylinder(0, 0, 0, 0.27, 0.31, "x", ochre, "fan", fan);
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.15, -0.07);
  bladeShape.quadraticCurveTo(0.65, -0.19, 1.1, 0.05);
  bladeShape.lineTo(1.08, 0.28);
  bladeShape.quadraticCurveTo(0.71, 0.13, 0.16, 0.12);
  bladeShape.closePath();
  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.034,
    bevelEnabled: false,
  });
  bladeGeom.rotateY(-Math.PI / 2);
  for (let i = 0; i < 9; i++) {
    const blade = finish(new THREE.Mesh(bladeGeom, alloy), fan, "fan");
    blade.rotation.x = (i * 2 * Math.PI) / 9;
  }
  for (const r of [0.37, 0.59, 0.81, 1.04, 1.2]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012, 5, 64),
      edging,
    );
    rim.rotation.y = Math.PI / 2;
    rim.position.x = 4.44;
    finish(rim, group, "fan");
  }
  for (let i = 0; i < 4; i++) {
    const t = (i * Math.PI) / 4,
      dy = 1.2 * Math.cos(t),
      dz = 1.2 * Math.sin(t);
    strut([4.44, -dy, -dz], [4.44, dy, dz], 0.021, edging);
  }
  const chord = 1.65,
    span = 2.4;
  function foilGeometry(section) {
    const shape = new THREE.Shape(
      section.contour.map(
        (p) => new THREE.Vector2((p.x - 0.25) * chord, p.y * chord),
      ),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: span,
      bevelEnabled: false,
    });
    return geometry.translate(0, 0, -span / 2);
  }
  const airfoil = finish(
    new THREE.Mesh(foilGeometry(airfoilSections.get("0012")), foil),
    wing,
    "wing",
  );
  function setSection(section) {
    if (wing.name === "NACA " + section.code) return;
    const previous = airfoil.geometry;
    airfoil.geometry = foilGeometry(section);
    previous.dispose();
    wing.name = "NACA " + section.code;
  }
  airfoil.castShadow = true;
  for (const s of [-1, 1]) {
    cylinder(0, 0, s * 1.39, 0.035, 0.4, "z", edging, "wing");
    cylinder(0, 0, s * 1.57, 0.145, 0.12, "z", chassis, "wing");
    cylinder(0, 0, s * 1.64, 0.109, 0.035, "z", alloy, "wing");
    cylinder(0, 0, s * 1.67, 0.047, 0.035, "z", ochre, "wing");
    box(0.06, 0, s * 1.667, 0.107, 0.014, 0.012, ochre, "wing", wing);
  }
  // Welded bed rails, crossmembers and adjustable isolation feet.
  for (const side of [-1, 1]) {
    box(-0.06, -1.42, side * 1.08, 8.17, 0.16, 0.12, chassis);
    for (const x of [-3.67, -1.65, 1.65, 3.65]) {
      box(x, -1.72, side * 1.08, 0.112, 0.62, 0.112, edging);
      cylinder(x, -2.043, side * 1.08, 0.046, 0.1, "y", alloy);
      cylinder(x, -2.103, side * 1.08, 0.136, 0.054, "y", dark);
      box(x, -1.32, side * 1.08, 0.33, 0.054, 0.25, edging);
    }
    for (const x of [chamberStart, chamberEnd])
      box(x, -1.2, side * 1.08, 0.13, 0.41, 0.13, edging);
    strut(
      [-3.52, -1.89, side * 1.08],
      [-2.92, -1.46, side * 1.08],
      0.056,
      edging,
    );
    strut([3.5, -1.89, side * 1.08], [2.9, -1.46, side * 1.08], 0.056, edging);
  }
  for (const x of [-3.67, -1.65, 1.65, 3.65])
    box(x, -1.42, 0, 0.16, 0.16, 2.19, chassis);
  // Raised access hatch, casing fixings and small inspection identifiers.
  for (const side of [-1, 1]) {
    box(-3.76, 0.03, side * 1.908, 0.39, 0.51, 0.022, edging, "inlet");
    for (let i = 0; i < 5; i++)
      box(
        -3.76,
        0.18 - i * 0.065,
        side * 1.926,
        0.26,
        0.019,
        0.014,
        dark,
        "inlet",
      );
  }
  function label(words, x, y, z, width, height) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#e7e7dc";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#cb783b";
    ctx.fillRect(0, 0, 22, 128);
    ctx.font = "bold 52px Arial";
    ctx.fillStyle = "#293939";
    ctx.textAlign = "center";
    ctx.fillText(words, 269, 84);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    plate.position.set(x, y, z);
    group.add(plate);
  }
  label("WT / 01", -4.18, 0.55, 1.927, 0.35, 0.092);
  label("TEST SECTION", 0, -1.425, 1.148, 1.0, 0.105);
  const fixings = [];
  for (const x of [-1.65, 1.65])
    for (const side of [-1, 1]) {
      for (const y of [-0.78, -0.4, 0, 0.4, 0.78])
        fixings.push([x, y, side * 1.598]);
      for (const z of [-1.25, -0.65, 0, 0.65, 1.25])
        fixings.push([x, 1.056, z]);
    }
  const fasteners = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.027, 8, 5),
    alloy,
    fixings.length,
  );
  fixings.forEach(([x, y, z], i) =>
    fasteners.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y, z)),
  );
  group.add(fasteners);
  group.name = "WT-01";
  wing.name = "NACA 0012";
  fan.name = "Emiş fanı";
  shell.name = "Test bölümü camları";
  return { group, wing, shell, fan, pickables, setSection };
};
