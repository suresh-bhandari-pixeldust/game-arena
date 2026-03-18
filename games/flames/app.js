import {
  calculateFlames,
  FLAMES_LETTERS,
  FLAMES_MEANINGS,
  FLAMES_EMOJIS,
} from "./game.js";

// ── DOM refs ────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const name1Input = $("name1");
const name2Input = $("name2");
const btnFind = $("btnFind");
const errorMsg = $("errorMsg");
const inputCard = $("inputCard");

const cancelDisplay = $("cancelDisplay");
const labelName1 = $("labelName1");
const labelName2 = $("labelName2");
const lettersAEl = $("lettersA");
const lettersBEl = $("lettersB");
const remainingCountEl = $("remainingCount");

const flamesRing = $("flamesRing");
const ringLettersEl = $("ringLetters");
const stepInfoEl = $("stepInfo");

const resultArea = $("resultArea");
const resultEmoji = $("resultEmoji");
const resultLetter = $("resultLetter");
const resultMeaning = $("resultMeaning");
const resultNames = $("resultNames");
const btnTryAgain = $("btnTryAgain");

const historyList = $("historyList");

// ── State ───────────────────────────────────────────────────────
let history = JSON.parse(localStorage.getItem("flames_history") || "[]");
let animating = false;

// ── Init ────────────────────────────────────────────────────────
createFloatingHearts();
renderHistory();

// ── Events ──────────────────────────────────────────────────────
btnFind.addEventListener("click", handleFind);
btnTryAgain.addEventListener("click", handleReset);

name1Input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") name2Input.focus();
});
name2Input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleFind();
});

// ── Floating Hearts ─────────────────────────────────────────────
function createFloatingHearts() {
  const container = $("heartsBg");
  const hearts = ["\u2764", "\u{1F49C}", "\u{1F49B}", "\u{1F90D}", "\u{1F498}"];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement("span");
    span.className = "heart";
    span.textContent = hearts[i % hearts.length];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDuration = 12 + Math.random() * 18 + "s";
    span.style.animationDelay = Math.random() * 15 + "s";
    span.style.fontSize = 0.8 + Math.random() * 1.2 + "rem";
    container.appendChild(span);
  }
}

// ── Main Flow ───────────────────────────────────────────────────
async function handleFind() {
  if (animating) return;

  const n1 = name1Input.value.trim();
  const n2 = name2Input.value.trim();

  // Validation
  if (!n1 || !n2) {
    showError("Please enter both names!");
    return;
  }
  if (!/[a-zA-Z]/.test(n1) || !/[a-zA-Z]/.test(n2)) {
    showError("Names must contain at least one letter.");
    return;
  }

  showError("");
  animating = true;
  btnFind.disabled = true;

  const data = calculateFlames(n1, n2);

  // Step 1: Show letter cancellation
  await showCancellation(n1, n2, data);

  // Step 2: Animate FLAMES ring
  await animateFlamesRing(data);

  // Step 3: Show result
  showResult(n1, n2, data);

  // Step 4: Save to history
  addToHistory(n1, n2, data);

  animating = false;
}

function handleReset() {
  cancelDisplay.classList.remove("visible");
  flamesRing.classList.remove("visible");
  resultArea.classList.remove("visible");

  name1Input.value = "";
  name2Input.value = "";
  btnFind.disabled = false;
  showError("");

  name1Input.focus();
}

// ── Cancellation Animation ──────────────────────────────────────
async function showCancellation(n1, n2, data) {
  const { lettersA, lettersB, remainingCount } = data;

  labelName1.textContent = n1;
  labelName2.textContent = n2;

  // Build letter chips
  lettersAEl.innerHTML = "";
  lettersBEl.innerHTML = "";

  lettersA.forEach((l) => {
    const chip = document.createElement("span");
    chip.className = "letter-chip";
    chip.textContent = l.char;
    chip.dataset.cancelled = l.cancelled;
    lettersAEl.appendChild(chip);
  });

  lettersB.forEach((l) => {
    const chip = document.createElement("span");
    chip.className = "letter-chip";
    chip.textContent = l.char;
    chip.dataset.cancelled = l.cancelled;
    lettersBEl.appendChild(chip);
  });

  remainingCountEl.textContent = `Remaining letters: ${remainingCount}`;

  cancelDisplay.classList.add("visible");

  // Animate cancellation one by one
  await sleep(400);

  const allChips = [
    ...lettersAEl.querySelectorAll(".letter-chip"),
    ...lettersBEl.querySelectorAll(".letter-chip"),
  ];

  for (const chip of allChips) {
    if (chip.dataset.cancelled === "true") {
      chip.classList.add("cancelled");
      await sleep(120);
    }
  }

  await sleep(600);
}

