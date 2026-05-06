/* Minimal end-to-end smoke test for the random match flow. */
const { io } = require("socket.io-client");

const BASE = "http://localhost:4010/random";
const ENCODE_KEY = "fw26k";

function xorDecode(encoded, key = ENCODE_KEY) {
  const raw = Buffer.from(encoded, "base64").toString("binary");
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function logFor(name) {
  return (...args) => console.log(`[${name}]`, ...args);
}

async function run() {
  const finished = { alice: null, bob: null };

  function client(name, winDelay) {
    return new Promise((resolve, reject) => {
      const log = logFor(name);
      const sock = io(BASE, { transports: ["websocket"], autoConnect: false });
      let roomCode = null;

      sock.on("connect", () => {
        log("connected", sock.id);
        sock.emit("enter-queue", { playerName: name, deviceId: "test-" + name });
      });
      sock.on("queued", (d) => log("queued", d));
      sock.on("match-found", (d) => {
        roomCode = d.roomCode;
        log("match-found", roomCode, "yourRole=" + d.yourRole, "opp=" + d.opponentName);
        sock.emit("join-room", { roomCode, playerName: name, deviceId: "test-" + name });
      });
      sock.on("game-start", (d) => {
        const answer = xorDecode(d.encoded, ENCODE_KEY);
        log("game-start countdown=" + d.countdown, "answer=" + answer);
        setTimeout(() => {
          if (sock.connected) {
            log("submit", answer);
            sock.emit("submit-guess", { roomCode, guess: answer });
          }
        }, winDelay);
      });
      sock.on("guess-result", (d) => log("guess-result", d));
      sock.on("opponent-guessed", (d) => log("opponent-guessed", d));
      sock.on("game-over", (d) => {
        log("game-over winner=" + d.winner, "answer=" + d.answer);
        finished[name] = d;
        sock.disconnect();
        resolve(d);
      });
      sock.on("series-over", (d) => {
        log("series-over winner=" + d.seriesWinner);
        finished[name] = d;
        sock.disconnect();
        resolve(d);
      });
      sock.on("room-error", (d) => {
        log("room-error", d.message);
        sock.disconnect();
        reject(new Error(d.message));
      });

      setTimeout(() => reject(new Error(`${name} timed out`)), 20000);

      sock.connect();
    });
  }

  const aliceP = client("alice", 200);
  const bobP = client("bob", 5000);
  const [a, b] = await Promise.all([aliceP, bobP]);

  console.log("\n=== RESULT ===");
  console.log("alice:", a.winner || a.seriesWinner, "answer=", a.answer || a.fullName);
  console.log("bob:  ", b.winner || b.seriesWinner, "answer=", b.answer || b.fullName);
  process.exit(0);
}

run().catch((e) => { console.error("E2E failed:", e); process.exit(1); });
