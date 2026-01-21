const fileInput = document.getElementById('file');
const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const dropZone = document.getElementById('dropzone');
const micToggle = document.getElementById('mic-toggle');

canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let audioContext = null;
let analyser = null;
let sourceNode = null;      
let micSourceNode = null;   
let micStream = null;
let usingMic = false;

let mode = "bars";
let wavePhase = 0;

let bandEnv = [0, 0, 0, 0, 0];
let idleBeat = 0;

let waveEnergy = 0;

const PARTICLE_COUNT = 720;
const PARTICLE_LAYERS = 3;
let particles = [];


function setMode(m) {
  mode = m;
}

async function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.85;
    analyser.fftSize = 512;

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    await audioContext.resume();
    animate();
  } else {
    await audioContext.resume();
  }
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('audio/')) return;

  if (usingMic) {
    await stopMic();
  }

  await initAudio();

  audio.src = URL.createObjectURL(file);
  audio.load();

  try {
    await audio.play();
  } catch (err) {
    console.error("Audio play error:", err);
  }
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

if (dropZone) {
  ["dragenter", "dragover"].forEach(ev => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "dragend"].forEach(ev => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (!files || !files.length) return;

    const file =
      Array.from(files).find(f => f.type.startsWith("audio/")) || files[0];

    if (file) handleFile(file);
  });
}

["dragover", "drop"].forEach(ev => {
  window.addEventListener(ev, (e) => e.preventDefault());
});


if (micToggle) {
  micToggle.addEventListener("click", async () => {
    if (!usingMic) {
      await startMic();
    } else {
      await stopMic();
    }
  });
}

async function startMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Microphone is not supported in this browser.");
    return;
  }

  await initAudio();

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
  } catch (err) {
    console.error("Mic access error:", err);
    alert("Microphone permission denied.");
    return;
  }

  audio.pause();
  audio.currentTime = 0;

  if (sourceNode) {
    try { sourceNode.disconnect(); } catch (e) {}
  }

  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch (e) {}
  }

  micSourceNode = audioContext.createMediaStreamSource(micStream);

  if (analyser) {
    try { analyser.disconnect(); } catch (e) {}
  }

  micSourceNode.connect(analyser);

  usingMic = true;
  if (micToggle) micToggle.textContent = "Stop Microphone";
}

async function stopMic() {
  if (!usingMic) return;

  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch (e) {}
    micSourceNode = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }

  if (analyser) {
    try { analyser.disconnect(); } catch (e) {}
  }

  if (sourceNode && analyser && audioContext) {
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  usingMic = false;
  if (micToggle) micToggle.textContent = "Use Microphone";
}

function animate() {
  requestAnimationFrame(animate);

  if (!analyser || !dataArray) return;

  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = "rgb(5, 5, 10)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch (mode) {
    case "bars":      drawBars();      break;
    case "circle":    drawCircle();    break;
    case "wave":      drawWave();      break;
    case "particles": drawParticles(); break;
    case "mirror":    drawMirror();    break;
  }
}

function drawBars() {
  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  const visibleBins = end - start;
  const barWidth = canvas.width / visibleBins;

  let x = 0;
  for (let i = start; i < end; i++) {
    const h = Math.pow(dataArray[i] / 255, 1.7) * 255;
    ctx.fillStyle = `rgb(${h + 50},80,255)`;
    ctx.fillRect(x, canvas.height - h, barWidth, h);
    x += barWidth + 1;
  }
}

