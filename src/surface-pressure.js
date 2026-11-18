"use strict";
const pressureSkins = new WeakMap();
// One quad per solver panel, extruded across the span of the displayed section.
function attachPressureSkin(panel, tunnel) {
  const wing = tunnel.wing;
  const paint = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  });
  const skin = new THREE.Mesh(new THREE.BufferGeometry(), paint);
  skin.name = "Yüzey basıncı";
  wing.add(skin);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0x171f22 }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xfffded }),
  );
  core.position.z = 0.028;
  marker.add(core);
  marker.name = "Cp ölçüm noktası";
  wing.add(marker);
  let lastSection;
  const blue = [35, 78, 157],
    neutral = [245, 241, 214],
    red = [186, 55, 28];
  function rebuild(section) {
    const pos = [];
    for (let i = 1; i < section.contour.length; i++) {
      const a = section.contour[i - 1],
        b = section.contour[i];
      for (const [p, z] of [
        [a, -1.2],
        [b, -1.2],
        [b, 1.2],
        [a, -1.2],
        [b, 1.2],
        [a, 1.2],
      ]) {
        pos.push((p.x - 0.25) * 1.65, p.y * 1.65, z);
      }
    }
    skin.geometry.dispose();
    skin.geometry = new THREE.BufferGeometry();
    skin.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pos, 3),
    );
    skin.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3),
    );
    lastSection = section;
  }
  function update(card, axis, surface, x) {
    if (card.section !== lastSection) rebuild(card.section);
    skin.visible =
      Boolean(card.data) && panel.querySelector(".paintToggle").checked;
    marker.visible = Boolean(card.data);
    if (!card.data) return;
    const stations =
      surface === "upper"
        ? card.section.contour.slice(0, 81).reverse()
        : card.section.contour.slice(80);
    let i = stations.findIndex((pt) => pt.x >= x);
    if (i < 0) i = stations.length - 1;
    const a = stations[Math.max(0, i - 1)],
      b = stations[i];
    const fraction =
      b.x === a.x ? 0 : Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
    marker.position.set(
      (a.x + fraction * (b.x - a.x) - 0.25) * 1.65,
      (a.y + fraction * (b.y - a.y)) * 1.65,
      1.204,
    );
    if (!skin.visible) return;
    const colors = skin.geometry.attributes.color,
      color = new THREE.Color();
    const faces = card.data.upper.slice().reverse().concat(card.data.lower);
    faces.forEach(({ cp }, face) => {
      const end = cp < 0 ? blue : red,
        t = Math.min(1, cp / (cp < 0 ? axis.top : axis.bottom));
      const channel = (k) => (neutral[k] + t * (end[k] - neutral[k])) / 255;
      color.setRGB(channel(0), channel(1), channel(2), THREE.SRGBColorSpace);
      for (let j = face * 6; j < face * 6 + 6; j++)
        colors.setXYZ(j, color.r, color.g, color.b);
    });
    colors.needsUpdate = true;
  }
  pressureSkins.set(panel, { update });
  return function pickPressure(ray) {
    if (!skin.visible) return false;
    const hit = ray.intersectObject(skin, false)[0];
    if (!hit) return false;
    const face = Math.floor(hit.faceIndex / 2),
      count = lastSection.contour.length - 1;
    probeSurface = face < count / 2 ? "upper" : "lower";
    probePercent = Math.max(
      0,
      Math.min(
        100,
        100 * (skin.worldToLocal(hit.point.clone()).x / 1.65 + 0.25),
      ),
    );
    refreshPressure();
    return true;
  };
}
