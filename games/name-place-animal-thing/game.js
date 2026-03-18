// Name Place Animal Thing — Pure Game Engine
// Classic word game: given a letter, fill in Name, Place, Animal, Thing

const CATEGORIES = ["name", "place", "animal", "thing"];

const CATEGORY_LABELS = {
  name: "Name",
  place: "Place",
  animal: "Animal",
  thing: "Thing",
};

const LETTERS = "ABCDEFGHIJKLMNOPRSTW".split("");

// Bot dictionary — answers for each letter
const BOT_ANSWERS = {
  A: { name: "Alice", place: "Amsterdam", animal: "Antelope", thing: "Axe" },
  B: { name: "Brian", place: "Berlin", animal: "Bear", thing: "Bucket" },
  C: { name: "Clara", place: "Cairo", animal: "Cheetah", thing: "Candle" },
  D: { name: "David", place: "Delhi", animal: "Dolphin", thing: "Drum" },
  E: { name: "Emily", place: "Edinburgh", animal: "Eagle", thing: "Eraser" },
  F: { name: "Frank", place: "Florence", animal: "Flamingo", thing: "Fork" },
  G: { name: "Grace", place: "Geneva", animal: "Giraffe", thing: "Guitar" },
  H: { name: "Henry", place: "Helsinki", animal: "Hawk", thing: "Hammer" },
  I: { name: "Isaac", place: "Istanbul", animal: "Iguana", thing: "Ink" },
  J: { name: "Julia", place: "Jakarta", animal: "Jaguar", thing: "Jar" },
  K: { name: "Kevin", place: "Kyoto", animal: "Koala", thing: "Kite" },
  L: { name: "Laura", place: "London", animal: "Leopard", thing: "Lamp" },
  M: { name: "Maria", place: "Madrid", animal: "Monkey", thing: "Mirror" },
  N: { name: "Nathan", place: "Naples", animal: "Narwhal", thing: "Needle" },
  O: { name: "Olivia", place: "Oslo", animal: "Owl", thing: "Oven" },
  P: { name: "Peter", place: "Paris", animal: "Penguin", thing: "Pencil" },
  R: { name: "Rachel", place: "Rome", animal: "Rabbit", thing: "Rope" },
  S: { name: "Sarah", place: "Sydney", animal: "Snake", thing: "Spoon" },
  T: { name: "Thomas", place: "Tokyo", animal: "Tiger", thing: "Table" },
  W: { name: "William", place: "Warsaw", animal: "Whale", thing: "Watch" },
};

// Alternate bot answers for variety
const BOT_ANSWERS_ALT = {
  A: { name: "Adam", place: "Athens", animal: "Alligator", thing: "Anchor" },
  B: { name: "Bella", place: "Bangkok", animal: "Buffalo", thing: "Bell" },
  C: { name: "Charlie", place: "Chicago", animal: "Cobra", thing: "Chair" },
  D: { name: "Diana", place: "Dublin", animal: "Deer", thing: "Diamond" },
  E: { name: "Edward", place: "Edmonton", animal: "Elephant", thing: "Envelope" },
  F: { name: "Fiona", place: "Frankfurt", animal: "Fox", thing: "Fan" },
  G: { name: "George", place: "Glasgow", animal: "Gorilla", thing: "Glove" },
  H: { name: "Hannah", place: "Hanoi", animal: "Hippo", thing: "Hat" },
  I: { name: "Irene", place: "Islamabad", animal: "Ibis", thing: "Iron" },
  J: { name: "James", place: "Johannesburg", animal: "Jellyfish", thing: "Jacket" },
  K: { name: "Karen", place: "Karachi", animal: "Kangaroo", thing: "Kettle" },
  L: { name: "Liam", place: "Lisbon", animal: "Lion", thing: "Ladder" },
  M: { name: "Michael", place: "Moscow", animal: "Moose", thing: "Map" },
  N: { name: "Nora", place: "Nairobi", animal: "Nightingale", thing: "Necklace" },
  O: { name: "Oscar", place: "Ottawa", animal: "Otter", thing: "Orange" },
  P: { name: "Paula", place: "Prague", animal: "Parrot", thing: "Pillow" },
  R: { name: "Robert", place: "Riyadh", animal: "Raccoon", thing: "Ring" },
  S: { name: "Samuel", place: "Seoul", animal: "Shark", thing: "Scissors" },
  T: { name: "Tanya", place: "Toronto", animal: "Turtle", thing: "Telescope" },
  W: { name: "Wendy", place: "Wellington", animal: "Wolf", thing: "Wallet" },
};

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

function pickRandomLetter(usedLetters) {
  const available = LETTERS.filter((l) => !usedLetters.includes(l));
  if (available.length === 0) return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

export function createGame({ players, options = {} }) {
  const totalRounds = options.totalRounds || 5;
  const timeLimit = options.timeLimit || 30;

  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    score: 0,
    answers: null, // current round answers { name, place, animal, thing }
    submitted: false,
  }));

  const letter = pickRandomLetter([]);

  const state = {
    players: gamePlayers,
    phase: "waiting", // waiting → playing → scoring → finished
    currentRound: 0,
    totalRounds,
    timeLimit,
    currentLetter: letter,
    usedLetters: [letter],
    roundScores: [], // array of { letter, scores: [{playerId, answers, points}] }
    winnerId: null,
    log: [],
    options,
  };

  pushLog(state, `Game created! ${totalRounds} rounds, ${timeLimit}s per round.`);
  pushLog(state, `${gamePlayers.length} players ready to play.`);

  return state;
}

