// themes.js

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

  test: {
    label: "Test",   

    ui: {                     
      bgStart: "#000000",
      bgEnd:   "#000000",
      btnGrad1: "#ff0048",
      btnGrad2: "#00b3ff",
    },

    barsColor: (h) => `rgb(0, ${80 + h / 2}, 255)`,

    mirrorColor: (h) => `rgb(255, 0, ${80 + h / 2})`,

    waveGradient: ["#ff0048", "#805aa4", "#00b3ff"],

    particleHueBase: [343, 271, 198],
    particleSaturation: 100,
  },

  test2: {
    label: "Test2",   

    ui: {                     
      bgStart: "#000000",
      bgEnd:   "#000000",
      btnGrad1: "#ffb300",
      btnGrad2: "#008cff",
    },

    barsColor: (h) => `rgb(255, ${80 + h / 2}, 0)`,

    mirrorColor: (h) => `rgb(0,${80 + h / 2}, 255)`,

    waveGradient: ["#ffb300", "#6abd6a", "#008cff"],

    particleHueBase: [42, 120, 207],
    particleSaturation: 100,
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

- main.js automatically fills the <select id="theme-select"> with all
  entries in window.Themes (using .label).
- drawBars, drawMirror, drawWave, drawCircle, and drawParticles already
  use the current theme object; no other code changes needed.
*/