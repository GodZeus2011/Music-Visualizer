const fileInput = document.getElementById('file');
const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let audioContext, analyser, source, dataArray;
let mode = "bars";

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
    const end = dataArray.length * 0.6;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 120;
    const visibleBins = end - start;

    // Create a smoothed array to make bars continuous
    const smoothed = [];
    for (let i = start; i < end; i++) {
        let sum = 0;
        let count = 0;
        for (let j = -2; j <= 2; j++) { // smooth over ±2 bins
            let idx = i + j;
            if (idx < start) idx = end - (start - idx);
            if (idx >= end) idx = start + (idx - end);
            sum += dataArray[idx];
            count++;
        }
        smoothed.push(sum / count);
    }

    ctx.save();
    ctx.translate(centerX, centerY);

    const totalBars = smoothed.length;

    for (let i = 0; i < totalBars; i++) {
        const t = i / totalBars;
        const angle = t * Math.PI * 2;

        // Use sine curve to make the start/end less abrupt
        const raw = smoothed[i] / 255;
        const scaled = Math.pow(raw, 1.2); // slightly softer curve
        const barLength = scaled * 200 + 20; // minimum 20px, max scaled

        const x1 = Math.cos(angle) * baseRadius;
        const y1 = Math.sin(angle) * baseRadius;
        const x2 = Math.cos(angle) * (baseRadius + barLength);
        const y2 = Math.sin(angle) * (baseRadius + barLength);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

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

    for (let i = start; i < end; i += 16) {
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
