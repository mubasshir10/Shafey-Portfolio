const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

/* ---------- theme, nav ---------- */
const themeToggle = $('#theme-toggle');
const menuToggle = $('#menu-toggle');
const navLinks = $('#nav-links');
const themeColors = {
  dark: { line: 0x22d3ee, accent: 0xfbbf24, glass: 0x4aa8ff, mep1: 0x34d399, mep2: 0xf87171, grid: 0x1e3a6e, fogOp: 1 },
  light: { line: 0x0369a1, accent: 0xd97706, glass: 0x2563eb, mep1: 0x059669, mep2: 0xdc2626, grid: 0x9db6dd, fogOp: 1 },
};
const themeKey = () => (document.body.classList.contains('light') ? 'light' : 'dark');
const themeListeners = [];

function setTheme(light) {
  document.body.classList.toggle('light', light);
  themeToggle.textContent = light ? '🌙' : '☀️';
  try { localStorage.setItem('site-theme', light ? 'light' : 'dark'); } catch (e) {}
  themeListeners.forEach((fn) => fn());
}
try { if (localStorage.getItem('site-theme') === 'light') setTheme(true); } catch (e) {}
themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('light')));
menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
$$('.nav-links a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------- scroll: progress, topbar, active link, reveal ---------- */
const progress = $('#progress');
const topbar = $('#topbar');
const sections = $$('section[id]');
let scrollP = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollP = max > 0 ? scrollY / max : 0;
  progress.style.transform = `scaleX(${scrollP})`;
  topbar.classList.toggle('scrolled', scrollY > 30);
  let current = sections[0].id;
  sections.forEach((s) => { if (scrollY + innerHeight * 0.4 >= s.offsetTop) current = s.id; });
  $$('.nav-links a').forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 0.1 + 's'; io.observe(el); });

