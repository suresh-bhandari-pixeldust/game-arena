import {
  applyAction,
  createGame,
  getBotMove,
  STATS,
  STAT_LABELS,
  WRESTLER_VISUALS,
} from "./game.js";

// ================================================
// Wrestler SVG Silhouettes
// ================================================
function generateWrestlerSVG(silhouette, accentColor) {
  const c = accentColor || "#fff";
  const svgs = {
    salute: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="14" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="30" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="42" x2="62" y2="28" stroke="${c}" stroke-width="3" opacity="0.4" stroke-linecap="round"/><line x1="28" y1="48" x2="18" y2="58" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    eyebrow: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="14" fill="${c}" opacity="0.3"/><path d="M30 18 Q40 12 50 18" stroke="${c}" stroke-width="2.5" opacity="0.5" fill="none"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="44" x2="64" y2="36" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="28" y1="44" x2="16" y2="36" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    hat: `<svg viewBox="0 0 80 100" fill="none"><rect x="22" y="12" width="36" height="4" rx="2" fill="${c}" opacity="0.4"/><rect x="30" y="4" width="20" height="12" rx="3" fill="${c}" opacity="0.3"/><circle cx="40" cy="28" r="12" fill="${c}" opacity="0.25"/><rect x="28" y="42" width="24" height="30" rx="4" fill="${c}" opacity="0.2"/><path d="M30 42 L26 72 M50 42 L54 72" stroke="${c}" stroke-width="2" opacity="0.15"/><rect x="32" y="72" width="6" height="20" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="72" width="6" height="20" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    sledgehammer: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="14" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="42" x2="70" y2="20" stroke="${c}" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/><rect x="65" y="12" width="12" height="8" rx="2" fill="${c}" opacity="0.35"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    mask: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="14" fill="${c}" opacity="0.3"/><path d="M28 18 Q40 10 52 18 Q52 30 40 34 Q28 30 28 18Z" fill="${c}" opacity="0.2"/><circle cx="34" cy="22" r="3" fill="${c}" opacity="0.4"/><circle cx="46" cy="22" r="3" fill="${c}" opacity="0.4"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    flex: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="12" fill="${c}" opacity="0.3"/><rect x="28" y="34" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><path d="M52 38 L62 28 L68 36" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 38 L18 28 L12 36" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="32" y="62" width="6" height="28" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="62" width="6" height="28" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    trenchcoat: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="12" fill="${c}" opacity="0.3"/><path d="M24 36 L28 36 L28 80 L20 80Z" fill="${c}" opacity="0.15"/><path d="M52 36 L56 36 L60 80 L52 80Z" fill="${c}" opacity="0.15"/><rect x="28" y="34" width="24" height="34" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    fire: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="14" fill="${c}" opacity="0.3"/><path d="M20 90 Q20 60 30 50 Q25 70 40 55 Q55 70 50 50 Q60 60 60 90Z" fill="${c}" opacity="0.15"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    giant: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="18" r="16" fill="${c}" opacity="0.3"/><rect x="24" y="36" width="32" height="34" rx="5" fill="${c}" opacity="0.2"/><rect x="30" y="70" width="8" height="24" rx="4" fill="${c}" opacity="0.2"/><rect x="42" y="70" width="8" height="24" rx="4" fill="${c}" opacity="0.2"/><line x1="24" y1="44" x2="12" y2="58" stroke="${c}" stroke-width="4" opacity="0.3" stroke-linecap="round"/><line x1="56" y1="44" x2="68" y2="58" stroke="${c}" stroke-width="4" opacity="0.3" stroke-linecap="round"/></svg>`,
    beast: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="14" fill="${c}" opacity="0.3"/><rect x="26" y="36" width="28" height="30" rx="4" fill="${c}" opacity="0.25"/><path d="M54 40 L66 30 L70 40" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 40 L14 30 L10 40" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    middlefinger: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="44" x2="66" y2="32" stroke="${c}" stroke-width="3" opacity="0.4" stroke-linecap="round"/><line x1="28" y1="44" x2="14" y2="32" stroke="${c}" stroke-width="3" opacity="0.4" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><text x="40" y="16" text-anchor="middle" font-size="10" fill="${c}" opacity="0.5">3:16</text></svg>`,
    heartbreak: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><path d="M32 14 C28 8 20 10 22 18 L40 32 L58 18 C60 10 52 8 48 14" fill="${c}" opacity="0.2"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    viper: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><path d="M40 80 Q30 70 28 62" stroke="${c}" stroke-width="2" opacity="0.3" fill="none"/><line x1="28" y1="42" x2="16" y2="52" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="52" y1="42" x2="64" y2="52" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    armsleeves: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="42" x2="66" y2="56" stroke="${c}" stroke-width="4" opacity="0.3" stroke-linecap="round"/><line x1="28" y1="42" x2="14" y2="56" stroke="${c}" stroke-width="4" opacity="0.3" stroke-linecap="round"/><line x1="14" y1="56" x2="14" y2="42" stroke="${c}" stroke-width="2" opacity="0.2" stroke-linecap="round"/><line x1="66" y1="56" x2="66" y2="42" stroke="${c}" stroke-width="2" opacity="0.2" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    countdown: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="42" x2="64" y2="34" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="28" y1="42" x2="16" y2="34" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    medal: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><circle cx="40" cy="10" r="5" fill="${c}" opacity="0.35"/><text x="40" y="13" text-anchor="middle" font-size="7" font-weight="bold" fill="#000" opacity="0.3">G</text><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    spinarooni: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><ellipse cx="40" cy="80" rx="20" ry="4" fill="${c}" opacity="0.15"/><line x1="52" y1="44" x2="64" y2="36" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="28" y1="44" x2="16" y2="36" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    kick: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="26" rx="4" fill="${c}" opacity="0.2"/><line x1="52" y1="44" x2="66" y2="34" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="28" y1="44" x2="14" y2="34" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="64" width="6" height="14" rx="3" fill="${c}" opacity="0.2"/><path d="M42 64 L42 76 L58 68" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    bald: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="15" fill="${c}" opacity="0.3"/><ellipse cx="40" cy="24" rx="12" ry="10" fill="${c}" opacity="0.1"/><rect x="26" y="40" width="28" height="30" rx="5" fill="${c}" opacity="0.25"/><path d="M54 44 L66 34 L70 42" stroke="${c}" stroke-width="4" opacity="0.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 44 L14 34 L10 42" stroke="${c}" stroke-width="4" opacity="0.35" stroke-linecap="round" stroke-linejoin="round"/><rect x="32" y="70" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="70" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    towering: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="14" r="12" fill="${c}" opacity="0.3"/><rect x="24" y="28" width="32" height="40" rx="5" fill="${c}" opacity="0.2"/><rect x="28" y="68" width="10" height="26" rx="4" fill="${c}" opacity="0.2"/><rect x="42" y="68" width="10" height="26" rx="4" fill="${c}" opacity="0.2"/></svg>`,
    straightedge: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><text x="40" y="14" text-anchor="middle" font-size="8" font-weight="bold" fill="${c}" opacity="0.4">X</text><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><line x1="28" y1="44" x2="14" y2="52" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><line x1="52" y1="44" x2="66" y2="52" stroke="${c}" stroke-width="3" opacity="0.3" stroke-linecap="round"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    robe: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="12" fill="${c}" opacity="0.3"/><path d="M20 34 L28 34 L28 78 L16 78Z" fill="${c}" opacity="0.2"/><path d="M52 34 L60 34 L64 78 L52 78Z" fill="${c}" opacity="0.2"/><rect x="28" y="34" width="24" height="34" rx="4" fill="${c}" opacity="0.15"/><path d="M16 78 Q40 84 64 78" stroke="${c}" stroke-width="2" opacity="0.2" fill="none"/><rect x="32" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="68" width="6" height="22" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    powerlifter: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="18" r="14" fill="${c}" opacity="0.3"/><rect x="24" y="34" width="32" height="32" rx="5" fill="${c}" opacity="0.25"/><line x1="10" y1="42" x2="70" y2="42" stroke="${c}" stroke-width="4" opacity="0.3" stroke-linecap="round"/><circle cx="8" cy="42" r="6" fill="${c}" opacity="0.2"/><circle cx="72" cy="42" r="6" fill="${c}" opacity="0.2"/><rect x="30" y="66" width="8" height="26" rx="4" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="8" height="26" rx="4" fill="${c}" opacity="0.2"/></svg>`,
    lowrider: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><text x="40" y="16" text-anchor="middle" font-size="7" fill="${c}" opacity="0.4">VIVA</text></svg>`,
    sumo: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="18" r="14" fill="${c}" opacity="0.3"/><ellipse cx="40" cy="52" rx="22" ry="20" fill="${c}" opacity="0.2"/><rect x="28" y="72" width="10" height="20" rx="5" fill="${c}" opacity="0.2"/><rect x="42" y="72" width="10" height="20" rx="5" fill="${c}" opacity="0.2"/></svg>`,
    hulkup: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="36" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><path d="M52 40 L60 26 L66 34" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 40 L20 26 L14 34" stroke="${c}" stroke-width="4" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 36 L50 36" stroke="${c}" stroke-width="2" opacity="0.3"/><rect x="32" y="64" width="6" height="26" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="64" width="6" height="26" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    shades: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="26" y="18" width="12" height="6" rx="2" fill="${c}" opacity="0.4"/><rect x="42" y="18" width="12" height="6" rx="2" fill="${c}" opacity="0.4"/><line x1="38" y1="21" x2="42" y2="21" stroke="${c}" stroke-width="1.5" opacity="0.4"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
    ropes: `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="22" r="13" fill="${c}" opacity="0.3"/><rect x="28" y="38" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><path d="M52 42 L68 28 L72 36" stroke="${c}" stroke-width="3.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 42 L12 28 L8 36" stroke="${c}" stroke-width="3.5" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="50" x2="76" y2="50" stroke="${c}" stroke-width="1.5" opacity="0.15"/><line x1="4" y1="58" x2="76" y2="58" stroke="${c}" stroke-width="1.5" opacity="0.1"/><rect x="32" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/><rect x="42" y="66" width="6" height="24" rx="3" fill="${c}" opacity="0.2"/></svg>`,
  };
  return svgs[silhouette] || svgs.flex;
}

