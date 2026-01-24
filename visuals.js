window.VisualsState = {
  wavePhase: 0,
  bandEnv: [0, 0, 0, 0, 0],
  idleBeat: 0,
  waveEnergy: 0,
  PARTICLE_COUNT: 270,
  PARTICLE_LAYERS: 3,
  particles: [],   
  rays: [],    
};

window.Visuals = {
  handleResizeForVisuals,
  drawBars,
  drawCircle,
  drawWave,
  drawParticles,
  drawMirror,
  drawBurst,        
};

function handleResizeForVisuals() {
  VisualsState.particles = [];
  VisualsState.rays = [];
}

function drawBars(ctx, canvas, dataArray, theme) {
  if (!dataArray) return;

  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  const visibleBins = end - start;
  const barWidth = canvas.width / visibleBins;

  let x = 0;
  for (let i = start; i < end; i++) {
    const h = Math.pow(dataArray[i] / 255, 1.7) * 255;
    const colorFn = theme && theme.barsColor;
    ctx.fillStyle = colorFn ? colorFn(h) : `rgb(${h + 50},80,255)`;
    ctx.fillRect(x, canvas.height - h, barWidth, h);
    x += barWidth + 1;
  }
}

function drawCircle(ctx, canvas, dataArray, theme) {
  if (!dataArray) return;

  const state = VisualsState;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const minSide = Math.min(w, h);
  const margin = 20;
  const radiusLimit = minSide * 0.5 - margin;

  const len = dataArray.length;
  if (!len) return;

  const lowEnd  = Math.floor(len * 0.25);
  const midEnd  = Math.floor(len * 0.60);

  let lowSum = 0, lowCount = 0;
  let midSum = 0, midCount = 0;
  let highSum = 0, highCount = 0;

  for (let i = 0; i < len; i++) {
    const v = dataArray[i];
    if (i < lowEnd) {
      lowSum += v; lowCount++;
    } else if (i < midEnd) {
      midSum += v; midCount++;
    } else {
      highSum += v; highCount++;
    }
  }

  const bandRaw = [
    lowCount  ? (lowSum  / lowCount)  / 255 : 0,
    midCount  ? (midSum  / midCount)  / 255 : 0,
    highCount ? (highSum / highCount) / 255 : 0,
  ];

  if (!state.bandEnv || state.bandEnv.length !== 3) {
    state.bandEnv = [0, 0, 0];
  }
  const env = state.bandEnv;

  const attack  = 0.6;
  const release = 0.18;

  for (let i = 0; i < 3; i++) {
    let target = Math.pow(bandRaw[i], 1.1) * 2.0; 
    if (target > 1) target = 1;

    env[i] += (target - env[i]) * (target > env[i] ? attack : release);
  }

  state.bandEnv = env;

  const baseFrac = [0.70, 0.52, 0.36]; 
  const ampFrac  = [0.40, 0.32, 0.26];

  const radii = [];
  for (let i = 0; i < 3; i++) {
    const baseR = radiusLimit * baseFrac[i];
    const amp   = radiusLimit * ampFrac[i];
    const r     = baseR + amp * env[i];
    radii.push(Math.min(r, radiusLimit));
  }

  const wobble = Math.sin(state.wavePhase * 2.0) * (minSide * 0.01);
  for (let i = 0; i < 3; i++) {
    radii[i] += wobble * (0.5 + 0.5 * i); 
  }

  const gradCols = (theme && theme.waveGradient) || ["#ff5efb", "#4cc3ff", "#7dffb0"];
  const c0 = gradCols[0];
  const c1 = gradCols[1];
  const c2 = gradCols[2];

  const TAU = Math.PI * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.wavePhase * 0.15); 

  function ring(radius, energy, color, lineBase, blurBase) {
    ctx.beginPath();
    ctx.lineWidth  = lineBase + 8 * energy;
    ctx.shadowBlur = blurBase + 30 * energy;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
  }

  {
    const r = radii[0];
    ctx.beginPath();
    const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.05);
    g.addColorStop(0.0, c0);
    g.addColorStop(0.5, c1);
    g.addColorStop(1.0, c2);
    ctx.lineWidth  = 5 + 10 * env[0];
    ctx.shadowBlur = 25 + 40 * env[0];
    ctx.shadowColor = c0;
    ctx.strokeStyle = g;
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }

  ring(radii[1], env[1], c1, 3.2, 18);

  ring(radii[2], env[2], c2, 2.4, 14);

  {
    const r = radii[2] * 0.9;
    ctx.beginPath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0.0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, c1);
    g.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.shadowBlur = 20 + 25 * env[2];
    ctx.shadowColor = c1;
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
  }

  ctx.restore();

  state.wavePhase += 0.03;
}

