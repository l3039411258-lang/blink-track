const deck = document.querySelector("#deck");
const slides = [...document.querySelectorAll(".slide")];
const caneAudio = document.querySelector("#caneAudio");
const bgAudio = document.querySelector("#bgAudio");
const streetAudio = document.querySelector("#streetAudio");
const audioPill = document.querySelector("#audioPill");
const afterAudio = document.querySelector("#afterAudio");
const playAudioButton = document.querySelector(".play-audio");
const timelineLayer = document.querySelector("#timelineLayer");
const layerTitle = document.querySelector("#layerTitle");
const layerDetail = document.querySelector("#layerDetail");
const voteSlide = document.querySelector("#vote");
const resultPanel = document.querySelector("#resultPanel");
const progressBar = document.querySelector("#progressBar");

let currentSlide = 0;
let audioUnlocked = false;
let bgMuted = false;
let canePlayed = false;

bgAudio.volume = 0.16;
streetAudio.volume = 0.9;
caneAudio.volume = 0.85;

const slideObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const slide = entry.target;
      currentSlide = slides.indexOf(slide);
      slides.forEach(item => item.classList.toggle("is-active", item === slide));
      updateProgress();
      handleSlideAudio(slide);
      if (slide.id !== "audio") {
        pauseStreetAudio();
      }
    });
  },
  {
    root: deck,
    threshold: 0.62
  }
);

slides.forEach(slide => slideObserver.observe(slide));

function updateProgress() {
  if (!progressBar) return;
  const amount = ((currentSlide + 1) / slides.length) * 100;
  progressBar.style.width = `${amount}%`;
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (!canePlayed && currentSlide === 0) {
    playCane();
  }
  if (currentSlide > 0) {
    playBg();
  }
}

function handleSlideAudio(slide) {
  if (!audioUnlocked) return;
  if (slide.id === "cover") {
    playCane();
    bgAudio.pause();
    return;
  }
  if (!bgMuted && slide.id !== "audio") {
    playBg();
  }
}

function playCane() {
  canePlayed = true;
  caneAudio.currentTime = 0;
  caneAudio.play().catch(() => {});
}

function playBg() {
  if (bgMuted) return;
  bgAudio.play().catch(() => {});
}

function pauseStreetAudio() {
  streetAudio.pause();
  playAudioButton.classList.remove("is-playing");
}

function goToSlide(id) {
  const target = document.querySelector(`#${id}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
document.addEventListener("click", unlockAudio, { once: true });

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => goToSlide(button.dataset.go));
});

document.querySelectorAll(".node").forEach(node => {
  node.addEventListener("click", () => {
    layerTitle.textContent = node.dataset.title;
    layerDetail.textContent = node.dataset.detail;
    timelineLayer.classList.add("is-open");
    timelineLayer.setAttribute("aria-hidden", "false");
  });
});

document.querySelector(".close-layer").addEventListener("click", () => {
  timelineLayer.classList.remove("is-open");
  timelineLayer.setAttribute("aria-hidden", "true");
});

timelineLayer.addEventListener("click", event => {
  if (event.target === timelineLayer) {
    timelineLayer.classList.remove("is-open");
    timelineLayer.setAttribute("aria-hidden", "true");
  }
});

document.querySelectorAll(".vote-button").forEach(button => {
  button.addEventListener("click", () => {
    voteSlide.classList.add("show-result");
    resultPanel.setAttribute("aria-hidden", "false");
  });
});

document.querySelector(".return-button").addEventListener("click", () => {
  voteSlide.classList.remove("show-result");
  resultPanel.setAttribute("aria-hidden", "true");
});

playAudioButton.addEventListener("click", () => {
  unlockAudio();
  if (streetAudio.paused) {
    bgAudio.pause();
    streetAudio.currentTime = 0;
    streetAudio.play().then(() => {
      playAudioButton.classList.add("is-playing");
    }).catch(() => {});
  } else {
    pauseStreetAudio();
  }
});

streetAudio.addEventListener("ended", () => {
  playAudioButton.classList.remove("is-playing");
  afterAudio.classList.add("is-visible");
  if (!bgMuted) {
    playBg();
  }
});

audioPill.addEventListener("click", () => {
  unlockAudio();
  bgMuted = !bgMuted;
  audioPill.classList.toggle("is-muted", bgMuted);
  if (bgMuted) {
    bgAudio.pause();
  } else if (currentSlide > 0 && slides[currentSlide].id !== "audio") {
    playBg();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowDown" || event.key === "PageDown") {
    event.preventDefault();
    const next = Math.min(slides.length - 1, currentSlide + 1);
    slides[next].scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    const prev = Math.max(0, currentSlide - 1);
    slides[prev].scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (event.key === "Escape") {
    timelineLayer.classList.remove("is-open");
    timelineLayer.setAttribute("aria-hidden", "true");
  }
});

window.addEventListener("load", () => {
  slides[0].classList.add("is-active");
  updateProgress();
  const params = new URLSearchParams(window.location.search);
  const previewSlide = params.get("slide");
  if (previewSlide) {
    const target = document.querySelector(`#${previewSlide}`);
    if (target) {
      setTimeout(() => {
        deck.scrollTop = target.offsetTop;
      }, 120);
    }
  }
  if (params.get("result") === "1") {
    voteSlide.classList.add("show-result");
    resultPanel.setAttribute("aria-hidden", "false");
  }
  if (params.get("afterAudio") === "1") {
    afterAudio.classList.add("is-visible");
  }
  caneAudio.play().then(() => {
    canePlayed = true;
    audioUnlocked = true;
  }).catch(() => {});
});