function drawCircle() {
  if (!dataArray) return;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const minSide = Math.min(w, h);
  const margin = 20;
  const radiusLimit = minSide * 0.5 - margin;

  const len = dataArray.length;

  const bandSplits = [0.0, 0.08, 0.18, 0.35, 0.6, 1.0];
  const bandCount = 5;

  const bandSum = new Array(bandCount).fill(0);
  const bandBins = new Array(bandCount).fill(0);

  let sumAll = 0;

  for (let i = 0; i < len; i++) {
    const v = dataArray[i];
    sumAll += v;
    const norm = i / (len - 1);

    let b = 0;
    if (norm < bandSplits[1])      b = 0;
    else if (norm < bandSplits[2]) b = 1;
    else if (norm < bandSplits[3]) b = 2;
    else if (norm < bandSplits[4]) b = 3;
    else                           b = 4;

    bandSum[b] += v;
    bandBins[b]++;
  }

  const avgAll = (sumAll / len) / 255;

  const bandAvgNorm = new Array(bandCount).fill(0);
  for (let b = 0; b < bandCount; b++) {
    bandAvgNorm[b] = bandBins[b]
      ? (bandSum[b] / bandBins[b]) / 255
      : 0;
  }

  const bandGain = [3.4, 3.2, 3.0, 3.2, 3.6];
  const bandPow  = [1.0, 1.0, 1.0, 1.0, 1.0];

  const attack  = [0.9, 0.85, 0.8, 0.8, 0.85];
  const release = [0.2, 0.22, 0.24, 0.26, 0.28];

  function smoothEnv(current, target, a, r) {
    return current + (target - current) * (target > current ? a : r);
  }

  let totalBandEnergy = 0;

  for (let b = 0; b < bandCount; b++) {
    let t = Math.pow(bandAvgNorm[b], bandPow[b]) * bandGain[b];
    if (t > 1) t = 1;
    bandEnv[b] = smoothEnv(bandEnv[b], t, attack[b], release[b]);
    totalBandEnergy += bandEnv[b];
  }

  const veryQuiet = avgAll < 0.04 && totalBandEnergy < 0.25;

  if (veryQuiet && idleBeat < 0.05 && Math.random() < 0.03) {
    idleBeat = 1;
  }
  idleBeat *= 0.9;
  const idleBoost = idleBeat;

  const baseFrac = [0.88, 0.72, 0.57, 0.42, 0.28];
  const ampFrac  = [0.22, 0.18, 0.15, 0.12, 0.10];

  const radii = new Array(bandCount);

  for (let b = 0; b < bandCount; b++) {
    const baseR = radiusLimit * baseFrac[b];
    const amp   = radiusLimit * ampFrac[b];

    let level = bandEnv[b];

    if (b === 0) {
      level = Math.min(1, level + idleBoost * (1 - level));
    }

    const jitter = (Math.random() - 0.5) * 0.05;
    level = Math.max(0, Math.min(1, level + jitter));

    radii[b] = baseR + amp * level;

    if (radii[b] > radiusLimit) radii[b] = radiusLimit;
  }

  const TAU = Math.PI * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wavePhase * 0.1);

  {
    const r = radii[0];
    ctx.beginPath();
    ctx.lineWidth = 4 + 7 * (bandEnv[0] + idleBoost);
    ctx.shadowBlur = 28 + 32 * (bandEnv[0] + idleBoost);
    ctx.shadowColor = "rgba(255, 90, 180, 0.95)";

    const grad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.05);
    grad.addColorStop(0.0, "rgba(255, 80, 160, 0.25)");
    grad.addColorStop(0.5, "rgba(255, 80, 160, 0.95)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.95)");
    ctx.strokeStyle = grad;

    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }

  {
    const r = radii[1];
    ctx.beginPath();
    ctx.lineWidth = 3 + 5 * bandEnv[1];
    ctx.shadowBlur = 20 + 22 * bandEnv[1];
    ctx.shadowColor = "rgba(120, 190, 255, 0.9)";
    ctx.strokeStyle = "rgba(150, 210, 255, 0.95)";
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }

  {
    const r = radii[2];
    ctx.beginPath();
    ctx.lineWidth = 3 + 4 * bandEnv[2];
    ctx.shadowBlur = 18 + 20 * bandEnv[2];
    ctx.shadowColor = "rgba(120, 255, 220, 0.9)";
    ctx.strokeStyle = "rgba(160, 255, 230, 0.95)";
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }

  {
    const r = radii[3];
    ctx.beginPath();
    ctx.lineWidth = 2.5 + 3.5 * bandEnv[3];
    ctx.shadowBlur = 15 + 18 * bandEnv[3];
    ctx.shadowColor = "rgba(190, 255, 180, 0.85)";
    ctx.strokeStyle = "rgba(200, 255, 190, 0.95)";
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }

  {
    const r = radii[4];
    ctx.beginPath();
    ctx.shadowBlur = 22 + 26 * bandEnv[4];
    ctx.shadowColor = "rgba(140, 230, 255, 0.98)";

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0.0, "rgba(255,255,255,0.98)");
    grad.addColorStop(0.4, "rgba(160,215,255,0.95)");
    grad.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;

    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    ctx.lineWidth = 2.2 + 3.5 * bandEnv[4];
    ctx.strokeStyle = "rgba(190, 245, 255, 0.98)";
    ctx.stroke();
  }

  ctx.restore();
  wavePhase += 0.02;
}