function drawWave(ctx, canvas, dataArray, analyser, theme) {
  if (!dataArray || !analyser) return;

  const state = VisualsState;

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height * 0.5;

  analyser.getByteTimeDomainData(dataArray);

  let sumSq = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sumSq += v * v;
  }
  const rms = Math.sqrt(sumSq / dataArray.length);

  let target = Math.min(1, rms * 2.5);

  const attack = 0.15;
  const release = 0.05;
  let waveEnergy = state.waveEnergy;
  waveEnergy += (target - waveEnergy) * (target > waveEnergy ? attack : release);
  state.waveEnergy = waveEnergy;

  const baseAmp = height * 0.06;
  const extraAmp = height * 0.16 * waveEnergy;
  const amplitude = baseAmp + extraAmp;

  const POINTS = 120;
  const step = dataArray.length / POINTS;
  const samples = new Array(POINTS);

  for (let i = 0; i < POINTS; i++) {
    const centerIndex = i * step;
    const i0 = Math.floor(centerIndex - 2);
    const i1 = Math.floor(centerIndex + 2);
    let sum = 0;
    let count = 0;

    for (let j = i0; j <= i1; j++) {
      if (j < 0 || j >= dataArray.length) continue;
      const v = (dataArray[j] - 128) / 128;
      sum += v;
      count++;
    }
    samples[i] = count ? sum / count : 0;
  }

  for (let pass = 0; pass < 2; pass++) {
    const tmp = samples.slice();
    for (let i = 1; i < POINTS - 1; i++) {
      samples[i] = (tmp[i - 1] + tmp[i] + tmp[i + 1]) / 3;
    }
  }

  ctx.lineWidth = 1.5 + 2.5 * waveEnergy;
  ctx.shadowBlur = 12 + 18 * waveEnergy;
  ctx.shadowColor = "rgb(181, 226, 247)";

  const gradColors = (theme && theme.waveGradient) || [
    "#1d3cff",
    "#3dd5ff",
    "#4ff0c8",
  ];
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0.0, gradColors[0]);
  grad.addColorStop(0.5, gradColors[1]);
  grad.addColorStop(1.0, gradColors[2]);
  ctx.strokeStyle = grad;

  ctx.beginPath();

  let x0 = 0;
  let y0 = centerY + samples[0] * amplitude;
  ctx.moveTo(x0, y0);

  for (let i = 1; i < POINTS - 1; i++) {
    const x1 = (i / (POINTS - 1)) * width;
    const y1 = centerY + samples[i] * amplitude;
    const x2 = ((i + 1) / (POINTS - 1)) * width;
    const y2 = centerY + samples[i + 1] * amplitude;

    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;

    ctx.quadraticCurveTo(x1, y1, xc, yc);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.25;
  ctx.shadowBlur = 8 + 10 * waveEnergy;

  ctx.beginPath();
  x0 = 0;
  y0 = centerY - samples[0] * amplitude * 0.6;
  ctx.moveTo(x0, y0);

  for (let i = 1; i < POINTS - 1; i++) {
    const x1 = (i / (POINTS - 1)) * width;
    const y1 = centerY - samples[i] * amplitude * 0.6;
    const x2 = ((i + 1) / (POINTS - 1)) * width;
    const y2 = centerY - samples[i + 1] * amplitude * 0.6;

    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;
    ctx.quadraticCurveTo(x1, y1, xc, yc);
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
}

function initParticlesInternal(canvas, dataArray, theme) {
  const state = VisualsState;
  state.particles = [];

  const w = canvas.width;
  const h = canvas.height;
  const minSide = Math.min(w, h);
  const TAU = Math.PI * 2;

  const radiusBands = [
    { min: minSide * 0.30, max: minSide * 0.46 },
    { min: minSide * 0.20, max: minSide * 0.34 },
    { min: minSide * 0.12, max: minSide * 0.24 },
  ];

  const freqBands = [
    { start: 0.0, end: 0.3 },
    { start: 0.25, end: 0.65 },
    { start: 0.6, end: 0.95 },
  ];

  const hueBase =
    (theme && theme.particleHueBase) || [210, 260, 180];

  const perLayer = Math.floor(
    state.PARTICLE_COUNT / state.PARTICLE_LAYERS
  );

  for (let layer = 0; layer < state.PARTICLE_LAYERS; layer++) {
    const rBand = radiusBands[layer];
    const fBand = freqBands[layer];

    for (let i = 0; i < perLayer; i++) {
      const angle = Math.random() * TAU;

      const baseRadius =
        rBand.min + (rBand.max - rBand.min) * Math.random();

      const speedMag = 0.0012 + Math.random() * 0.0018;
      const direction = layer === 1 ? -1 : 1;
      const speed = speedMag * direction;

      const size = 2.2 + Math.random() * 0.6;
      const norm =
        fBand.start + (fBand.end - fBand.start) * Math.random();
      const binIndex = Math.floor(norm * (dataArray.length - 1));

      const radiusAmp =
        layer === 0
          ? minSide * 0.18
          : layer === 1
          ? minSide * 0.14
          : minSide * 0.10;

      const hueJitter = (Math.random() - 0.5) * 20;
      const hue = hueBase[layer] + hueJitter;

      state.particles.push({
        layer,
        angle,
        baseRadius,
        speed,
        size,
        binIndex,
        radiusAmp,
        hue,
      });
    }
  }
}

function drawParticles(ctx, canvas, dataArray, theme) {
  if (!dataArray) return;

  const state = VisualsState;

  if (state.particles.length === 0) {
    initParticlesInternal(canvas, dataArray, theme);
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const TAU = Math.PI * 2;

  const particleSat =
    theme && typeof theme.particleSaturation === "number"
      ? theme.particleSaturation
      : 90;
  const baseLight = 80;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];

    const idx = Math.min(p.binIndex, dataArray.length - 1);
    const v = dataArray[idx] / 255;

    let energy = Math.pow(v, 1.1) * 1.4;
    if (energy > 1) energy = 1;

    p.angle += p.speed * (0.7 + energy * 4.0);

    const radius = p.baseRadius + energy * p.radiusAmp;

    const x = centerX + Math.cos(p.angle) * radius;
    const y = centerY + Math.sin(p.angle) * radius;

    const size = p.size * (0.9 + energy * 1.8);

    let alpha = 0.22 + energy * 0.95;
    if (alpha > 1) alpha = 1;

    ctx.shadowBlur = 20 + 40 * energy;
    const light = baseLight - 10 + energy * 5;
    ctx.shadowColor = `hsla(${p.hue}, ${particleSat}%, ${light}%, ${alpha})`;
    ctx.fillStyle   = `hsla(${p.hue}, ${particleSat}%, ${light}%, ${alpha})`;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawMirror(ctx, canvas, dataArray, theme) {
  if (!dataArray) return;

  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  const barWidth = (canvas.width / dataArray.length) * 4;
  const centerY = canvas.height / 2;
  let x = 0;

  for (let i = start; i < end; i++) {
    const h = Math.pow(dataArray[i] / 255, 1.7) * 255;

    const colorFn = theme && theme.mirrorColor;
    ctx.fillStyle = colorFn ? colorFn(h) : `rgb(150,${h + 50},255)`;

    ctx.fillRect(x, centerY - h / 2, barWidth, h / 2);
    ctx.fillRect(x, centerY, barWidth, h / 2);
    x += barWidth + 1;
  }
}

function drawBurst(ctx, canvas, dataArray, theme) {
  if (!dataArray) return;

  const state = VisualsState;
  const w = canvas.width;
  const h = canvas.height;

  const rays = state.rays || (state.rays = []);

  const maxRays       = 80;                   
  const maxSpawnPerFrame = 8;                 
  const minEnergy     = 0.12;
  const maxRayLength  = Math.max(w, h) * 0.55;
  const baseLifeSpeed = 0.02;
  const extraLifeSpeed= 0.06;

  const len = dataArray.length;
  const startBin = 5;
  const endBin   = Math.floor(len * 0.7);
  const binCount = endBin - startBin;
  if (binCount <= 0) return;

  let sum = 0;
  for (let i = startBin; i < endBin; i++) {
    sum += dataArray[i];
  }
  const avg = sum / binCount / 255;          
  const overallEnergy = Math.min(1, Math.pow(avg, 1.2));

  const baseHues = (theme && theme.particleHueBase) || [220, 260, 180];

  const spawnCount = Math.min(
    maxSpawnPerFrame,
    Math.floor(overallEnergy * maxSpawnPerFrame * 1.5)
  );

  for (let s = 0; s < spawnCount && rays.length < maxRays; s++) {
    const frac = Math.random();
    const binIndex = startBin + Math.floor(frac * binCount);
    const raw = dataArray[binIndex] / 255;
    const energy = Math.pow(raw, 1.3);

    if (energy < minEnergy) continue;

    const side = Math.floor(Math.random() * 4);
    let x, y, baseAngle;
    switch (side) {
      case 0: 
        x = Math.random() * w;
        y = 0;
        baseAngle = Math.PI / 2;
        break;
      case 1: 
        x = w;
        y = Math.random() * h;
        baseAngle = Math.PI;
        break;
      case 2: 
        x = Math.random() * w;
        y = h;
        baseAngle = -Math.PI / 2;
        break;
      default: 
        x = 0;
        y = Math.random() * h;
        baseAngle = 0;
        break;
    }

    const jitter = (Math.random() - 0.5) * 0.45;
    const angle  = baseAngle + jitter;

    const hueBase = baseHues[side % baseHues.length] || 220;
    const hue     = hueBase + (binIndex / len) * 30;

    rays.push({
      x,
      y,
      angle,
      energy,
      life: 0,
      lifeSpeed: baseLifeSpeed + extraLifeSpeed * energy,
      hue,
    });
  }

  ctx.save();

  ctx.lineCap = "round";

  for (let i = rays.length - 1; i >= 0; i--) {
    const r = rays[i];
    r.life += r.lifeSpeed;

    if (r.life >= 1) {
      rays.splice(i, 1);
      continue;
    }

    const life   = r.life;
    const energy = r.energy;

    const length = (0.25 + energy * 0.75) * maxRayLength * life;

    const x2 = r.x + Math.cos(r.angle) * length;
    const y2 = r.y + Math.sin(r.angle) * length;

    const alpha = (1 - life) * (0.35 + energy * 0.6);

    const col = `hsla(${r.hue}, 90%, 60%, ${alpha})`;

    ctx.shadowBlur  = 6 + 18 * energy;
    ctx.shadowColor = col;
    ctx.strokeStyle = col;
    ctx.lineWidth   = 1.1 + 2.4 * energy;

    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();

  state.wavePhase += 0.01;
}