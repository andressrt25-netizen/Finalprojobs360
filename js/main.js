// ============================================================================
// REVEAL ANIMATION ON SCROLL
// ============================================================================
const ro = new IntersectionObserver((es) => {
  es.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 100);
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ============================================================================
// LANGUAGE SYSTEM - BILINGUAL SUPPORT (English / Spanish)
// ============================================================================
let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;

  // Update nav toggle buttons
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === lang);
  });

  // Update form inline toggle
  const fe = document.getElementById('formLangEN');
  const fs = document.getElementById('formLangES');
  if (fe && fs) {
    fe.classList.toggle('active', lang === 'en');
    fs.classList.toggle('active', lang === 'es');
  }

  // Update all elements with data-en/data-es attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = el.getAttribute('data-' + lang);
    if (!val) return;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.tagName === 'OPTION') {
      el.textContent = val;
    } else {
      el.innerHTML = val;
    }
  });

  // Update html lang attribute
  document.getElementById('html-root').lang = lang === 'es' ? 'es' : 'en';
}

// ============================================================================
// FORM SUBMISSION HANDLER
// ============================================================================
function handleSubmit(e) {
  e.preventDefault();

  const btn = e.target.querySelector('.submit-btn');
  const msg = document.getElementById('successMsg');

  // Show success state
  btn.textContent = currentLang === 'es' ? '✓ ¡Estás Dentro!' : '✓ You\'re In!';
  btn.style.background = '#27AE60';
  msg.style.display = 'block';

  // Reset after 4 seconds
  setTimeout(() => {
    btn.textContent = currentLang === 'es' ? 'Únete a ProJobs360 — Gratis →' : 'Join ProJobs360 — Free →';
    btn.style.background = '';
    msg.style.display = 'none';
    e.target.reset();
  }, 4000);
}

// ============================================================================
// PARTICLE EFFECTS
// ============================================================================
function makeParticles(id, color, count) {
  const container = document.getElementById(id);
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = color;
    particle.style.left = '50%';
    particle.style.top = '50%';

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;

    particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--py', Math.sin(angle) * distance + 'px');
    particle.style.animation = `particleBurst ${0.4 + Math.random() * 0.4}s ease forwards`;
    particle.style.animationDelay = Math.random() * 0.1 + 's';

    container.appendChild(particle);
  }
}

// ============================================================================
// PHASE 01: DRILL ANIMATION
// ============================================================================
let drillActive = false;