// ── FLAMES Ring Animation ───────────────────────────────────────
async function animateFlamesRing(data) {
  const { steps, remainingCount } = data;

  if (steps.length === 0) {
    // Edge case: identical names
    flamesRing.classList.add("visible");
    renderRingState(FLAMES_LETTERS, -1, [], data.letter);
    stepInfoEl.textContent = "Your names are identical!";
    await sleep(800);
    return;
  }

  flamesRing.classList.add("visible");
  const eliminated = [];

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    const isLast = si === steps.length - 1;

    // Render current letters
    renderRingState(step.letters, -1, eliminated, null);
    stepInfoEl.textContent = `Counting ${remainingCount}...`;

    await sleep(400);

    // Animate counting through the letters
    const len = step.letters.length;
    let pos = step.countFrom;

    for (let c = 1; c <= remainingCount; c++) {
      const idx = (step.countFrom + c - 1) % len;
      renderRingState(step.letters, idx, eliminated, null);
      // Speed up counting for large counts
      const delay = remainingCount > 12 ? 80 : remainingCount > 6 ? 120 : 180;
      await sleep(delay);
    }

    // Highlight the eliminated letter
    const elIdx = step.landIndex;
    renderRingState(step.letters, elIdx, eliminated, null);
    await sleep(300);

    eliminated.push(step.eliminated);

    if (isLast) {
      // Show the winner
      const winner = step.letters.filter((l) => l !== step.eliminated)[0];
      renderRingState(
        step.letters,
        -1,
        eliminated,
        winner,
      );
      stepInfoEl.textContent = "";
    } else {
      renderRingState(step.letters, -1, eliminated, null);
      stepInfoEl.textContent = `Eliminated: ${step.eliminated}`;
      await sleep(500);
    }
  }

  await sleep(600);
}

function renderRingState(letters, activeIdx, eliminatedArr, winnerLetter) {
  ringLettersEl.innerHTML = "";

  // Always render all 6 FLAMES letters to keep stable layout
  FLAMES_LETTERS.forEach((fl) => {
    const div = document.createElement("div");
    div.className = "flame-letter";

    const inRing = letters.includes(fl);
    const ringIdx = letters.indexOf(fl);
    const isEliminated = eliminatedArr.includes(fl);
    const isWinner = fl === winnerLetter;
    const isActive = inRing && ringIdx === activeIdx;

    if (isWinner) {
      div.classList.add("winner");
    } else if (isEliminated) {
      div.classList.add("eliminated");
    } else if (isActive) {
      div.classList.add("active");
    }

    div.innerHTML = `${fl}<span class="meaning-hint">${FLAMES_MEANINGS[fl]}</span>`;
    ringLettersEl.appendChild(div);
  });
}

// ── Result Display ──────────────────────────────────────────────
function showResult(n1, n2, data) {
  resultEmoji.textContent = data.emoji;
  resultLetter.textContent = `${data.letter} = ${data.result}`;
  resultMeaning.textContent = getFlavorText(data.letter, n1, n2);
  resultNames.textContent = `${capitalize(n1)} & ${capitalize(n2)}`;

  resultArea.classList.add("visible");
  launchConfetti();
}

function getFlavorText(letter, n1, n2) {
  const texts = {
    F: `${capitalize(n1)} and ${capitalize(n2)} are destined to be the best of friends!`,
    L: `There is deep love between ${capitalize(n1)} and ${capitalize(n2)}!`,
    A: `${capitalize(n1)} and ${capitalize(n2)} share a sweet affection!`,
    M: `Wedding bells are ringing for ${capitalize(n1)} and ${capitalize(n2)}!`,
    E: `Watch out! ${capitalize(n1)} and ${capitalize(n2)} are rivals!`,
    S: `${capitalize(n1)} and ${capitalize(n2)} share a sibling-like bond!`,
  };
  return texts[letter] || "";
}

// ── History ─────────────────────────────────────────────────────
function addToHistory(n1, n2, data) {
  history.unshift({
    n1: capitalize(n1),
    n2: capitalize(n2),
    letter: data.letter,
    result: data.result,
    emoji: data.emoji,
  });

  if (history.length > 20) history.pop();
  localStorage.setItem("flames_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="history-empty">No predictions yet. Try one!</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (h) => `
    <div class="history-item">
      <span class="hi-emoji">${h.emoji}</span>
      <span class="hi-names"><span>${h.n1}</span> & <span>${h.n2}</span></span>
      <span class="hi-result">${h.result}</span>
    </div>
  `,
    )
    .join("");
}

// ── Confetti ────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#ff6b9d", "#c471ed", "#f64f59", "#ffd700", "#ff9a9e", "#a18cd1"];
  const particles = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }

  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.25;
      p.y += p.vy;
      p.rot += p.rotV;
      p.life -= 0.012;

      if (p.life <= 0) continue;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive && frame < 180) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);
}

// ── Helpers ─────────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
