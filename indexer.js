const WebSocket = require("ws");
const fs = require("fs-extra");

const FILE_PATH = "./pairs.json";
let knownPairs = [];

function loadExistingPairs() {
  if (fs.existsSync(FILE_PATH)) {
    try {
      knownPairs = JSON.parse(fs.readFileSync(FILE_PATH));
      console.log(`🔁 ${knownPairs.length} anciennes paires chargées depuis pairs.json`);
    } catch (err) {
      console.error("❌ Erreur de lecture de pairs.json :", err);
    }
  }
}

function saveNewPair(pair) {
  if (!knownPairs.find(p => p.name === pair.name)) {
    pair.timestamp = Date.now();
    knownPairs.push(pair);
    fs.writeFileSync(FILE_PATH, JSON.stringify(knownPairs, null, 2));
    console.log("🆕 Nouvelle paire indexée :", pair.name);
  }
}

function connectWebSocket() {
  const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

  ws.on("open", () => {
    console.log("✅ WebSocket connecté à Hyperliquid (backend)");

    ws.send(JSON.stringify({
      method: "subscribe",
      subscription: { type: "newPairs" }
    }));

    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ method: "ping" }));
      }
    }, 30000);
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.channel === "newPairs" && Array.isArray(msg.data)) {
        msg.data.forEach(saveNewPair);
      }
    } catch (err) {
      console.error("❌ Erreur traitement message WebSocket (backend) :", err);
    }
  });

  ws.on("close", () => {
    console.warn("🔌 WebSocket backend fermé. Reconnexion dans 5s...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ Erreur WebSocket backend :", err);
    ws.close();
  });
}

loadExistingPairs();
connectWebSocket();
