// audio.js

window.AudioModule = (function () {
  let audioContext = null;
  let analyser = null;
  let dataArray = null;

  let sourceNode = null;
  let micSourceNode = null;
  let micStream = null;
  let usingMic = false;

  function getAnalyser() {
    return analyser;
  }

  function getDataArray() {
    return dataArray;
  }

  function isUsingMic() {
    return usingMic;
  }

  function init() {
    const fileInput   = document.getElementById("file");
    const fileButton  = document.getElementById("file-button");
    const dropZone    = document.getElementById("dropzone");
    const micToggle   = document.getElementById("mic-toggle");
    const audioEl     = document.getElementById("audio");
    const fileNameEl  = document.getElementById("file-name");

    const playPauseBtn  = document.getElementById("play-pause");
    const seekSlider    = document.getElementById("seek");
    const currentTimeEl = document.getElementById("current-time");
    const durationEl    = document.getElementById("duration");
    const volumeSlider  = document.getElementById("volume");

    function updateFileName(name) {
      if (!fileNameEl) return;
      if (!name) fileNameEl.textContent = "No file loaded";
      else fileNameEl.textContent = name;
    }

    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) return "0:00";
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60)
        .toString()
        .padStart(2, "0");
      return `${m}:${s}`;
    }

    async function ensureAnalyser() {
      if (!audioContext) {
        audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.85;
        analyser.fftSize = 512;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      await audioContext.resume();
    }

    async function handleFile(file) {
      if (!file) return;

      const isAudioByType = file.type && file.type.startsWith("audio/");
      const isAudioByName = /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(
        file.name
      );

      if (!isAudioByType && !isAudioByName) {
        alert("Please select an audio file (mp3, wav, m4a, etc.)");
        updateFileName(null);
        if (playPauseBtn) playPauseBtn.disabled = true;
        if (seekSlider) {
          seekSlider.disabled = true;
          seekSlider.value = 0;
        }
        if (currentTimeEl) currentTimeEl.textContent = "0:00";
        if (durationEl) durationEl.textContent = "0:00";
        return;
      }

      // if mic is active, stop it
      if (usingMic) {
        await stopMicInternal();
      }

      await ensureAnalyser();

      if (!sourceNode) {
        sourceNode = audioContext.createMediaElementSource(audioEl);
      }

      try {
        sourceNode.disconnect();
      } catch (e) {}

      try {
        analyser.disconnect();
      } catch (e) {}

      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      updateFileName(file.name);

      audioEl.src = URL.createObjectURL(file);
      audioEl.load();

      // enable controls
      if (playPauseBtn) {
        playPauseBtn.disabled = false;
        playPauseBtn.textContent = "Pause";
      }
      if (seekSlider) {
        seekSlider.disabled = false;
        seekSlider.value = 0;
      }
      if (currentTimeEl) currentTimeEl.textContent = "0:00";
      if (durationEl) durationEl.textContent = "0:00";

      try {
        await audioEl.play();
      } catch (err) {
        console.error("Audio play error:", err);
        if (playPauseBtn) playPauseBtn.textContent = "Play";
      }
    }

    async function startMicInternal() {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        alert("Microphone is not supported in this browser.");
        return;
      }

      await ensureAnalyser();

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (err) {
        console.error("Mic access error:", err);
        alert("Microphone permission denied.");
        return;
      }

      // stop any file playback
      audioEl.pause();
      audioEl.currentTime = 0;

      if (sourceNode) {
        try {
          sourceNode.disconnect();
        } catch (e) {}
      }
      if (micSourceNode) {
        try {
          micSourceNode.disconnect();
        } catch (e) {}
      }
      if (analyser) {
        try {
          analyser.disconnect();
        } catch (e) {}
      }

      micStream = stream;
      micSourceNode = audioContext.createMediaStreamSource(micStream);
      micSourceNode.connect(analyser); // no connection to destination -> no feedback

      usingMic = true;
      if (micToggle) micToggle.textContent = "Stop Microphone";
      updateFileName("Microphone (live input)");

      // disable playback controls while mic is live
      if (playPauseBtn) {
        playPauseBtn.disabled = true;
        playPauseBtn.textContent = "Play";
      }
      if (seekSlider) {
        seekSlider.disabled = true;
        seekSlider.value = 0;
      }
      if (currentTimeEl) currentTimeEl.textContent = "0:00";
      if (durationEl) durationEl.textContent = "0:00";
    }

    async function stopMicInternal() {
      if (!usingMic) return;

      if (micSourceNode) {
        try {
          micSourceNode.disconnect();
        } catch (e) {}
        micSourceNode = null;
      }

      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }

      if (analyser) {
        try {
          analyser.disconnect();
        } catch (e) {}
      }

      if (sourceNode && analyser && audioContext) {
        try {
          sourceNode.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (e) {}
      }

      usingMic = false;
      if (micToggle) micToggle.textContent = "Use Microphone";

      // note: we don't automatically enable play until a file is loaded
      // (handleFile will handle that)
    }

    // ---------- UI wiring ----------

    // File input
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
      });
    }

    // Custom "Choose Audio" button
    if (fileButton) {
      fileButton.addEventListener("click", () => {
        if (fileInput) fileInput.click();
      });
    }

    // Drag & drop
    if (dropZone) {
      ["dragenter", "dragover"].forEach((ev) => {
        dropZone.addEventListener(ev, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add("drag-over");
        });
      });

      ["dragleave", "dragend"].forEach((ev) => {
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
          Array.from(files).find((f) =>
            f.type.startsWith("audio/")
          ) || files[0];

        if (file) handleFile(file);
      });
    }

    ["dragover", "drop"].forEach((ev) => {
      window.addEventListener(ev, (e) => e.preventDefault());
    });

    // Mic toggle
    if (micToggle) {
      micToggle.addEventListener("click", async () => {
        if (!usingMic) await startMicInternal();
        else await stopMicInternal();
      });
    }

    // Custom play/pause button
    if (playPauseBtn) {
      playPauseBtn.disabled = true; // until a file is loaded
      playPauseBtn.addEventListener("click", () => {
        if (!audioEl.src) return;
        if (audioEl.paused) {
          audioEl.play().catch((err) =>
            console.error("Play error:", err)
          );
        } else {
          audioEl.pause();
        }
      });
    }

    // Seek slider
    if (seekSlider) {
      seekSlider.disabled = true;
      seekSlider.addEventListener("input", () => {
        if (!audioEl.duration || audioEl.duration === Infinity) return;
        const pct = seekSlider.value / 100;
        audioEl.currentTime = audioEl.duration * pct;
      });
    }

    // Volume slider
    if (volumeSlider) {
      audioEl.volume = parseFloat(volumeSlider.value || "1");
      volumeSlider.addEventListener("input", () => {
        audioEl.volume = parseFloat(volumeSlider.value || "1");
      });
    }

    // Audio element events
    if (audioEl) {
      audioEl.addEventListener("play", async () => {
        if (usingMic) {
          await stopMicInternal();
        }
        if (playPauseBtn) {
          playPauseBtn.textContent = "Pause";
          playPauseBtn.disabled = false;
        }
      });

      audioEl.addEventListener("pause", () => {
        if (playPauseBtn) {
          playPauseBtn.textContent = "Play";
        }
      });

      audioEl.addEventListener("timeupdate", () => {
        if (!seekSlider || !currentTimeEl) return;
        if (!audioEl.duration || audioEl.duration === Infinity) return;

        const pct = (audioEl.currentTime / audioEl.duration) * 100;
        seekSlider.value = pct;
        currentTimeEl.textContent = formatTime(audioEl.currentTime);
      });

      audioEl.addEventListener("durationchange", () => {
        if (!durationEl) return;
        durationEl.textContent = formatTime(audioEl.duration);
      });

      audioEl.addEventListener("ended", () => {
        if (playPauseBtn) playPauseBtn.textContent = "Play";
        if (seekSlider) seekSlider.value = 100;
      });
    }
  }

  return {
    init,
    getAnalyser,
    getDataArray,
    isUsingMic,
  };
})();