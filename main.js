// main.js

let canvas, ctx;
let mode = "bars";

let currentThemeName = "neon";
let theme = null;

function setMode(m) {
  mode = m;
  updateActiveModeButton();
}
window.setMode = setMode;

function updateActiveModeButton() {
  const buttons = document.querySelectorAll(".buttons button");
  buttons.forEach((btn) => {
    if (btn.dataset.mode === mode) {
      btn.classList.add("active-mode");
    } else {
      btn.classList.remove("active-mode");
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  const analyser = AudioModule.getAnalyser();
  const dataArray = AudioModule.getDataArray();
  if (!analyser || !dataArray) return;

  analyser.getByteFrequencyData(dataArray);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgb(5, 5, 10)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch (mode) {
    case "bars":
      Visuals.drawBars(ctx, canvas, dataArray, theme);
      break;
    case "circle":
      Visuals.drawCircle(ctx, canvas, dataArray, theme);
      break;
    case "wave":
      Visuals.drawWave(ctx, canvas, dataArray, analyser, theme);
      break;
    case "particles":
      Visuals.drawParticles(ctx, canvas, dataArray, theme);
      break;
    case "mirror":
      Visuals.drawMirror(ctx, canvas, dataArray, theme);
      break;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const themeSelect = document.getElementById("theme-select");
  if (themeSelect && window.Themes) {
    themeSelect.innerHTML = "";
    Object.entries(window.Themes).forEach(([key, t]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = t.label || key;
      themeSelect.appendChild(opt);
    });
    themeSelect.value = currentThemeName;
    themeSelect.addEventListener("change", (e) => {
      currentThemeName = e.target.value;
      theme = getTheme(currentThemeName);
      applyThemeToDocument(theme);
      VisualsState.particles = [];
    });
  }

  theme = getTheme(currentThemeName);
  applyThemeToDocument(theme);

  // init audio handlers
  AudioModule.init();

  // mode button active state
  updateActiveModeButton();

  // resize
  window.addEventListener("resize", () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    Visuals.handleResizeForVisuals();
  });

  animate();
});