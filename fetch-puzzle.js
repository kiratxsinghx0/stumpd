const fs = require("fs");
const path = require("path");

const API_BASE = process.env.API_URL || "https://fifabackend-production-2dd4.up.railway.app";
const PUZZLE_FILE = path.join(__dirname, "current-puzzle.json");

async function fetchTodayPuzzle() {
  const url = `${API_BASE}/api/puzzle/today`;
  console.log(`Fetching today's puzzle from ${url} …`);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`API returned ${res.status}: ${body}`);
    process.exit(1);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    console.error("Unexpected response shape:", JSON.stringify(json, null, 2));
    process.exit(1);
  }

  const { encoded, hash, previousHash, day, setAt } = json.data;

  const puzzle = {
    encoded,
    hash,
    previousHash: previousHash ?? null,
    day,
    setAt,
  };

  fs.writeFileSync(PUZZLE_FILE, JSON.stringify(puzzle, null, 2) + "\n");

  console.log(`Puzzle #${day} saved to ${path.relative(process.cwd(), PUZZLE_FILE)}`);
  console.log(`  Encoded:  ${encoded}`);
  console.log(`  Hash:     ${hash}`);
  console.log(`  Set at:   ${setAt}`);
}

fetchTodayPuzzle().catch((err) => {
  console.error("Failed to fetch puzzle:", err.message);
  process.exit(1);
});
