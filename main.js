function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("pairs-list");
  const loader = document.getElementById("loader");
  const displayedPairs = new Set();

  function renderToken(symbol, name = symbol, imageUrl = 'hyp.png') {
    if (displayedPairs.has(symbol)) return;

    const card = document.createElement("div");
    card.className = "token-card";
    card.onclick = () => window.location.href = `/token.html?symbol=${symbol}`;

    const img = document.createElement("img");
    img.src = imageUrl;
    img.onerror = () => { img.src = 'hyp.png'; };

    const info = document.createElement("div");
    info.className = "token-info";
    info.innerHTML = `<strong>${name}</strong><br>$${symbol}`;

    card.appendChild(img);
    card.appendChild(info);
    list.insertBefore(card, list.firstChild);

    displayedPairs.add(symbol);
  }

  // Charger les anciennes paires depuis le fichier JSON
  fetch("pairs.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(pair => {
        const symbol = pair.name;
        const name = pair.tokenInfo?.name || symbol;
        const imageUrl = pair.tokenInfo?.imageUrl || 'hyp.png';
        renderToken(symbol, name, imageUrl);
      });
    });

  const socket = new WebSocket("wss://api.hyperliquid.xyz/ws");

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
      method: "subscribe",
      subscription: { type: "newPairs" }
    }));
  });

  socket.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.channel === "newPairs" && Array.isArray(msg.data)) {
        msg.data.forEach(pair => {
          const symbol = pair.name;
          const name = pair.metadata?.tokenInfo?.name || symbol;
          const imageUrl = pair.metadata?.tokenInfo?.imageUrl || 'hyp.png';
          renderToken(symbol, name, imageUrl);
        });
      }
    } catch (err) {
      console.error("Erreur WebSocket :", err);
    }
  });
});