// ================================================
// DOM References
// ================================================
const ui = {
  connectionStatus: document.getElementById("connectionStatus"),
  setupPanel: document.getElementById("setupPanel"),
  localSetup: document.getElementById("localSetup"),
  onlineSetup: document.getElementById("onlineSetup"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  playerMinus: document.getElementById("playerMinus"),
  playerPlus: document.getElementById("playerPlus"),
  playerCount: document.getElementById("playerCount"),
  localSpectator: document.getElementById("localSpectator"),
  startLocal: document.getElementById("startLocal"),
  onlineName: document.getElementById("onlineName"),
  serverUrl: document.getElementById("serverUrl"),
  roomCode: document.getElementById("roomCode"),
  createRoom: document.getElementById("createRoom"),
  joinRoom: document.getElementById("joinRoom"),
  onlineLobby: document.getElementById("onlineLobby"),
  lobbyPlayers: document.getElementById("lobbyPlayers"),
  roomDisplay: document.getElementById("roomDisplay"),
  copyRoom: document.getElementById("copyRoom"),
  shareLan: document.getElementById("shareLan"),
  addBot: document.getElementById("addBot"),
  startOnline: document.getElementById("startOnline"),
  leaveRoom: document.getElementById("leaveRoom"),
  hostHint: document.getElementById("hostHint"),
  gamePanel: document.getElementById("gamePanel"),
  turnCard: document.getElementById("turnCard"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  warPileIndicator: document.getElementById("warPileIndicator"),
  warPileCount: document.getElementById("warPileCount"),
  opponentsRow: document.getElementById("opponentsRow"),
  revealArea: document.getElementById("revealArea"),
  revealTitle: document.getElementById("revealTitle"),
  revealCards: document.getElementById("revealCards"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  playerArea: document.getElementById("playerArea"),
  handPlayerInfo: document.getElementById("handPlayerInfo"),
  handMeta: document.getElementById("handMeta"),
  yourTopCard: document.getElementById("yourTopCard"),
  statButtons: document.getElementById("statButtons"),
  statStrength: document.getElementById("statStrength"),
  statSpeed: document.getElementById("statSpeed"),
  statStamina: document.getElementById("statStamina"),
  statCharisma: document.getElementById("statCharisma"),
  statFinisher: document.getElementById("statFinisher"),
  barStrength: document.getElementById("barStrength"),
  barSpeed: document.getElementById("barSpeed"),
  barStamina: document.getElementById("barStamina"),
  barCharisma: document.getElementById("barCharisma"),
  barFinisher: document.getElementById("barFinisher"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerNewGame: document.getElementById("winnerNewGame"),
};

// ================================================
// State
// ================================================
let mode = "local";
let localState = null;
let onlineState = null;
let myPlayerId = null;
let socket = null;
let roomCode = null;
let isHost = false;
let notice = null;
let noticeTimeout = null;
let autoPlay = false;
let revealTimeout = null;

// ================================================
// Utilities
// ================================================
function showNotice(message) {
  notice = message;
  if (noticeTimeout) clearTimeout(noticeTimeout);
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  noticeTimeout = setTimeout(() => {
    notice = null;
    noticeTimeout = null;
    ui.toast.classList.remove("visible");
  }, 2500);
}

function clearNotice() {
  if (noticeTimeout) clearTimeout(noticeTimeout);
  noticeTimeout = null;
  notice = null;
  ui.toast.classList.remove("visible");
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function setStatus(text) {
  ui.connectionStatus.textContent = text;
}

function setMode(nextMode) {
  mode = nextMode;
  ui.modeButtons.forEach((button) => {
    const active = button.dataset.mode === nextMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  ui.localSetup.classList.toggle("hidden", nextMode !== "local");
  ui.onlineSetup.classList.toggle("hidden", nextMode !== "online");
  ui.restartLocal.classList.toggle("hidden", nextMode !== "local");
  setStatus(nextMode === "local" ? "Local" : "Offline");
}

function currentState() {
  return mode === "online" ? onlineState : localState;
}

function currentViewingPlayerId(state) {
  if (!state) return null;
  if (mode === "online") return myPlayerId;
  const human = state.players.find((p) => !p.isBot);
  return human ? human.id : null;
}

// ================================================
// Rendering
// ================================================
function render() {
  const state = currentState();
  if (!state) {
    ui.gamePanel.classList.add("hidden");
    ui.winnerBanner.classList.add("hidden");
    return;
  }

  ui.gamePanel.classList.remove("hidden");

  const viewingPlayerId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId;
  const meIndex = state.players.findIndex((p) => p.id === viewingPlayerId);
  const me = meIndex >= 0 ? state.players[meIndex] : null;

  // Turn info
  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentPlayer?.name || "?"}'s Turn`;
  ui.turnCard.classList.toggle("my-turn", isMyTurn);

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} is the champion!` : "Match over.";
  } else if (state.phase === "revealing" && isMyTurn) {
    ui.turnHint.textContent = "Round over — draw your next card!";
  } else if (state.phase === "revealing") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to draw...`;
  } else if (state.phase === "picking" && isMyTurn) {
    ui.turnHint.textContent = "Pick a stat to compare";
  } else if (state.phase === "picking") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to pick...`;
  } else {
    ui.turnHint.textContent = "Waiting...";
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} is Champion!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // War pile
  if (state.warPile.length > 0) {
    ui.warPileIndicator.classList.remove("hidden");
    ui.warPileCount.textContent = String(state.warPile.length);
  } else {
    ui.warPileIndicator.classList.add("hidden");
  }

  // Opponents
  ui.opponentsRow.innerHTML = "";
  const opponents = state.players.filter((p) => p.id !== viewingPlayerId);
  for (const opp of opponents) {
    const el = document.createElement("div");
    el.className = "opponent-card";
    if (opp.id === currentPlayer?.id) el.classList.add("active");

    const avatar = document.createElement("div");
    avatar.className = "opp-avatar";
    avatar.textContent = opp.name.charAt(0).toUpperCase();

    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "opp-name";
    nameEl.textContent = opp.name;
    const countEl = document.createElement("div");
    countEl.className = "opp-count";
    countEl.textContent = `${opp.deck.length} card${opp.deck.length !== 1 ? "s" : ""}`;

    info.appendChild(nameEl);
    info.appendChild(countEl);
    el.appendChild(avatar);
    el.appendChild(info);
    ui.opponentsRow.appendChild(el);
  }

  // Revealed cards comparison
  if (state.revealedCards && state.revealedCards.length > 0 && state.currentStat) {
    ui.revealArea.classList.remove("hidden");
    const stat = state.currentStat;

    // Determine winner of revealed cards
    let maxVal = -1;
    let winnerIndices = [];
    for (const rc of state.revealedCards) {
      const val = rc.card[stat];
      if (val > maxVal) {
        maxVal = val;
        winnerIndices = [rc.playerIndex];
      } else if (val === maxVal) {
        winnerIndices.push(rc.playerIndex);
      }
    }
    const isTie = winnerIndices.length > 1;

    ui.revealTitle.textContent = isTie
      ? `TIE on ${STAT_LABELS[stat]}!`
      : `${STAT_LABELS[stat]} Showdown`;

    ui.revealCards.innerHTML = "";
    for (const rc of state.revealedCards) {
      const div = document.createElement("div");
      div.className = "reveal-card";
      const isWinner = winnerIndices.includes(rc.playerIndex) && !isTie;
      const isLoser = !winnerIndices.includes(rc.playerIndex);
      if (isWinner) div.classList.add("winner");
      if (isLoser) div.classList.add("loser");

      const [c1, c2] = rc.card.colors || ["#333", "#666"];
      const imgHtml = rc.card.img
        ? `<img class="rc-photo" src="./assets/${rc.card.img}" alt="${rc.card.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
        : "";
      const fallbackSvg = generateWrestlerSVG("flex", c2);

      div.innerHTML = `
        <div class="rc-portrait" style="background:linear-gradient(135deg,${c1},${c2})">
          ${imgHtml}
          <div class="rc-silhouette" style="${rc.card.img ? "display:none" : ""}">${fallbackSvg}</div>
        </div>
        <div class="rc-player">${state.players[rc.playerIndex].name}</div>
        <div class="rc-name">${rc.card.name}</div>
        <div class="rc-stat-label">${STAT_LABELS[stat]}</div>
        <div class="rc-stat-value">${rc.card[stat]}</div>
        <div class="rc-bar"><div class="rc-bar-fill" style="width:${rc.card[stat]}%"></div></div>
      `;
      ui.revealCards.appendChild(div);
    }

    // Show "Next Round" button only during revealing phase for current player
    if (state.phase === "revealing" && isMyTurn) {
      ui.nextRoundBtn.classList.remove("hidden");
      ui.nextRoundBtn.disabled = false;
    } else if (state.phase === "revealing") {
      ui.nextRoundBtn.classList.remove("hidden");
      ui.nextRoundBtn.disabled = true;
    } else {
      ui.nextRoundBtn.classList.add("hidden");
    }
  } else {
    ui.revealArea.classList.add("hidden");
  }

  // Player hand info
  ui.handPlayerInfo.innerHTML = "";
  if (me) {
    const nameEl = document.createElement("h2");
    nameEl.className = "hand-player-name";
    nameEl.textContent = me.name;
    if (isMyTurn) nameEl.classList.add("my-turn");
    ui.handPlayerInfo.appendChild(nameEl);
  } else {
    const nameEl = document.createElement("h2");
    nameEl.className = "hand-player-name";
    nameEl.textContent = viewingPlayerId ? "Your Cards" : "Spectating";
    ui.handPlayerInfo.appendChild(nameEl);
  }

  const deckCount = me ? me.deck.length : 0;
  ui.handMeta.textContent = me ? `${deckCount} card${deckCount !== 1 ? "s" : ""} in your deck` : "";

  // Your top card
  ui.yourTopCard.innerHTML = "";
  const topCard = me && me.deck.length > 0 ? me.deck[0] : null;

  if (topCard) {
    if (isMyTurn) ui.yourTopCard.classList.add("active-turn");
    else ui.yourTopCard.classList.remove("active-turn");

    // Set card colors via CSS custom properties
    const [c1, c2] = topCard.colors || ["#333", "#666"];
    ui.yourTopCard.style.setProperty("--card-color-1", c1);
    ui.yourTopCard.style.setProperty("--card-color-2", c2);

    // Wrestler portrait area
    const portrait = document.createElement("div");
    portrait.className = "wrestler-portrait";
    portrait.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;

    if (topCard.img) {
      const img = document.createElement("img");
      img.className = "wrestler-photo";
      img.src = `./assets/${topCard.img}`;
      img.alt = topCard.name;
      img.onerror = () => {
        img.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = "wrestler-silhouette";
        fallback.innerHTML = generateWrestlerSVG("flex", c2);
        portrait.insertBefore(fallback, portrait.firstChild);
      };
      portrait.appendChild(img);
    } else {
      const silhouette = document.createElement("div");
      silhouette.className = "wrestler-silhouette";
      silhouette.innerHTML = generateWrestlerSVG("flex", c2);
      portrait.appendChild(silhouette);
    }

    const alias = document.createElement("div");
    alias.className = "wrestler-alias";
    alias.textContent = topCard.alias || topCard.name.slice(0, 4).toUpperCase();

    portrait.appendChild(alias);
    ui.yourTopCard.appendChild(portrait);

    const name = document.createElement("h2");
    name.className = "wrestler-name";
    name.textContent = topCard.name;
    ui.yourTopCard.appendChild(name);

    // Signature move
    const moveEl = document.createElement("div");
    moveEl.className = "wrestler-move";
    moveEl.textContent = topCard.move || "";
    ui.yourTopCard.appendChild(moveEl);

    // Stats shown in the "Pick a Stat" buttons on the right — not duplicated here
  } else {
    ui.yourTopCard.classList.remove("active-turn");
    const msg = document.createElement("div");
    msg.className = "no-card-msg";
    msg.textContent = me ? "No cards remaining" : "Spectating";
    ui.yourTopCard.appendChild(msg);
  }

  // Stat buttons
  const statBtns = ui.statButtons.querySelectorAll(".stat-btn");
  const canPick = isMyTurn && state.phase === "picking" && me && me.deck.length > 0;

  for (const btn of statBtns) {
    const stat = btn.dataset.stat;
    btn.disabled = !canPick;

    // Update button values
    const valEl = btn.querySelector(".stat-value");
    const fillEl = btn.querySelector(".stat-fill");

    if (topCard) {
      valEl.textContent = String(topCard[stat]);
      fillEl.style.width = `${topCard[stat]}%`;
    } else {
      valEl.textContent = "-";
      fillEl.style.width = "0%";
    }
  }

  // Logs sidebar
  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  // Bot automation — handle both revealing (draw) and picking phases
  if (mode === "local" && (state.phase === "revealing" || state.phase === "picking")) {
    const cp = state.players[state.currentPlayerIndex];
    if (cp && cp.isBot) {
      if (revealTimeout) clearTimeout(revealTimeout);
      const delay = state.phase === "revealing" ? 2000 : 1800;
      revealTimeout = setTimeout(() => {
        if (!localState) return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, delay);
    } else if (cp && cp.id === viewingPlayerId && autoPlay) {
      if (revealTimeout) clearTimeout(revealTimeout);
      const delay = state.phase === "revealing" ? 1500 : 1200;
      revealTimeout = setTimeout(() => {
        if (!localState) return;
        const idx = localState.players.findIndex((p) => p.id === viewingPlayerId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) dispatchAction(botAction);
        }
      }, delay);
    }
  }
}

// ================================================
// Action Dispatch
// ================================================
function dispatchAction(action) {
  if (mode === "online") {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showNotice("Not connected to the server.");
      return;
    }
    socket.send(JSON.stringify(action));
    return;
  }

  if (!localState) {
    showNotice("Start a match first.");
    return;
  }

  if (revealTimeout) clearTimeout(revealTimeout);
  clearNotice();

  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;
  render();
}

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = [
    "The Rock", "Undertaker", "Triple H", "Brock Lesnar",
    "Stone Cold", "John Cena", "Shawn Michaels", "Randy Orton",
  ];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: `${botName} (Bot)`, isBot: true });
  }

  // Must have at least 2 players
  if (players.length < 2) {
    const extra = botNames[players.length % botNames.length];
    players.push({ id: "bot_extra", name: `${extra} (Bot)`, isBot: true });
  }

  notice = null;
  localState = createGame({ players });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  if (revealTimeout) clearTimeout(revealTimeout);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  autoPlay = false;
  ui.autoPlayToggle.textContent = "Auto Play: Off";
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.winnerBanner.classList.add("hidden");
  ui.toast.classList.remove("visible");
}

