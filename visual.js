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

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    audio.src = URL.createObjectURL(file);
    audio.load()
    audio.play()

    audioContext = new AudioContext();
    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
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
}

function drawBars() {
    const barWidth = (canvas.width / dataArray.length) * 2;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const h = dataArray[i];
        ctx.fillStyle = `rgb(${h + 50},80,255)`;
        ctx.fillRect(x, canvas.height - h, barWidth, h);
        x += barWidth + 1;
    }
}

function drawCircle() {
    const radius = 150;
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);

    for (let i = 0; i < dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2;
        const h = dataArray[i];
        const lineLength = h * 0.8;

        ctx.strokeStyle = `rgb(100,${h + 50},255)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
        ctx.lineTo(
            Math.cos(angle) * (radius + lineLength),
            Math.sin(angle) * (radius + lineLength)
        );
        ctx.stroke();
    }
    ctx.restore();
}

function drawWave() {
    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4cc3ff';
    ctx.beginPath();

    const slice = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height / 2);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += slice;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
});