export function applyAction(state, action) {
  if (!state) {
    return { state, error: "Game not started." };
  }
  if (state.phase === "finished") {
    return { state, error: "Game finished." };
  }

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) {
    return { state, error: "Unknown player." };
  }

  if (type === "start_round") {
    if (state.phase !== "waiting" && state.phase !== "scoring") {
      return { state, error: "Cannot start round now." };
    }

    state.currentRound += 1;

    if (state.phase === "scoring") {
      // Pick new letter for next round
      const letter = pickRandomLetter(state.usedLetters);
      state.currentLetter = letter;
      state.usedLetters.push(letter);
    }

    // Reset player answers
    for (const p of state.players) {
      p.answers = null;
      p.submitted = false;
    }

    state.phase = "playing";
    pushLog(state, `Round ${state.currentRound}: Letter is "${state.currentLetter}"!`);

    return { state };
  }

  if (type === "submit_answers") {
    if (state.phase !== "playing") {
      return { state, error: "Not in playing phase." };
    }

    const player = state.players[playerIndex];
    if (player.submitted) {
      return { state, error: "Already submitted answers." };
    }

    const answers = action.answers || {};
    player.answers = {
      name: (answers.name || "").trim(),
      place: (answers.place || "").trim(),
      animal: (answers.animal || "").trim(),
      thing: (answers.thing || "").trim(),
    };
    player.submitted = true;

    pushLog(state, `${player.name} submitted their answers.`);

    // Check if all players have submitted
    const allSubmitted = state.players.every((p) => p.submitted);
    if (allSubmitted) {
      // Score the round
      scoreRound(state);
    }

    return { state };
  }

  return { state, error: "Unknown action." };
}

function isValidAnswer(answer, letter) {
  if (!answer || answer.length === 0) return false;
  return answer.charAt(0).toUpperCase() === letter.toUpperCase();
}

function scoreRound(state) {
  const letter = state.currentLetter;
  const roundResult = { letter, scores: [] };

  for (const category of CATEGORIES) {
    // Collect all answers for this category
    const answerMap = {};
    for (const player of state.players) {
      const answer = player.answers ? player.answers[category] : "";
      if (isValidAnswer(answer, letter)) {
        const normalized = answer.toLowerCase().trim();
        if (!answerMap[normalized]) answerMap[normalized] = [];
        answerMap[normalized].push(player.id);
      }
    }

    // Score each player for this category
    for (const player of state.players) {
      const answer = player.answers ? player.answers[category] : "";
      let points = 0;

      if (isValidAnswer(answer, letter)) {
        const normalized = answer.toLowerCase().trim();
        const count = answerMap[normalized] ? answerMap[normalized].length : 0;
        if (count === 1) {
          points = 10; // unique answer
        } else {
          points = 5; // duplicate answer
        }
      }

      player.score += points;

      // Find or create score entry for this player
      let entry = roundResult.scores.find((s) => s.playerId === player.id);
      if (!entry) {
        entry = {
          playerId: player.id,
          playerName: player.name,
          answers: { ...player.answers },
          points: {},
          totalRoundPoints: 0,
        };
        roundResult.scores.push(entry);
      }
      entry.points[category] = points;
      entry.totalRoundPoints += points;
    }
  }

  state.roundScores.push(roundResult);

  // Log round results
  pushLog(state, `--- Round ${state.currentRound} Results (Letter: ${letter}) ---`);
  for (const entry of roundResult.scores) {
    pushLog(state, `${entry.playerName}: +${entry.totalRoundPoints} points`);
  }

  // Check if game is over
  if (state.currentRound >= state.totalRounds) {
    state.phase = "finished";

    // Find winner
    let bestScore = -1;
    let winnerId = null;
    for (const player of state.players) {
      if (player.score > bestScore) {
        bestScore = player.score;
        winnerId = player.id;
      }
    }
    state.winnerId = winnerId;

    const winner = state.players.find((p) => p.id === winnerId);
    pushLog(state, `Game over! ${winner ? winner.name : "Someone"} wins with ${bestScore} points!`);
  } else {
    state.phase = "scoring";
    pushLog(state, `Next round coming up...`);
  }
}

export function sanitizeStateForPlayer(state, playerId) {
  return {
    ...state,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      score: player.score,
      submitted: player.submitted,
      // Only show own answers during playing phase
      answers:
        state.phase === "playing"
          ? player.id === playerId
            ? player.answers
            : null
          : player.answers,
    })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || !player.isBot) return null;

  if (state.phase === "waiting" || state.phase === "scoring") {
    return { type: "start_round", playerId: player.id };
  }

  if (state.phase === "playing" && !player.submitted) {
    const letter = state.currentLetter;
    // Alternate between primary and alt answers based on player index
    const dict = playerIndex % 2 === 0 ? BOT_ANSWERS : BOT_ANSWERS_ALT;
    const answers = dict[letter] || BOT_ANSWERS[letter] || {
      name: "",
      place: "",
      animal: "",
      thing: "",
    };

    // Sometimes bots skip a category (20% chance per category) for realism
    const finalAnswers = {};
    for (const cat of CATEGORIES) {
      if (Math.random() > 0.15) {
        finalAnswers[cat] = answers[cat] || "";
      } else {
        finalAnswers[cat] = "";
      }
    }

    return { type: "submit_answers", playerId: player.id, answers: finalAnswers };
  }

  return null;
}

// Compatibility stubs for the platform
export function getPlayableCards() {
  return [];
}

export function getCurrentColor() {
  return null;
}

export function getTopCard() {
  return null;
}

export { CATEGORIES, CATEGORY_LABELS, LETTERS };