// ================================================
// Online Mode
// ================================================
function connectOnline({ create }) {
  const name = ui.onlineName.value.trim() || "Player";
  const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = ui.serverUrl.value.trim() || `${wsProtocol}//${location.host}`;
  const rawCode = ui.roomCode.value.trim();
  if (!create && !rawCode) {
    showNotice("Enter a room code to join.");
    return;
  }
  const code = (rawCode || generateRoomCode()).toUpperCase();
  roomCode = code;
  ui.roomCode.value = code;
  if (socket) socket.close();
  socket = new WebSocket(url);
  setStatus("Connecting...");

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "hello",
        name,
        room: code,
        create,
        gameType: "wwe-trump-cards",
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "welcome") {
      myPlayerId = message.playerId;
      setStatus("Connected");
    }
    if (message.type === "room_state") {
      roomCode = message.room;
      isHost = message.hostId === myPlayerId;
      ui.roomDisplay.textContent = message.room;
      ui.onlineLobby.classList.remove("hidden");
      ui.lobbyPlayers.innerHTML = "";
      message.players.forEach((player) => {
        const line = document.createElement("div");
        line.textContent = player.name + (player.isBot ? " (Bot)" : "");
        ui.lobbyPlayers.appendChild(line);
      });
      ui.startOnline.disabled = !isHost;
      ui.addBot.disabled = !isHost;
      ui.hostHint.textContent = isHost
        ? "You are the host. Start when everyone is ready."
        : "Waiting for the host to start.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      notice = null;
      ui.setupPanel.classList.add("hidden");
      render();
    }
    if (message.type === "error") showNotice(message.message);
  });

  socket.addEventListener("close", () => {
    setStatus("Offline");
    isHost = false;
  });
}