function triggerDrill() {
  if (drillActive) return;
  drillActive = true;

  const sil = document.getElementById('sil01');
  sil.classList.add('active');

  const drillGroup = document.getElementById('drillGroup');
  drillGroup.style.animation = 'drillShake 0.08s infinite';

  const drillHole = document.getElementById('drillHole');
  const drillHoleOuter = document.getElementById('drillHoleOuter');

  let holeSize = 0;
  const growInterval = setInterval(() => {
    holeSize += 0.8;
    drillHole.setAttribute('r', Math.min(holeSize, 8));
    drillHoleOuter.setAttribute('r', Math.min(holeSize + 2, 12));
    if (holeSize >= 8) clearInterval(growInterval);
  }, 30);

  const sparks = document.getElementById('sparks01');
  sparks.setAttribute('opacity', '1');

  for (let i = 0; i < 14; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const angle = Math.random() * Math.PI * 2;
    const length = 8 + Math.random() * 20;

    line.setAttribute('x1', '232');
    line.setAttribute('y1', '129');
    line.setAttribute('x2', 232 + Math.cos(angle) * length);
    line.setAttribute('y2', 129 + Math.sin(angle) * length);
    line.setAttribute('stroke', i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#F06020' : '#FF8C00');
    line.setAttribute('stroke-width', '1.5');

    sparks.appendChild(line);
  }

  makeParticles('parts01', '#F06020', 28);

  setTimeout(() => {
    drillGroup.style.animation = 'none';
    sparks.setAttribute('opacity', '0');
    sparks.innerHTML = '';
    drillHole.setAttribute('r', '0');
    drillHoleOuter.setAttribute('r', '0');
    sil.classList.remove('active');
    drillActive = false;
  }, 1800);
}

// ============================================================================
// PHASE 02: HAMMER ANIMATION
// ============================================================================
let hammerActive = false;

function triggerHammer() {
  if (hammerActive) return;
  hammerActive = true;

  const sil = document.getElementById('sil02');
  sil.classList.add('active');

  const arm = document.getElementById('hammerArm');
  const nailShaft = document.getElementById('nailShaft');
  const nailHead = document.getElementById('nailHead');

  let swings = 0;
  let nailDepth = 0;

  const swingInterval = setInterval(() => {
    swings++;

    arm.style.transition = 'transform 0.12s ease-in';
    arm.style.transform = 'rotate(50deg)';
    arm.style.transformOrigin = '162px 184px';

    setTimeout(() => {
      nailDepth += 4;
      nailShaft.setAttribute('y', 154 + nailDepth);
      nailHead.setAttribute('y', 148 + nailDepth);
      makeParticles('parts02', '#fff', 14);

      setTimeout(() => {
        arm.style.transition = 'transform 0.18s ease-out';
        arm.style.transform = 'rotate(0deg)';
      }, 80);
    }, 120);

    if (swings >= 5) {
      clearInterval(swingInterval);
      setTimeout(() => {
        arm.style.transform = 'rotate(0deg)';
        sil.classList.remove('active');
        hammerActive = false;

        setTimeout(() => {
          nailShaft.setAttribute('y', '154');
          nailHead.setAttribute('y', '148');
        }, 1200);
      }, 400);
    }
  }, 280);
}

// ============================================================================
// PHASE 03: PAINT ANIMATION
// ============================================================================
let paintActive = false;

function triggerPaint() {
  if (paintActive) return;
  paintActive = true;

  const sil = document.getElementById('sil03');
  sil.classList.add('active');

  const roller = document.getElementById('paintRoller');
  const trail = document.getElementById('paintTrail');
  const layer = document.getElementById('paintLayer');
  const drips = document.getElementById('paintDrips');

  layer.style.width = '100%';
  drips.setAttribute('opacity', '1');

  let position = 0;
  const rollInterval = setInterval(() => {
    position += 3;
    roller.style.transform = `translateX(${Math.sin(position * 0.1) * 3}px)`;
    trail.setAttribute('width', Math.min(position * 2, 200));

    if (position >= 65) {
      clearInterval(rollInterval);

      let rollback = 65;
      const rollbackInterval = setInterval(() => {
        rollback -= 3;

        if (rollback <= 0) {
          clearInterval(rollbackInterval);
          makeParticles('parts03', '#F06020', 20);

          setTimeout(() => {
            sil.classList.remove('active');
            paintActive = false;
            layer.style.width = '0';
            trail.setAttribute('width', '0');
            drips.setAttribute('opacity', '0');
          }, 800);
        }
      }, 30);
    }
  }, 20);
}

// ============================================================================
// PHASE 04: FUTURE/SKYSCRAPER ANIMATION
// ============================================================================
let futureActive = false;
let animationFrame = null;
let buildings = [];

function triggerFuture() {
  if (futureActive) return;
  futureActive = true;

  const sil = document.getElementById('sil04');
  sil.classList.add('active');

  const canvas = document.getElementById('cityCanvas');
  const ctx = canvas.getContext('2d');
  const dataParticles = document.getElementById('dataParticles');
  const energyBeam = document.getElementById('energyBeam');
  const pointGlow = document.getElementById('pointGlow');
  const pointRing = document.getElementById('pointRing');
  const ring1 = document.getElementById('holoRing1');
  const ring2 = document.getElementById('holoRing2');

  energyBeam.setAttribute('stroke', 'rgba(255,255,255,0.5)');
  pointGlow.style.animation = 'glowPulse 0.3s infinite';
  pointRing.style.animation = 'glowPulse 0.5s infinite';
  dataParticles.style.animation = 'floatAnim 0.8s ease-in-out infinite';

  let ringSize = 0;
  const ringInterval = setInterval(() => {
    ringSize += 3;
    ring1.setAttribute('rx', ringSize);
    ring1.setAttribute('ry', ringSize * 0.3);
    ring2.setAttribute('rx', ringSize * 0.7);
    ring2.setAttribute('ry', ringSize * 0.2);
    if (ringSize >= 110) clearInterval(ringInterval);
  }, 20);

  buildings = [
    { x: 10, w: 26, h: 0, tH: 170, col: '#0d0d0d', win: '#F06020', d: 0, ant: true },
    { x: 40, w: 20, h: 0, tH: 120, col: '#111', win: '#fff', d: 100, ant: false },
    { x: 65, w: 30, h: 0, tH: 210, col: '#0a0a0a', win: '#F06020', d: 200, ant: true },
    { x: 100, w: 18, h: 0, tH: 95, col: '#111', win: '#ddd', d: 150, ant: false },
    { x: 122, w: 34, h: 0, tH: 250, col: '#0d0d0d', win: '#F06020', d: 280, ant: true },
    { x: 161, w: 22, h: 0, tH: 135, col: '#111', win: '#fff', d: 180, ant: false },
    { x: 188, w: 28, h: 0, tH: 190, col: '#0a0a0a', win: '#F06020', d: 240, ant: true },
    { x: 222, w: 24, h: 0, tH: 115, col: '#111', win: '#ddd', d: 80, ant: false },
    { x: 251, w: 22, h: 0, tH: 155, col: '#0d0d0d', win: '#F06020', d: 320, ant: true },
    { x: 278, w: 18, h: 0, tH: 90, col: '#111', win: '#fff', d: 60, ant: false }
  ];

  const groundY = 310;
  let startTime = null;

  function drawBuilding(b) {
    if (b.h <= 0) return;

    const x = b.x, y = groundY - b.h, w = b.w, h = b.h;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, b.col);
    g.addColorStop(1, '#000');

    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);

    if (h > 18) {
      const ww = 3, wh = 4;
      const nc = Math.floor((w - 4) / 7);
      const nr = Math.floor(h / 10);

      for (let r = 0; r < nr; r++) {
        for (let c = 0; c < nc; c++) {
          const wx = x + 3 + c * 7;
          const wy = y + 5 + r * 10;
          if (wy + wh > groundY) continue;

          const lit = Math.random() > 0.35;
          ctx.globalAlpha = lit ? 0.4 + Math.random() * 0.4 : 0.05;
          ctx.fillStyle = lit ? b.win : '#000';

          if (lit) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = b.win;
          }
          ctx.fillRect(wx, wy, ww, wh);
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
    }

    if (b.ant && h > 50) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w / 2, y - 18);
      ctx.stroke();

      if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#F06020';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#F06020';
        ctx.beginPath();
        ctx.arc(x + w / 2, y - 19, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.globalAlpha = 1;
    ctx.fillRect(x, y, w, 1);
  }

  function drawScene() {
    ctx.clearRect(0, 0, 340, 340);

    const sky = ctx.createLinearGradient(0, 0, 0, 340);
    sky.addColorStop(0, '#000');
    sky.addColorStop(0.6, '#050505');
    sky.addColorStop(1, '#0a0505');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 340, 340);

    for (let i = 0; i < 40; i++) {
      const sx = (i * 53 + 17) % 340;
      const sy = (i * 37 + 11) % 140;
      ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 900 + i) * 0.15;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 5 === 0 ? 1.3 : 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,248,220,0.18)';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,248,220,0.3)';
    ctx.beginPath();
    ctx.arc(290, 28, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(297, 23, 13, 0, Math.PI * 2);
    ctx.fill();

    const hg = ctx.createLinearGradient(0, 260, 0, 310);
    hg.addColorStop(0, 'rgba(240,96,32,0.06)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 260, 340, 50);

    buildings.forEach(b => drawBuilding(b));

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(340, groundY);
    ctx.stroke();

    const gg = ctx.createLinearGradient(0, groundY, 0, groundY + 15);
    gg.addColorStop(0, 'rgba(255,255,255,0.08)');
    gg.addColorStop(1, 'transparent');
    ctx.fillStyle = gg;
    ctx.fillRect(0, groundY, 340, 15);
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    buildings.forEach(b => {
      if (elapsed > b.d) {
        const progress = Math.min(1, (elapsed - b.d) / 1400);
        b.h = b.tH * (1 - Math.pow(1 - progress, 3));
      }
    });

    drawScene();

    if (elapsed < 3500) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = requestAnimationFrame(animateContinue);
    }
  }

  function animateContinue() {
    drawScene();
    if (futureActive) animationFrame = requestAnimationFrame(animateContinue);
  }

  makeParticles('parts04', '#fff', 30);
  animationFrame = requestAnimationFrame(animate);

  setTimeout(() => {
    energyBeam.setAttribute('stroke', 'rgba(255,255,255,0)');
    pointGlow.style.animation = 'none';
    pointRing.style.animation = 'none';
    dataParticles.style.animation = 'none';
    ring1.setAttribute('rx', '0');
    ring1.setAttribute('ry', '0');
    ring2.setAttribute('rx', '0');
    ring2.setAttribute('ry', '0');
    sil.classList.remove('active');

    let opacity = 1;
    const fadeInterval = setInterval(() => {
      opacity -= 0.04;
      canvas.style.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, 340, 340);
        canvas.style.opacity = 1;
        buildings = [];
        futureActive = false;
      }
    }, 80);
  }, 6000);
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('cityCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 340, 340);
  }
});