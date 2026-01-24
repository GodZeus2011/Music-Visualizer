window.Themes = {
  neon: {
    label: "Neon",
    ui: {
      bgStart: "#050514",
      bgEnd: "#000000",
      btnGrad1: "#7f5cff",
      btnGrad2: "#4cc3ff",
    },
    barsColor: (h) => `rgb(${h + 50},80,255)`,
    mirrorColor: (h) => `rgb(150,${h + 50},255)`,
    waveGradient: ["#1d3cff", "#3dd5ff", "#4ff0c8"],
    particleHueBase: [210, 260, 180],
  },
  ocean: {
    label: "Ocean",
    ui: {
      bgStart: "#02121f",
      bgEnd: "#000814",
      btnGrad1: "#2b6cb0",
      btnGrad2: "#38b2ac",
    },
    barsColor: (h) => `hsl(195,80%,${30 + (h / 255) * 45}%)`,
    mirrorColor: (h) => `hsl(185,80%,${25 + (h / 255) * 45}%)`,
    waveGradient: ["#0b7285", "#12b886", "#a5d8ff"],
    particleHueBase: [190, 170, 210],
  },
  sunset: {
    label: "Sunset",
    ui: {
      bgStart: "#22000f",
      bgEnd: "#050008",
      btnGrad1: "#ff6b6b",
      btnGrad2: "#f59e0b",
    },
    barsColor: (h) => `hsl(${20 + (h / 255) * 40},90%,${45 + (h / 255) * 20}%)`,
    mirrorColor: (h) => `hsl(${10 + (h / 255) * 30},90%,${40 + (h / 255) * 20}%)`,
    waveGradient: ["#ff6b6b", "#f97316", "#fde68a"],
    particleHueBase: [20, 40, 350],
  },
  forest: {
    label: "Forest",
    ui: {
      bgStart: "#041b11",
      bgEnd: "#020807",
      btnGrad1: "#16a34a",
      btnGrad2: "#65a30d",
    },
    barsColor: (h) => `hsl(${110 + (h / 255) * 20},70%,${35 + (h / 255) * 25}%)`,
    mirrorColor: (h) => `hsl(${100 + (h / 255) * 10},70%,${30 + (h / 255) * 25}%)`,
    waveGradient: ["#15803d", "#22c55e", "#bef264"],
    particleHueBase: [110, 90, 140],
  },
  mono: {
    label: "Mono",
    ui: {
      bgStart: "#050505",
      bgEnd: "#000000",
      btnGrad1: "#4b5563",
      btnGrad2: "#9ca3af",
    },
    barsColor: (h) => {
      const v = 40 + (h / 255) * 55;
      return `rgb(${v},${v},${v})`;
    },
    mirrorColor: (h) => {
      const v = 30 + (h / 255) * 55;
      return `rgb(${v},${v},${v})`;
    },
    waveGradient: ["#6b7280", "#e5e7eb", "#9ca3af"],
    particleHueBase: [0, 0, 0],
    particleSaturation: 0,
  },
  cyberpunk: {
    label: "Cyberpunk",
    ui: {
      bgStart: "#160024",
      bgEnd:   "#020015",
      btnGrad1: "#ff0080",
      btnGrad2: "#00f0ff",
    },
    barsColor:   (h) => {
      const v = h / 255;
      const hue = 300 + 40 * v;
      return `hsl(${hue}, 90%, ${45 + v * 20}%)`;
    },
    mirrorColor: (h) => {
      const v = h / 255;
      const hue = 190 + 30 * v;
      return `hsl(${hue}, 90%, ${40 + v * 25}%)`;
    },
    waveGradient: ["#ff0080", "#7c3aed", "#00f0ff"],
    particleHueBase: [310, 200, 60],
  },
  pastel: {
    label: "Pastel",
    ui: {
      bgStart: "#140c1c",
      bgEnd:   "#050315",
      btnGrad1: "#f9a8d4",  
      btnGrad2: "#87bdff",  
    },
    barsColor:   (h) => {
      const v = h / 255;
      const hue = 280 + 40 * v;
      return `hsl(${hue}, 55%, ${70 + v * 10}%)`;
    },
    mirrorColor: (h) => {
      const v = h / 255;
      const hue = 210 + 40 * v;
      return `hsl(${hue}, 50%, ${68 + v * 10}%)`;
    },
    waveGradient: ["#f9a8d4", "#c4b5fd", "#87bdff"],
    particleHueBase: [320, 260, 210],
    particleSaturation: 60,
  },
  gold: {
    label: "Gold",
    ui: {
      bgStart: "#120805",
      bgEnd:   "#030202",
      btnGrad1: "#facc15",
      btnGrad2: "#f97316",
    },
    barsColor:   (h) => {
      const v = h / 255;
      const hue = 40 + 10 * v;
      return `hsl(${hue}, 90%, ${40 + v * 20}%)`; 
    },
    mirrorColor: (h) => {
      const v = h / 255;
      const hue = 30 + 5 * v;
      return `hsl(${hue}, 85%, ${35 + v * 20}%)`;
    },
    waveGradient: ["#facc15", "#f97316", "#ef4444"],
    particleHueBase: [40, 30, 10],
  },
  retrowave: {
    label: "RetroWave",
    ui: {
      bgStart: "#0b1120",
      bgEnd:   "#020617",
      btnGrad1: "#0abfdb", 
      btnGrad2: "#9800ca",  
    },
    barsColor:   (h) => {
      const v = h / 255;
      const hue = 180 + 120 * v; 
      return `hsl(${hue}, 85%, ${50 + v * 15}%)`;
    },
    mirrorColor: (h) => {
      const v = h / 255;
      const hue = 260 - 60 * v;
      return `hsl(${hue}, 85%, ${45 + v * 15}%)`;
    },
    waveGradient: ["#0abfdb", "#a855f7", "#9800ca"],
    particleHueBase: [190, 270, 320],
  },
  icefire: {
    label: "IceFire",
    ui: {
      bgStart: "#020617",
      bgEnd:   "#0b0a0f",
      btnGrad1: "#38bdf8",  
      btnGrad2: "#ee5c0d",  
    },
    barsColor:   (h) => {
      const v = h / 255;
      const hue = 200 - 40 * v; 
      return `hsl(${hue}, 85%, ${45 + v * 15}%)`;
    },
    mirrorColor: (h) => {
      const v = h / 255;
      const hue = 20 + 20 * v; 
      return `hsl(${hue}, 85%, ${40 + v * 15}%)`;
    },
    waveGradient: ["#38bdf8", "#3b82f6", "#ee5c0d"],
    particleHueBase: [200, 210, 25],
  },
};