function drawWave() {
  if (!dataArray || !analyser) return;

  const width  = canvas.width;
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
  waveEnergy += (target - waveEnergy) * (target > waveEnergy ? attack : release);

  const baseAmp   = height * 0.06;
  const extraAmp  = height * 0.16 * waveEnergy;
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
  ctx.shadowColor = "rgba(80, 200, 255, 0.9)";

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0.0, "#1d3cff");
  grad.addColorStop(0.5, "#3dd5ff");
  grad.addColorStop(1.0, "#4ff0c8");
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

function initParticles() {
  particles = [];

  const w = canvas.width;
  const h = canvas.height;
  const minSide = Math.min(w, h);
  const TAU = Math.PI * 2;

  const radiusBands = [
    { min: minSide * 0.30, max: minSide * 0.46 },
    { min: minSide * 0.20, max: minSide * 0.34 },
    { min: minSide * 0.12, max: minSide * 0.24 }
  ];

  const freqBands = [
    { start: 0.00, end: 0.30 },
    { start: 0.25, end: 0.65 },
    { start: 0.60, end: 0.95 }
  ];

  const hueBase = [210, 260, 180];

  const perLayer = Math.floor(PARTICLE_COUNT / PARTICLE_LAYERS);

  for (let layer = 0; layer < PARTICLE_LAYERS; layer++) {
    const rBand = radiusBands[layer];
    const fBand = freqBands[layer];

    for (let i = 0; i < perLayer; i++) {
      const angle = Math.random() * TAU;

      const baseRadius =
        rBand.min + (rBand.max - rBand.min) * Math.random();

      const speedMag = 0.0012 + Math.random() * 0.0018;
      const direction = (layer === 1) ? -1 : 1;
      const speed = speedMag * direction;

      const size = 2.2 + Math.random() * 0.6;
      const norm = fBand.start + (fBand.end - fBand.start) * Math.random();
      const binIndex = Math.floor(norm * (dataArray.length - 1));

      const radiusAmp =
        (layer === 0 ? minSide * 0.18 :
         layer === 1 ? minSide * 0.14 :
                       minSide * 0.10);

      const hueJitter = (Math.random() - 0.5) * 20;
      const hue = hueBase[layer] + hueJitter;

      particles.push({
        layer,
        angle,
        baseRadius,
        speed,
        size,
        binIndex,
        radiusAmp,
        hue
      });
    }
  }
}

function drawParticles() {
  if (!dataArray) return;

  if (particles.length === 0) {
    initParticles();
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const TAU = Math.PI * 2;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

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
    ctx.shadowColor = `hsla(${p.hue}, 95%, 70%, ${alpha})`;
    ctx.fillStyle   = `hsla(${p.hue}, 90%, 70%, ${alpha})`;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawMirror() {
  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  const barWidth = (canvas.width / dataArray.length) * 4;
  const centerY = canvas.height / 2;
  let x = 0;

  for (let i = start; i < end; i++) {
    const h = Math.pow(dataArray[i] / 255, 1.7) * 255;

    ctx.fillStyle = `rgb(150,${h + 50},255)`;
    ctx.fillRect(x, centerY - h / 2, barWidth, h / 2);
    ctx.fillRect(x, centerY, barWidth, h / 2);
    x += barWidth + 1;
  }
}

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  particles = []; 
});