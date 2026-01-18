const fileInput = document.getElementById('file');
const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let audioContext = null;
let analyser = null;
let sourceNode = null;
let dataArray = null;

let mode = "bars";
let wavePhase = 0;

let bassEnv   = 0;
let highEnv   = 0;
let bandEnv = [0, 0, 0, 0, 0];
let idleBeat = 0; 

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

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  audio.src = URL.createObjectURL(file);
  audio.load();

  await initAudio();
  audio.play();
});

function animate() {
  requestAnimationFrame(animate);

  if (!analyser || !dataArray) return;

  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
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
  const margin = 20;                          // less margin -> larger ring
  const radiusLimit = minSide * 0.5 - margin; // absolute max radius

  const len = dataArray.length;

  // ---- 1) Split spectrum into 5 bands and measure energy ----
  const bandSplits = [0.0, 0.08, 0.18, 0.35, 0.6, 1.0]; // 5 bands
  const bandCount = 5;

  const bandSum = new Array(bandCount).fill(0);
  const bandBins = new Array(bandCount).fill(0);

  let sumAll = 0;

  for (let i = 0; i < len; i++) {
    const v = dataArray[i];
    sumAll += v;
    const norm = i / (len - 1); // 0..1

    let b = 0;
    if (norm < bandSplits[1])      b = 0;
    else if (norm < bandSplits[2]) b = 1;
    else if (norm < bandSplits[3]) b = 2;
    else if (norm < bandSplits[4]) b = 3;
    else                           b = 4;

    bandSum[b] += v;
    bandBins[b]++;
  }

  const avgAll = (sumAll / len) / 255; // overall loudness

  const bandAvgNorm = new Array(bandCount).fill(0);
  for (let b = 0; b < bandCount; b++) {
    bandAvgNorm[b] = bandBins[b]
      ? (bandSum[b] / bandBins[b]) / 255
      : 0;
  }

  // ---- 2) Targets + smoothing (more gain -> more reactive) ----
  // stronger gain for all bands
  const bandGain = [3.4, 3.2, 3.0, 3.2, 3.6];
  const bandPow  = [1.0, 1.0, 1.0, 1.0, 1.0];

  // faster attack, slightly slower release (snappier)
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

  // ---- 3) Idle beat when very quiet ----
  const veryQuiet = avgAll < 0.04 && totalBandEnergy < 0.25;

  if (veryQuiet && idleBeat < 0.05 && Math.random() < 0.03) {
    idleBeat = 1;
  }
  idleBeat *= 0.9;
  const idleBoost = idleBeat;

  // ---- 4) Base radii & amplitudes (bigger outer ring, more movement) ----
  // outer -> inner, as fraction of radiusLimit
  const baseFrac = [0.88, 0.72, 0.57, 0.42, 0.28]; // outer ring larger now
  const ampFrac  = [0.22, 0.18, 0.15, 0.12, 0.10]; // all rings more reactive

  const radii = new Array(bandCount);

  for (let b = 0; b < bandCount; b++) {
    const baseR = radiusLimit * baseFrac[b];
    const amp   = radiusLimit * ampFrac[b];

    let level = bandEnv[b];

    // outermost band (bass) gets idle boost when quiet
    if (b === 0) {
      level = Math.min(1, level + idleBoost * (1 - level));
    }

    const jitter = (Math.random() - 0.5) * 0.05; // small wobble
    level = Math.max(0, Math.min(1, level + jitter));

    radii[b] = baseR + amp * level;

    if (radii[b] > radiusLimit) radii[b] = radiusLimit;
  }

  const TAU = Math.PI * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wavePhase * 0.1);

  // ---- 5) Draw 5 rings (outer -> inner) ----

  // Outer (bass)
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

  // Ring 2
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

  // Ring 3
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

  // Ring 4
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

  // Inner core (highs)
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
  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  analyser.getByteTimeDomainData(dataArray);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4cc3ff';
  ctx.beginPath();

  const visibleBins = end - start;
  const slice = canvas.width / visibleBins;
  let x = 0;

  for (let i = start; i < end; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (canvas.height / 2);

    if (i === start) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    x += slice;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function drawParticles() {
  const start = 5;
  const end = Math.floor(dataArray.length * 0.6);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = start; i < end; i += 2) {
    const value = dataArray[i];
    const angle = ((i - start) / (end - start)) * Math.PI * 2;
    const radius = value * 1.5;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.fillStyle = `rgba(100,200,255,0.8)`;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
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
});