/* counters */
function countUp(el) {
  const target = +el.dataset.count;
  if (reduceMotion) { el.textContent = target; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min((t - t0) / 1600, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
setTimeout(() => $$('[data-count]').forEach(countUp), 500);

/* ---------- cursor glow, tilt, magnetic ---------- */
const glow = $('#cursor-glow');
const mouse = { x: 0, y: 0, nx: 0, ny: 0 };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  mouse.nx = (e.clientX / innerWidth) * 2 - 1;
  mouse.ny = (e.clientY / innerHeight) * 2 - 1;
  if (!coarse) { glow.style.opacity = 1; glow.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`; }
}, { passive: true });

if (!reduceMotion) {
  $$('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- 3D building factory ---------- */
function makeTower(THREE, { floors = 14, w = 2.2, d = 2.2, fh = 0.34, cols = 3, bracing = true } = {}) {
  const c = themeColors[themeKey()];
  const tower = new THREE.Group();
  const layers = { structure: [], facade: [], mep: [], core: [] };
  const floorGroups = [];
  const slabGeo = new THREE.BoxGeometry(w, 0.05, d);
  const slabEdges = new THREE.EdgesGeometry(slabGeo);
  const glassGeo = new THREE.BoxGeometry(w * 1.02, fh * 0.78, d * 1.02);
  const colPts = [], bracePts = [], mepA = [], mepB = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < cols; j++) {
    const x = -w / 2 + (w * i) / (cols - 1), z = -d / 2 + (d * j) / (cols - 1);
    colPts.push(x, 0, z, x, fh, z);
  }
  if (bracing) {
    bracePts.push(-w / 2, 0, d / 2, w / 2, fh, d / 2, w / 2, 0, d / 2, -w / 2, fh, d / 2);
    bracePts.push(-w / 2, 0, -d / 2, w / 2, fh, -d / 2, w / 2, 0, -d / 2, -w / 2, fh, -d / 2);
  }
  mepA.push(-w * 0.35, fh * 0.45, -d * 0.1, w * 0.35, fh * 0.45, -d * 0.1, -w * 0.35, fh * 0.45, d * 0.2, w * 0.35, fh * 0.45, d * 0.2);
  mepB.push(-w * 0.3, fh * 0.35, d * 0.35, w * 0.3, fh * 0.35, d * 0.35);
  const geo = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; };
  const colG = geo(colPts), braceG = geo(bracePts), mepAG = geo(mepA), mepBG = geo(mepB);
  const mats = {
    line: new THREE.LineBasicMaterial({ color: c.line, transparent: true, opacity: 0.85 }),
    slab: new THREE.MeshBasicMaterial({ color: c.line, transparent: true, opacity: 0.1, depthWrite: false }),
    brace: new THREE.LineBasicMaterial({ color: c.accent, transparent: true, opacity: 0.8 }),
    glass: new THREE.MeshBasicMaterial({ color: c.glass, transparent: true, opacity: 0.1, depthWrite: false }),
    mep1: new THREE.LineBasicMaterial({ color: c.mep1 }),
    mep2: new THREE.LineBasicMaterial({ color: c.mep2 }),
    core: new THREE.MeshBasicMaterial({ color: c.accent, transparent: true, opacity: 0.18, depthWrite: false }),
    coreLine: new THREE.LineBasicMaterial({ color: c.accent, transparent: true, opacity: 0.7 }),
  };
  const slabs = [];
  const coreGeo = new THREE.BoxGeometry(w * 0.3, fh, d * 0.3);
  const coreEdges = new THREE.EdgesGeometry(coreGeo);
  for (let f = 0; f < floors; f++) {
    const g = new THREE.Group();
    g.position.y = f * fh;
    const slab = new THREE.Mesh(slabGeo, mats.slab); slab.userData.level = f;
    const slabL = new THREE.LineSegments(slabEdges, mats.line);
    const col = new THREE.LineSegments(colG, mats.line);
    const glass = new THREE.Mesh(glassGeo, mats.glass); glass.position.y = fh / 2;
    const glassE = new THREE.LineSegments(new THREE.EdgesGeometry(glassGeo), new THREE.LineBasicMaterial({ color: c.glass, transparent: true, opacity: 0.28 })); glassE.position.y = fh / 2;
    const m1 = new THREE.LineSegments(mepAG, mats.mep1), m2 = new THREE.LineSegments(mepBG, mats.mep2);
    const core = new THREE.Mesh(coreGeo, mats.core); core.position.y = fh / 2;
    const coreL = new THREE.LineSegments(coreEdges, mats.coreLine); coreL.position.y = fh / 2;
    layers.structure.push(slab, slabL, col);
    layers.facade.push(glass, glassE);
    layers.mep.push(m1, m2);
    layers.core.push(core, coreL);
    g.add(slab, slabL, col, glass, glassE, m1, m2, core, coreL);
    if (bracing && f % 2 === 0) { const b = new THREE.LineSegments(braceG, mats.brace); g.add(b); layers.structure.push(b); }
    tower.add(g); floorGroups.push(g); slabs.push(slab);
  }
  tower.userData = { layers, floorGroups, slabs, fh, floors, mats };
  tower.recolor = () => {
    const k = themeColors[themeKey()];
    mats.line.color.setHex(k.line); mats.slab.color.setHex(k.line); mats.brace.color.setHex(k.accent);
    mats.glass.color.setHex(k.glass); mats.mep1.color.setHex(k.mep1); mats.mep2.color.setHex(k.mep2);
    mats.core.color.setHex(k.accent); mats.coreLine.color.setHex(k.accent);
  };
  themeListeners.push(tower.recolor);
  return tower;
}

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
}
const canGL = typeof THREE !== 'undefined' && webglOK();

/* ---------- hero background scene ---------- */
function initBackground() {
  const canvas = $('#bg3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const world = new THREE.Group(); scene.add(world);

  const specs = [
    { x: 0, z: 0, floors: 24, w: 2.2, d: 2.2, delay: 0 },
    { x: -3.4, z: 1.2, floors: 15, w: 1.8, d: 1.8, delay: 0.5 },
    { x: 3.2, z: -0.8, floors: 18, w: 2.0, d: 1.7, delay: 0.9 },
    { x: -1.2, z: -3.6, floors: 10, w: 2.4, d: 1.6, delay: 1.3 },
    { x: 2.6, z: 3.0, floors: 8, w: 1.6, d: 1.6, delay: 1.6 },
    { x: -5.6, z: -2.2, floors: 7, w: 1.5, d: 1.5, delay: 1.9 },
  ];
  const towers = specs.map((s) => {
    const t = makeTower(THREE, { floors: s.floors, w: s.w, d: s.d, fh: 0.4 });
    t.position.set(s.x, 0, s.z); t.userData.delay = s.delay; world.add(t); return t;
  });

  const grid = new THREE.GridHelper(40, 40, themeColors.dark.grid, themeColors.dark.grid);
  grid.material.transparent = true; grid.material.opacity = 0.5; grid.position.y = -0.05; world.add(grid);
  const ringMat = new THREE.MeshBasicMaterial({ color: themeColors.dark.line, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(7.6, 7.7, 96), ringMat); ring.rotation.x = -Math.PI / 2; world.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.25, 96), ringMat); ring2.rotation.x = -Math.PI / 2; world.add(ring2);

  // floating particles
  const N = 380, pp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pp[i * 3] = (Math.random() - 0.5) * 30; pp[i * 3 + 1] = Math.random() * 14; pp[i * 3 + 2] = (Math.random() - 0.5) * 30; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pm = new THREE.PointsMaterial({ color: themeColors.dark.line, size: 0.05, transparent: true, opacity: 0.7 });
  const pts = new THREE.Points(pg, pm); scene.add(pts);

  themeListeners.push(() => {
    const k = themeColors[themeKey()];
    grid.material.color.setHex(k.grid); ringMat.color.setHex(k.line); pm.color.setHex(k.line);
  });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  let ry = 0, rx = 0, sx = 0;
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) loop(); });

  function loop() {
    if (!visible) return;
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    const wide = innerWidth / innerHeight > 1.5;
    // construction: floors rise one by one
    towers.forEach((tw) => {
      const { floorGroups, floors } = tw.userData;
      const prog = reduceMotion ? 1 : Math.max(0, Math.min(1, (t - tw.userData.delay) / 2.4));
      floorGroups.forEach((g, i) => {
        const k = Math.max(0, Math.min(1, prog * (floors + 3) - i));
        g.scale.y = Math.max(0.001, k); g.visible = k > 0.001;
        g.position.y = i * 0.4 + (1 - k) * 0.6;
      });
    });
    const targetY = scrollP * Math.PI * 2.2 + mouse.nx * 0.35 + (reduceMotion ? 0 : t * 0.06);
    ry += (targetY - ry) * 0.05;
    rx += (mouse.ny * 0.08 - rx) * 0.05;
    world.rotation.y = ry; world.rotation.x = rx;
    const targetX = wide ? 4.4 * (1 - Math.min(scrollP * 6, 1)) : 0;
    sx += (targetX - sx) * 0.05;
    camera.position.set(sx * 0.3, 5.5 + scrollP * 5, (wide ? 17 : 26) - scrollP * 3);
    camera.lookAt(-sx * 0.55, (wide ? 3.2 : -0.5) + scrollP * 1.5, 0);
    world.position.x = sx * 0.6 - 0.5;
    ring.rotation.z = t * 0.1; ring2.rotation.z = -t * 0.15;
    pts.rotation.y = t * 0.02;
    const fade = Math.max(0.28, 1 - scrollY / (innerHeight * 0.9));
    canvas.style.opacity = wide ? Math.max(0.35, fade) : Math.max(0.2, fade * 0.85);
    renderer.render(scene, camera);
  }
  loop();
}

/* ---------- BIM viewer ---------- */
function initBIM() {
  const canvas = $('#bim-canvas');
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const tower = makeTower(THREE, { floors: 16, w: 2.6, d: 2.2, fh: 0.4, cols: 4 });
  tower.position.y = -3.2;
  const pivot = new THREE.Group(); pivot.add(tower); scene.add(pivot);
  const grid = new THREE.GridHelper(12, 24, themeColors.dark.grid, themeColors.dark.grid);
  grid.position.y = -3.25; scene.add(grid);
  themeListeners.push(() => grid.material.color.setHex(themeColors[themeKey()].grid));

  let yaw = 0.6, pitch = 0.25, dist = 12, dragging = false, last = [0, 0], explode = 0, explodeT = 0, auto = true, inView = false;
  const fh = tower.userData.fh;

  function resize() {
    const r = wrap.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    dist = r.width < 520 ? 15 : 12;
  }
  resize(); addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', (e) => { dragging = true; auto = false; last = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      yaw += (e.clientX - last[0]) * 0.008;
      pitch = Math.max(-0.3, Math.min(1.1, pitch + (e.clientY - last[1]) * 0.006));
      last = [e.clientX, e.clientY];
    }
    hover(e);
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

  const ray = new THREE.Raycaster(), tip = $('#bim-tip');
  function hover(e) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(tower.userData.slabs.filter((s) => s.visible), false)[0];
    if (hit) {
      const lvl = hit.object.userData.level;
      tip.hidden = false; tip.textContent = `Level ${lvl} · +${(lvl * 3.4).toFixed(1)} m`;
      tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px';
    } else tip.hidden = true;
  }

  $('#bim-explode').addEventListener('input', (e) => { explodeT = e.target.value / 100; });
  $$('.layer-toggles button').forEach((b) => b.addEventListener('click', () => {
    b.classList.toggle('on');
    tower.userData.layers[b.dataset.layer].forEach((o) => { o.visible = b.classList.contains('on'); });
  }));

  new IntersectionObserver((en) => { const was = inView; inView = en[0].isIntersecting && $('#pane-bim').classList.contains('active'); if (inView && !was) loop(); }).observe(wrap);
  window.bimWake = () => { inView = $('#pane-bim').classList.contains('active'); if (inView) { resize(); loop(); } };

  function loop() {
    if (!inView) return;
    requestAnimationFrame(loop);
    if (auto && !reduceMotion) yaw += 0.004;
    explode += (explodeT - explode) * 0.1;
    tower.userData.floorGroups.forEach((g, i) => { g.position.y = i * fh * (1 + explode * 2.2); });
    tower.position.y = -3.2 - explode * 2.6;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist + 1.4, Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(0, 0.4 + explode * 1.2, 0);
    renderer.render(scene, camera);
  }
}

if (canGL) { initBackground(); } else {
  $('#bg3d').remove();
  document.body.style.background = 'radial-gradient(circle at 70% 20%, #12234a, #060b16)';
}

/* ---------- drawings ---------- */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };

// elevation windows
const elevWin = $('#elev-windows');
for (let r = 0; r < 14; r++) for (let c = 0; c < 8; c++) el('rect', { x: 182 + c * 35.5, y: 72 + r * 20.4, width: 26, height: 12 }, elevWin);
// section slabs and columns
const sSl = $('#sect-slabs'), sCol = $('#sect-cols');
for (let f = 0; f <= 7; f++) { el('rect', { x: 150, y: 60 + f * 34, width: 340, height: 6 }, sSl); }
[150, 235, 320, 405, 490].forEach((x) => el('rect', { x: x - 5, y: 60, width: 10, height: 240 }, sCol));

$$('.sheet').forEach((svg) => {
  let i = 0;
  $$('path, rect, circle, line', svg).forEach((n) => {
    if (n.closest('defs') || n.closest('pattern')) return;
    if (n.getAttribute('fill') && n.getAttribute('fill').startsWith('url')) { n.style.fill = n.getAttribute('fill'); return; }
    n.setAttribute('pathLength', 1);
    n.classList.add('draw-el');
    n.style.animationDelay = Math.min(i++ * 0.03, 1.2) + 's';
  });
});

const tabs = $$('.drawing-tabs button');
let bimReady = false;
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', x === t); });
  $$('.pane').forEach((p) => p.classList.toggle('active', p.id === 'pane-' + t.dataset.tab));
  if (t.dataset.tab === 'bim') {
    if (!canGL) { $('#pane-bim').innerHTML = '<p class="caption">3D view needs WebGL, which is not available in this browser.</p>'; return; }
    if (!bimReady) { initBIM(); bimReady = true; }
    window.bimWake();
  } else if (window.bimWake) window.bimWake();
}));

/* ---------- resume + contact ---------- */
$('#resume-btn').addEventListener('click', () => {
  const html = `<!doctype html><meta charset="utf-8"><title>Shafey, Resume</title><style>body{font:15px/1.6 system-ui;max-width:720px;margin:40px auto;padding:0 20px;color:#111}h1{margin:0}h2{border-bottom:2px solid #0891b2;padding-bottom:4px;margin-top:28px}</style>
<h1>Shafey</h1><p>Civil &amp; Structural Engineer · BIM Specialist<br>India (Remote) · shafeykhan007@gmail.com · +91 84212 97861</p>
<h2>Profile</h2><p>10+ years in structural design, BIM coordination and site delivery across residential, commercial and infrastructure projects.</p>
<h2>Experience</h2><p><b>Senior Civil Engineer</b>, DesignWorks Engineering (2021 – Present)<br>Structural design and BIM coordination for high-rise developments; model-based documentation cut rework by 22%.</p>
<p><b>Project Engineer</b>, Infrastructure Solutions Ltd. (2017 – 2021)<br>Infrastructure planning and QA for bridges, roads and utilities; delivered three flagship projects ahead of schedule.</p>
<h2>Skills</h2><p>Revit, AutoCAD, BIM, STAAD Pro, ETABS · Structural analysis, site management, project planning, QA</p>
<h2>Certifications</h2><p>Professional Engineer (PE) · BIM Management Certification · LEED Green Associate</p>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'Shafey-Resume.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = `${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`;
  location.href = `mailto:shafeykhan007@gmail.com?subject=${encodeURIComponent('Project enquiry from ' + f.get('name'))}&body=${encodeURIComponent(body)}`;
  $('#form-note').textContent = 'Opening your email app with the message ready to send…';
});
