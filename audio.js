// audio.js

window.AudioModule = (function () {
  let audioContext = null;
  let analyser = null;
  let dataArray = null;

  let sourceNode = null;
  let micSourceNode = null;
  let micStream = null;
  let usingMic = false;

  const PLAY_ICON  = "▶";
  const PAUSE_ICON = "❚❚";

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

    const artworkEl     = document.getElementById("artwork");
    let currentArtworkUrl = null;

    const skipBackBtn   = document.getElementById("skip-back");
    const skipForwardBtn= document.getElementById("skip-forward");

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

    function setDefaultArtwork() {
      if (!artworkEl) return;
      if (currentArtworkUrl) {
        URL.revokeObjectURL(currentArtworkUrl);
        currentArtworkUrl = null;
      }
      artworkEl.style.backgroundImage = "";
      artworkEl.classList.remove("has-image");
    }

    function setArtworkFromFile(file) {
      if (!artworkEl) return;

      if (!window.jsmediatags || !window.jsmediatags.read) {
        console.warn("jsmediatags not available; using default artwork.");
        setDefaultArtwork();
      return;
    }

  window.jsmediatags.read(file, {
    onSuccess: ({ tags }) => {
      const pic = tags.picture;
      if (!pic || !pic.data || !pic.data.length) {
        setDefaultArtwork();
        return;
      }

      const byteArray = new Uint8Array(pic.data);
      const blob = new Blob([byteArray], {
        type: pic.format || "image/jpeg",
      });

      if (currentArtworkUrl) {
        URL.revokeObjectURL(currentArtworkUrl);
      }
      currentArtworkUrl = URL.createObjectURL(blob);

      artworkEl.style.backgroundImage = `url(${currentArtworkUrl})`;
      artworkEl.classList.add("has-image");
    },
    onError: (error) => {
      console.warn("Album art read error:", error);
      setDefaultArtwork();
    },
  });
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
        setDefaultArtwork();
        if (playPauseBtn) {
          playPauseBtn.disabled = true;
          playPauseBtn.textContent = PLAY_ICON;
        }
        if (seekSlider) {
          seekSlider.disabled = true;
          seekSlider.value = 0;
        }
        if (currentTimeEl) currentTimeEl.textContent = "0:00";
        if (durationEl) durationEl.textContent = "0:00";
        return;
      }

      if (usingMic) {
        await stopMicInternal();
      }

      await ensureAnalyser();

      if (!sourceNode) {
        sourceNode = audioContext.createMediaElementSource(audioEl);
      }

      try { sourceNode.disconnect(); } catch (e) {}
      try { analyser.disconnect(); } catch (e) {}

      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      updateFileName(file.name);
      setArtworkFromFile(file);

      hasTrackLoaded = true;
      lastTrackName = file.name;    

      audioEl.src = URL.createObjectURL(file);
      audioEl.load();
      if (playPauseBtn) {
        playPauseBtn.disabled = false;
        playPauseBtn.textContent = PAUSE_ICON;
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
        if (playPauseBtn) playPauseBtn.textContent = PLAY_ICON;
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

      audioEl.pause();
      audioEl.currentTime = 0;

      if (sourceNode) {
        try { sourceNode.disconnect(); } catch (e) {}
      }
      if (micSourceNode) {
        try { micSourceNode.disconnect(); } catch (e) {}
      }
      if (analyser) {
        try { analyser.disconnect(); } catch (e) {}
      }

      micStream = stream;
      micSourceNode = audioContext.createMediaStreamSource(micStream);
      micSourceNode.connect(analyser);

      usingMic = true;
      if (micToggle) micToggle.textContent = "Stop";
      updateFileName("Microphone (live input)");

      if (playPauseBtn) {
        playPauseBtn.disabled = true;
        playPauseBtn.textContent = PLAY_ICON;
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
        try { micSourceNode.disconnect(); } catch (e) {}
        micSourceNode = null;
      }

      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }

      if (analyser) {
        try { analyser.disconnect(); } catch (e) {}
      }

      if (sourceNode && analyser && audioContext) {
        try {
          sourceNode.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (e) {}
      }

      usingMic = false;
      if (micToggle) micToggle.textContent = "MIC";

      if (hasTrackLoaded) {
        updateFileName(lastTrackName || "Loaded track");
      if (playPauseBtn) {
        playPauseBtn.disabled = false;
        playPauseBtn.textContent = PLAY_ICON; 
      }
      if (seekSlider) {
        seekSlider.disabled = false;
        seekSlider.value = 0; 
      }
      if (currentTimeEl) currentTimeEl.textContent = "0:00";
}
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
      });
    }

    if (fileButton) {
      fileButton.addEventListener("click", () => {
        if (fileInput) fileInput.click();
      });
    }

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

    if (micToggle) {
      micToggle.addEventListener("click", async () => {
        if (!usingMic) await startMicInternal();
        else await stopMicInternal();
      });
    }

    if (playPauseBtn) {
      playPauseBtn.disabled = true;
      playPauseBtn.textContent = PLAY_ICON;
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

    if (seekSlider) {
      seekSlider.disabled = true;
      seekSlider.addEventListener("input", () => {
        if (!audioEl.duration || audioEl.duration === Infinity) return;
        const pct = seekSlider.value / 100;
        audioEl.currentTime = audioEl.duration * pct;
      });
    }

    if (volumeSlider) {
      audioEl.volume = parseFloat(volumeSlider.value || "1");
      volumeSlider.addEventListener("input", () => {
        audioEl.volume = parseFloat(volumeSlider.value || "1");
      });
    }

     if (skipBackBtn) {
      skipBackBtn.addEventListener("click", () => {
        if (usingMic) return;
        if (!audioEl || !audioEl.duration || audioEl.duration === Infinity) return;

        const newTime = Math.max(0, audioEl.currentTime - 10);
        audioEl.currentTime = newTime;
      });
    }

    if (skipForwardBtn) {
      skipForwardBtn.addEventListener("click", () => {
        if (usingMic) return;
        if (!audioEl || !audioEl.duration || audioEl.duration === Infinity) return;

        const newTime = Math.min(audioEl.duration, audioEl.currentTime + 10);
        audioEl.currentTime = newTime;
      });
    }

    if (audioEl) {
      audioEl.addEventListener("play", async () => {
        if (usingMic) {
          await stopMicInternal();
        }
        if (playPauseBtn) {
          playPauseBtn.textContent = PAUSE_ICON;
          playPauseBtn.disabled = false;
        }
      });

      audioEl.addEventListener("pause", () => {
        if (playPauseBtn) {
          playPauseBtn.textContent = PLAY_ICON;
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
        if (playPauseBtn) playPauseBtn.textContent = PLAY_ICON;
        if (seekSlider) seekSlider.value = 100;
      });
    }
    setDefaultArtwork();
  }

  return {
    init,
    getAnalyser,
    getDataArray,
    isUsingMic,
  };
})();