function leaveRoom() {
  if (socket) {
    socket.send(JSON.stringify({ type: "leave" }));
    socket.close();
  }
  socket = null;
  onlineState = null;
  ui.onlineLobby.classList.add("hidden");
  setStatus("Offline");
}

// ================================================
// Event Listeners
// ================================================
ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(3, Number(ui.playerCount.textContent) + 1);
  ui.playerCount.textContent = String(count);
});

ui.startLocal.addEventListener("click", startLocalGame);

ui.createRoom.addEventListener("click", () => connectOnline({ create: true }));
ui.joinRoom.addEventListener("click", () => connectOnline({ create: false }));

ui.copyRoom.addEventListener("click", () => {
  if (roomCode) {
    navigator.clipboard?.writeText(roomCode);
    showNotice("Room code copied.");
  }
});

ui.shareLan.addEventListener("click", () => {
  if (roomCode) {
    const url = window.location.origin + window.location.pathname + "?room=" + roomCode;
    navigator.clipboard?.writeText(url);
    showNotice("LAN Game Link copied!");
  }
});

ui.addBot.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "add_bot" }));
  }
});

ui.startOnline.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "start_game" }));
  }
});

ui.leaveRoom.addEventListener("click", leaveRoom);

// Next Round button (draw card to start next round)
ui.nextRoundBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "revealing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "draw_card", playerId: viewingId });
});

// Stat buttons
const statBtns = ui.statButtons.querySelectorAll(".stat-btn");
for (const btn of statBtns) {
  btn.addEventListener("click", () => {
    const state = currentState();
    if (!state || state.phase !== "picking") return;
    const viewingId = currentViewingPlayerId(state);
    if (!viewingId) return;
    dispatchAction({ type: "pick_stat", playerId: viewingId, stat: btn.dataset.stat });
  });
}

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState && localState.phase === "picking") {
    const cp = localState.players[localState.currentPlayerIndex];
    const viewingId = currentViewingPlayerId(localState);
    if (cp && cp.id === viewingId) {
      if (revealTimeout) clearTimeout(revealTimeout);
      revealTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "picking") return;
        const idx = localState.players.findIndex((p) => p.id === viewingId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) dispatchAction(botAction);
        }
      }, 600);
    }
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".wwe-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".wwe-app").classList.remove("sidebar-open");
});

// Auto-fill room from URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get("room");
if (roomParam) {
  ui.roomCode.value = roomParam.toUpperCase();
  setMode("online");
}

// Initialize
setMode("local");
