const fileInput = document.getElementById('file');
const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let audioContext, analyser, source, dataArray;
let mode = "bars";
let wavePhase = 0;


function setMode(m) {
    mode = m;
}

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    audio.src = URL.createObjectURL(file);
    audio.load()
    audio.play()

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.85;
    analyser.fftSize = 512;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    animate();
});

function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if ( mode === "bars" ) drawBars();
    if ( mode === "circle" ) drawCircle();
    if ( mode === "wave" ) drawWave();
    if ( mode === "particles" ) drawParticles();
    if ( mode === "mirror" ) drawMirror();
}

function drawBars() {
    const start = 5;
    const end = dataArray.length * 0.6;

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
function getSmoothedValue(i, start, end, dataArray) {
    let sum = 0;
    let count = 0;
    const len = end - start;

    for (let j = -3; j <= 3; j++) {
        let index = i + j;

        if (index < start) index = end - (start - index);
        if (index >= end) index = start + (index - end);

        sum += dataArray[index];
        count++;
    }

    return sum / count;
}
function drawCircle() {
    const start = 5;
    const end = Math.floor(dataArray.length * 0.6);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const baseRadius = 140;
    const maxBarLength = 180;

    const visibleBins = end - start;

    const smoothed = new Array(visibleBins);
    for (let i = 0; i < visibleBins; i++) {
        let sum = 0;
        for (let j = -3; j <= 3; j++) {
            let idx = i + j;
            if (idx < 0) idx += visibleBins;
            if (idx >= visibleBins) idx -= visibleBins;
            sum += dataArray[start + idx];
        }
        smoothed[i] = sum / 7;
    }

    const blendCount = 8;
    for (let i = 0; i < blendCount; i++) {
        const t = i / blendCount;
        const a = smoothed[i];
        const b = smoothed[smoothed.length - blendCount + i];
        smoothed[i] = a * (1 - t) + b * t;
        smoothed[smoothed.length - blendCount + i] = b * (1 - t) + a * t;
    }

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.shadowBlur = 15;
    ctx.shadowColor = "white";

    const half = Math.floor(visibleBins / 2);

    for (let i = 0; i < visibleBins; i++) {

        const mirrorIndex = i < half ? i : visibleBins - i - 1;

        const t = i / visibleBins;
        const angle = t * Math.PI * 2;

        const raw = smoothed[mirrorIndex] / 255;

        const compressed = Math.exp(raw, 0.8);

        const minLevel = 0.35;
        const maxLevel = 0.7;
        const ranged = minLevel + compressed * (maxLevel - minLevel);

        const wave = Math.sin((i / visibleBins) * Math.PI * 6 + wavePhase) * 18;
        const barLength = ranged * maxBarLength + wave;

        const x1 = Math.cos(angle) * baseRadius;
        const y1 = Math.sin(angle) * baseRadius;
        const x2 = Math.cos(angle) * (baseRadius + barLength);
        const y2 = Math.sin(angle) * (baseRadius + barLength);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    wavePhase += 0.02
    ctx.restore();
}



function drawWave() {
    const start = 5;
    const end = dataArray.length * 0.6;

    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4cc3ff';
    ctx.beginPath();

    const visibleBins = end - start;
    const slice = canvas.width / visibleBins;
    let x = 0;

    for (let i = start; i < end; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height / 2);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += slice;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function drawParticles() {
    const start = 5;
    const end = dataArray.length * 0.6;

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
    const end = dataArray.length * 0.6;

    const barWidth = canvas.width / dataArray.length * 4;
    const centerY = canvas.height / 2;
    let x = 0;

    for (let i = start; i < end; i++) {
        const h = Math.pow(dataArray[i] / 255, 1.7) * 255;

        ctx.fillStyle = `rgb(150,${h + 50},255)`;
        ctx.fillRect(x, centerY - h/2, barWidth, h/2);
        ctx.fillRect(x, centerY, barWidth, h/2);
        x += barWidth + 1;
    }
}


window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
});
