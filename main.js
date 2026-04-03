const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PUZZLE_FILE = path.join(__dirname, "current-puzzle.json");
const PLAYERS_FILE = path.join(__dirname, "app", "components", "players.ts");
const WORD_LENGTH = 5;
const ENCODE_KEY = "fw26k";

function loadPlayerNames() {
  const src = fs.readFileSync(PLAYERS_FILE, "utf-8");
  const names = [];
  const regex = /name:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(src)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function xorEncode(text, key) {
  const buf = Buffer.alloc(text.length);
  for (let i = 0; i < text.length; i++) {
    buf[i] = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
  }
  return buf.toString("base64");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const allNames = loadPlayerNames();
const fiveLetterNames = [...new Set(allNames.filter((n) => n.length === WORD_LENGTH))];

if (fiveLetterNames.length < 2) {
  console.error("Need at least 2 unique 5-letter player names in players.ts");
  process.exit(1);
}

const requestedName = process.argv[2]?.toUpperCase();

let previous = null;
try {
  previous = JSON.parse(fs.readFileSync(PUZZLE_FILE, "utf-8"));
} catch {
  /* first run */
}

let chosen;

if (requestedName) {
  if (!fiveLetterNames.includes(requestedName)) {
    const isInList = allNames.includes(requestedName);
    if (isInList) {
      console.error(`"${requestedName}" exists but is not 5 letters (${requestedName.length}). Must be exactly ${WORD_LENGTH}.`);
    } else {
      console.error(`"${requestedName}" not found in players.ts.`);
    }
    console.error(`Available 5-letter names: ${fiveLetterNames.join(", ")}`);
    process.exit(1);
  }
  if (previous && previous.hash === sha256(requestedName.toLowerCase())) {
    console.error(`"${requestedName}" is the same as the current puzzle. Pick a different one.`);
    process.exit(1);
  }
  chosen = requestedName;
} else {
  let attempts = 0;
  do {
    const idx = crypto.randomInt(fiveLetterNames.length);
    chosen = fiveLetterNames[idx];
    attempts++;
  } while (
    previous &&
    previous.hash === sha256(chosen.toLowerCase()) &&
    attempts < 100
  );
}

if (chosen.length !== WORD_LENGTH) {
  console.error("BUG: chosen player is not 5 letters");
  process.exit(1);
}

const puzzle = {
  encoded: xorEncode(chosen.toLowerCase(), ENCODE_KEY),
  hash: sha256(chosen.toLowerCase()),
  previousHash: previous?.hash ?? null,
  day: previous?.day != null ? previous.day + 1 : 1,
  setAt: new Date().toISOString(),
};

fs.writeFileSync(PUZZLE_FILE, JSON.stringify(puzzle, null, 2) + "\n");

console.log(`Puzzle #${puzzle.day} set successfully`);
console.log(`  Player:       ${chosen} (${chosen.length} letters)`);
console.log(`  Not duplicate: ${puzzle.hash !== puzzle.previousHash}`);
console.log(`  Set at:       ${puzzle.setAt}`);
