"use strict";

const partNotes = {
  wing: uiText(
    "NACA 0012 simetrik bir kanat profilidir. En büyük kalınlığı veter uzunluğunun %12’sidir. Hücum açısını değiştirerek profilin hava akımına göre yönünü inceleyin.",
  ),
  inlet: uiText(
    "Girişteki petek, havanın yanal hareketini azaltmaya yardımcı olur. Daralan kanal, akışı test bölmesine yönlendirir.",
  ),
  test: uiText(
    "Saydam test bölmesi kanadı farklı yönlerden izlemeyi sağlar. Cam panelleri gizleyerek profili ve çevresindeki akış çizgilerini yakından inceleyin.",
  ),
  fan: uiText(
    "Çıkıştaki fan havayı girişten test bölmesine doğru çeker. Hava hızı ayarı, fanın ve akış işaretlerinin animasyon hızını birlikte değiştirir.",
  ),
};
function makeExperiment(panel, id) {
  const el = (key) => document.getElementById(key + id);
  panel.querySelector(".experimentLabel").textContent = id
    ? uiText("Deney B")
    : uiText("Deney A");
  let running = true,
    phase = 0;
  let section = airfoilSections.get(el("foilChoice").value);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, 0.1, 150);
  const host = el("scene");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    el("renderError").hidden = false;
    throw error;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa1aba4, 2.1));
  const keyLight = new THREE.DirectionalLight(0xfff5df, 2.25);
  keyLight.position.set(-3, 7, 6);
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xe5f7ff, 1.6);
  rim.position.set(2, 5, -5);
  scene.add(rim);
  const tunnel = buildTunnel(THREE);
  scene.add(tunnel.group);
  const pickPressure = attachPressureSkin(panel, tunnel);
  const grid = new THREE.GridHelper(32, 64, 0xa4b6b1, 0xb8c8c2);
  grid.position.y = -2.145;
  grid.material.transparent = true;
  grid.material.opacity = 0.36;
  scene.add(grid);
  // A soft contact shadow anchors the instrument feet to the floor.
  const shade = document.createElement("canvas");
  shade.width = shade.height = 128;
  const brush = shade.getContext("2d"),
    gradient = brush.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, "rgba(40,57,49,.42)");
  gradient.addColorStop(1, "rgba(40,57,49,0)");
  brush.fillStyle = gradient;
  brush.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shade),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.14;
  scene.add(shadow);
  const cameraViews = {
    genel: [-0.42, 0.32],
    yan: [0, 0.015],
    ust: [0, Math.PI / 2 - 0.001],
  };
  let yaw,
    pitch,
    zoom = 1;
  let selectedView = "genel";
  function cameraPose() {
    camera.position.set(
      20 * Math.sin(yaw) * Math.cos(pitch),
      20 * Math.sin(pitch) - 0.25,
      20 * Math.cos(yaw) * Math.cos(pitch),
    );
    camera.lookAt(0, -0.25, 0);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    drawMeasurement();
  }
  function setView(view) {
    selectedView = view;
    [yaw, pitch] = cameraViews[view];
    zoom = 1;
    cameraPose();
    panel
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === view)),
      );
  }
  panel.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        setView(b.dataset.view);
        shareCamera(id, [yaw, pitch, zoom], selectedView);
      }),
  );
  setView("genel");
  function drawMeasurement() {
    const overlay = el("measureOverlay");
    if (!lab.measure || !host.clientWidth) return;
    const width = host.clientWidth,
      height = host.clientHeight;
    const theta = (-Number(el("angle").value) * Math.PI) / 180;
    const cos = Math.cos(theta),
      sin = Math.sin(theta);
    const lead = { x: -0.4125 * cos, y: -0.4125 * sin };
    const tipZ = camera.position.z >= 0 ? 1.2 : -1.2;
    function project(x, y) {
      const p = new THREE.Vector3(x, y, tipZ).project(camera);
      return [((p.x + 1) * width) / 2, ((1 - p.y) * height) / 2];
    }
    const start = project(lead.x, lead.y);
    const trailing = project(1.2375 * cos, 1.2375 * sin);
    const air = project(lead.x + 2.15, lead.y);
    function line(role, a, b) {
      const node = overlay.querySelector('[data-mark="' + role + '"]');
      ["x1", "y1", "x2", "y2"].forEach((key, i) =>
        node.setAttribute(key, [...a, ...b][i]),
      );
    }
    line("chord", start, trailing);
    line("wind", start, air);
    const camberPoints = section.centerline.map((p) => {
      const x = (p.x - 0.25) * 1.65,
        y = p.y * 1.65;
      return project(x * cos - y * sin, x * sin + y * cos).join(",");
    });
    overlay
      .querySelector(".camber")
      .setAttribute("d", "M" + camberPoints.join(" L"));
    const direction = Math.atan2(air[1] - start[1], air[0] - start[0]);
    const arrow = [1, -1].map((sign) => [
      air[0] - 8 * Math.cos(direction + sign * 0.5),
      air[1] - 8 * Math.sin(direction + sign * 0.5),
    ]);
    overlay
      .querySelector("polyline")
      .setAttribute(
        "points",
        [arrow[0], air, arrow[1]].map((p) => p.join(",")).join(" "),
      );
    const arcPoints = Array.from({ length: 19 }, (_, i) => {
      const a = (theta * i) / 18;
      return project(lead.x + 0.94 * Math.cos(a), lead.y + 0.94 * Math.sin(a));
    });
    overlay
      .querySelector(".angleArc")
      .setAttribute("d", "M" + arcPoints.map((p) => p.join(",")).join(" L"));
    for (const [i, pt] of [start, trailing].entries()) {
      const dot = overlay.querySelectorAll("circle")[i];
      dot.setAttribute("cx", pt[0]);
      dot.setAttribute("cy", pt[1]);
    }
    const text = overlay.querySelector("text");
    text.setAttribute("x", trailing[0] + 5);
    text.setAttribute("y", trailing[1] + (theta > 0 ? -9 : 18));
    text.textContent = "α " + angleText();
  }
  function angleText() {
    return Number(el("angle").value).toLocaleString(uiLocale) + "°";
  }

  const flows = new THREE.Group();
  scene.add(flows);
  const paths = [],
    samples = 111,
    packetCount = 7;
  const packetShape = new THREE.SphereGeometry(0.027, 6, 4);
  const packets = new THREE.InstancedMesh(
    packetShape,
    new THREE.MeshBasicMaterial({ color: 0x00848e }),
    5 * 3 * packetCount,
  );
  packets.frustumCulled = false;
  flows.add(packets);
  for (const z of [-0.85, 0, 0.85])
    for (const height of [-0.59, -0.25, 0.17, 0.4, 0.67]) {
      const positions = new Float32Array(samples * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: height > 0 ? 0x15939c : 0x3f849d,
          transparent: true,
          opacity: 0.62,
        }),
      );
      line.frustumCulled = false;
      flows.add(line);
      paths.push({ height, z, positions, geometry });
    }
  function updatePaths() {
    const angle = (Number(el("angle").value) * Math.PI) / 180;
    tunnel.wing.rotation.z = -angle;
    for (const path of paths) {
      for (let i = 0; i < samples; i++) {
        const x = -2.65 + (5.3 * i) / (samples - 1),
          u = THREE.MathUtils.clamp((x + 0.4125) / 1.65, 0, 1);
        const near =
          x < -0.4125
            ? Math.exp(-((x + 0.4125) ** 2) / 0.22)
            : x > 1.2375
              ? Math.exp(-((x - 1.2375) ** 2) / 0.65)
              : 1;
        const center =
          (-(1.65 * u - 0.4125) * Math.sin(angle) +
            1.65 * section.camber(u) * Math.cos(angle)) *
          near;
        path.positions.set(
          [
            x,
            path.height +
              center +
              Math.sign(path.height) *
                section.halfThickness(u) *
                1.65 *
                (1 - Math.abs(path.height)),
            path.z,
          ],
          i * 3,
        );
      }
      path.geometry.attributes.position.needsUpdate = true;
    }
  }
  const stamp = new THREE.Object3D();
  stamp.scale.set(2.1, 0.72, 0.72);
  function placePackets() {
    let count = 0;
    paths.forEach(({ positions }, row) => {
      for (let j = 0; j < packetCount; j++) {
        const p = ((phase + row * 0.043 + j / packetCount) % 1) * (samples - 1),
          idx = Math.floor(p) * 3,
          t = p % 1;
        stamp.position.set(
          THREE.MathUtils.lerp(positions[idx], positions[idx + 3], t),
          THREE.MathUtils.lerp(positions[idx + 1], positions[idx + 4], t),
          positions[idx + 2],
        );
        stamp.updateMatrix();
        packets.setMatrixAt(count++, stamp.matrix);
      }
    });
    packets.instanceMatrix.needsUpdate = true;
  }
  function drawProfile() {
    const canvas = el("profile"),
      w = canvas.clientWidth,
      h = canvas.clientHeight,
      dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#d6ded8";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    const angle = (Number(el("angle").value) * Math.PI) / 180;
    const chord = Math.min(
      380,
      w * 0.82,
      (h - 10) / (0.12 + Math.abs(Math.sin(angle))),
    );
    ctx.translate(w / 2, h * 0.5);
    ctx.rotate(angle);
    ctx.beginPath();
    for (const p of section.contour)
      ctx.lineTo((p.x - 0.5) * chord, -p.y * chord);
    ctx.closePath();
    ctx.fillStyle = "#dbb572";
    ctx.fill();
    ctx.strokeStyle = "#755d39";
    ctx.stroke();
    if (lab.measure) {
      ctx.strokeStyle = "#b43e00";
      ctx.beginPath();
      ctx.moveTo(-chord / 2, 0);
      ctx.lineTo(chord / 2, 0);
      ctx.stroke();
      ctx.strokeStyle = "#1250a2";
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const p of section.centerline)
        ctx.lineTo((p.x - 0.5) * chord, -p.y * chord);
      ctx.stroke();
    }
  }
  function syncControls() {
    section = airfoilSections.get(el("foilChoice").value);
    tunnel.setSection(section);
    el("sectionName").textContent = "NACA " + section.code;
    el("profile").setAttribute(
      "aria-label",
      "NACA " + section.code + uiText(" kanat kesiti"),
    );
    const angle = Number(el("angle").value),
      speed = Number(el("speed").value);
    el("angleVal").value = angle.toLocaleString(uiLocale) + "°";
    el("speedVal").value = speed + " m/s";
    el("play").textContent = running
      ? uiText("Ⅱ　Akışı duraklat")
      : uiText("▶　Akışı başlat");
    drawMeasurement();
    updateStatus();
    tunnel.shell.visible = el("glass").checked;
    flows.visible = el("lines").checked;
    const part = el("part").value;
    el("info").textContent =
      part === "wing" && section.code === "2412"
        ? uiText(
            "NACA 2412 kamburlu bir profildir. Ortalama eğrilik çizgisi, hücum kenarından itibaren veterin %40’ında %2 yüksekliğe ulaşır. Profilin nominal kalınlığı veterin %12’sidir.",
          )
        : partNotes[part];
    updatePaths();
    placePackets();
    drawProfile();
    refreshPressure();
  }
  for (const key of ["angle", "speed", "glass", "lines", "part", "foilChoice"])
    el(key).oninput = syncControls;
  el("play").onclick = () => {
    running = !running;
    syncControls();
  };
  function reset() {
    el("foilChoice").value = id ? "2412" : "0012";
    el("angle").value = id ? 8 : 4;
    el("speed").value = 20;
    el("lines").checked = el("glass").checked = true;
    el("part").value = "wing";
    running = true;
    phase = 0;
    tunnel.fan.rotation.x = 0;
    setView(lab.measure ? "yan" : "genel");
    syncControls();
  }
  const ray = new THREE.Raycaster();
  function pick(e) {
    const rect = host.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((e.clientY - rect.top) / rect.height) * 2,
      ),
      camera,
    );
    if (pickPressure(ray)) {
      el("part").value = "wing";
      syncControls();
      return;
    }
    const hits = ray
      .intersectObjects(tunnel.pickables, false)
      .filter(
        (hit) => hit.object.parent !== tunnel.shell || tunnel.shell.visible,
      );
    const hit =
      hits.find((hit) => hit.object.userData.part === "wing") || hits[0];
    if (hit) {
      el("part").value = hit.object.userData.part;
      syncControls();
    }
  }
  const pointers = new Map();
  let moved = false,
    total = 0;
  function distance() {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  host.onpointerdown = (e) => {
    host.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      moved = false;
      total = 0;
    } else moved = true;
  };
  host.onpointermove = (e) => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const dx = e.clientX - last.x,
      dy = e.clientY - last.y,
      before = pointers.size === 2 ? distance() : 0;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    total += Math.abs(dx) + Math.abs(dy);
    if (total > 4) moved = true;
    if (before > 1)
      zoom = THREE.MathUtils.clamp((zoom * distance()) / before, 0.5, 4);
    else if (moved) {
      selectedView = null;
      yaw -= dx * 0.008;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.008, -0.23, 1.56);
      panel
        .querySelectorAll("[data-view]")
        .forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
    cameraPose();
    shareCamera(id, [yaw, pitch, zoom], selectedView);
  };
  host.onpointerup = (e) => {
    if (pointers.has(e.pointerId) && !moved) pick(e);
    pointers.delete(e.pointerId);
  };
  host.onpointercancel = (e) => pointers.delete(e.pointerId);
  host.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = THREE.MathUtils.clamp(zoom * Math.exp(-e.deltaY * 0.0014), 0.5, 4);
      cameraPose();
      shareCamera(id, [yaw, pitch, zoom], selectedView);
    },
    { passive: false },
  );
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    const aspect = w / h,
      half = Math.max(2.65, 5.55 / aspect);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    drawProfile();
    drawMeasurement();
    refreshPressure();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  syncControls();
  let lastFrame = performance.now();
  function animate(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (panel.hidden) {
      requestAnimationFrame(animate);
      return;
    }
    if (running) {
      const speed = Number(el("speed").value);
      phase = (phase + dt * speed * 0.009) % 1;
      tunnel.fan.rotation.x += speed * 0.29 * dt;
      if (flows.visible) placePackets();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  return {
    id,
    reset,
    resize,
    refresh: syncControls,
    isRunning: () => running,
    isFlowing: () => running && Number(el("speed").value) > 0,
    cameraState: () => [[yaw, pitch, zoom], selectedView],
    setCamera(pose, view) {
      [yaw, pitch, zoom] = pose;
      selectedView = view;
      cameraPose();
      panel
        .querySelectorAll("[data-view]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.view === view)),
        );
    },
    sideMeasurement() {
      setView("yan");
      zoom = 1.65;
      cameraPose();
    },
  };
}
const lab = { compare: false, measure: false };
const experiments = [];
const byId = (id) => document.getElementById(id);
const firstPanel = byId("experiment");
const secondPanel = firstPanel.cloneNode(true);
secondPanel.id = "experimentB";
secondPanel.hidden = true;
secondPanel.setAttribute("aria-label", uiText("Deney B"));
for (const node of secondPanel.querySelectorAll("[id]")) node.id += "B";
for (const node of secondPanel.querySelectorAll("[for]"))
  node.setAttribute("for", node.getAttribute("for") + "B");
firstPanel.after(secondPanel);
const eachActive = (fn) =>
  experiments.slice(0, lab.compare ? 2 : 1).forEach(fn);
function shareCamera(source, pose, view) {
  eachActive((experiment) => {
    if (experiment.id !== source) experiment.setCamera(pose, view);
  });
}
function updateStatus() {
  const active = experiments.slice(0, lab.compare ? 2 : 1);
  if (!active.length) return;
  const live = active.some((e) => e.isFlowing());
  const paused = active.every((e) => !e.isRunning());
  byId("state").textContent = live
    ? uiText("Akış etkin")
    : paused
      ? uiText("Duraklatıldı")
      : uiText("Hız sıfır");
  byId("state").classList.toggle("paused", !live);
}
experiments.push(makeExperiment(firstPanel, ""));
function updateMode() {
  document.body.classList.toggle("comparing", lab.compare);
  document.body.classList.toggle("measuring", lab.measure);
  byId("compare").setAttribute("aria-pressed", String(lab.compare));
  byId("measure").setAttribute("aria-pressed", String(lab.measure));
  secondPanel.hidden = !lab.compare;
  if (lab.compare && experiments.length === 1) {
    byId("angleB").value = 8;
    byId("foilChoiceB").value = "2412";
    experiments.push(makeExperiment(secondPanel, "B"));
  }
  if (lab.compare) experiments[1].setCamera(...experiments[0].cameraState());
  eachActive((e) => {
    e.resize();
    e.refresh();
  });
  updateStatus();
}
byId("compare").onclick = () => {
  lab.compare = !lab.compare;
  updateMode();
};
byId("measure").onclick = () => {
  lab.measure = !lab.measure;
  if (lab.measure) eachActive((e) => e.sideMeasurement());
  updateMode();
};
byId("reset").onclick = () => {
  eachActive((e) => e.reset());
  updateMode();
};
updateMode();

for (const panel of [firstPanel, secondPanel]) {
  panel.querySelector(".paintToggle").oninput = refreshPressure;
  panel.querySelector(".probeSide").onchange = (e) => {
    probeSurface = e.target.value;
    refreshPressure();
  };
  panel.querySelector(".station").oninput = (e) => {
    probePercent = Number(e.target.value);
    refreshPressure();
  };
}
byId("matchConditions").onclick = () => {
  byId("angleB").value = byId("angle").value;
  byId("speedB").value = byId("speed").value;
  experiments[1].refresh();
};