window.getTheme = function (name) {
  return window.Themes[name] || window.Themes.neon;
};

window.applyThemeToDocument = function (theme) {
  const root = document.documentElement;
  root.style.setProperty("--bg-start", theme.ui.bgStart);
  root.style.setProperty("--bg-end", theme.ui.bgEnd);
  root.style.setProperty("--btn-grad1", theme.ui.btnGrad1);
  root.style.setProperty("--btn-grad2", theme.ui.btnGrad2);
};

/*
===============================================================================
 HOW TO ADD A NEW THEME
===============================================================================

1) Open this file (themes.js).

2) Inside window.Themes, copy this template and change the key + colors:

  myCoolTheme: {
    label: "My Cool Theme",   // text that shows in the dropdown

    ui: {                     // background + button gradient
      bgStart: "#000000",
      bgEnd:   "#000000",
      btnGrad1: "#ff0000",
      btnGrad2: "#ffff00",
    },

    // Color for Bars mode
    // h is 0..255 – you can use it to brighten/darken with audio level
    barsColor: (h) => `rgb(${100 + h / 2}, 50, 200)`,

    // Color for Mirror mode
    mirrorColor: (h) => `rgb(150, ${80 + h / 2}, 255)`,

    // 3 colors used by Wave + Circle [outer, middle, inner]
    waveGradient: ["#ff0000", "#ff8800", "#ffff00"],

    // Base hue for particles [outer ring, middle, inner] in HSL
    particleHueBase: [0, 40, 60],

    // OPTIONAL: 0–100 saturation for particles
    //   omit or set to 90 for colorful
    //   set to 0 for grayscale
    // particleSaturation: 90,
  },

3) Save. That’s it.
*/