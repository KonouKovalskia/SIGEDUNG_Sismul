import { fetchCampusData, injectErrorState } from './utils.js';

const entranceUrl = b => `./entrance.html?id=${encodeURIComponent(b.id)}`;
// "ku2 01 06", "KU2-01-06" and "ku20106" all match the same room.
const norm = x => (x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sceneCount = b => b.floors.reduce((n, f) => n + Object.keys(f.scenes || {}).length, 0);

async function init() {
  let data;
  try {
    data = await fetchCampusData();
  } catch (e) {
    console.error("Failed to load campus.json:", e);
    injectErrorState(document.body, "Tidak dapat memuat campus.json. Periksa koneksi Anda.");
    return;
  }

  const first = data.buildings[0];
  const map = L.map("map", {
    center: [first?.location?.lat ?? -6.9734, first?.location?.lng ?? 107.6321],
    zoom: 18, zoomControl: false,
  });
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "© Esri", maxZoom: 22 }
  ).addTo(map);

  const bldList = document.getElementById("bldList");
  const searchQ = document.getElementById("searchQ");
  let markers = [];

  // Marker tap highlights its card (and vice versa) instead of opening a popup.
  function select(id, scroll = true) {
    bldList.querySelectorAll(".bld-card").forEach(c => c.classList.toggle("active", c.dataset.id === id));
    markers.forEach(m => m.getElement()?.querySelector(".mk-wrap")?.classList.toggle("active", m.bid === id));
    if (scroll) bldList.querySelector(`.bld-card[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function render(q) {
    q = norm(q);
    const rooms = !q ? [] : data.buildings.flatMap(b => b.floors.flatMap(f =>
      Object.entries(f.scenes || {})
        .filter(([sid, sc]) => norm(sid).includes(q) || norm(sc.name).includes(q))
        .map(([sid, sc]) => ({ b, f, sid, name: sc.name || sid }))));
    const buildings = data.buildings.filter(b => norm(b.name).includes(q) || rooms.some(r => r.b === b));

    markers.forEach(m => map.removeLayer(m));
    markers = buildings.map(b => {
      const icon = L.divIcon({
        html: `<div class="mk-wrap"><div class="mk-pill"><div class="mk-dot"></div>${b.name}</div><div class="mk-tail"></div></div>`,
        className: "", iconSize: [160, 44], iconAnchor: [80, 44],
      });
      const m = L.marker([b.location?.lat ?? b.entrance.lat, b.location?.lng ?? b.entrance.lng], { icon }).addTo(map);
      m.bid = b.id;
      m.on("click", () => { select(b.id); map.panTo(m.getLatLng()); });
      return m;
    });

    bldList.innerHTML = buildings.length || rooms.length ? "" : `<div class="bld-empty">Tidak ada gedung ditemukan.</div>`;
    buildings.forEach((b, i) => {
      const n = sceneCount(b);
      const card = document.createElement("a");
      card.className = "bld-card";
      card.href = entranceUrl(b);
      card.dataset.id = b.id;
      card.style.animationDelay = `${i * .05}s`;
      card.innerHTML = `
        <img class="bld-thumb" src="${b.thumbnail}" alt="" loading="lazy"/>
        <div class="bld-info">
          <div class="bld-name"></div>
          <div class="bld-meta">${b.floors.length} lantai · ${n} lokasi</div>
        </div>
        <span class="bld-go">Masuk <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>`;
      card.querySelector(".bld-name").textContent = b.name;
      card.addEventListener("mouseenter", () => select(b.id, false));
      bldList.appendChild(card);
    });

    rooms.slice(0, 12).forEach(r => {
      const card = document.createElement("a");
      card.className = "bld-card room-card";
      card.href = `./indoor.html?id=${encodeURIComponent(r.b.id)}&floor=${r.f.floor}&scene=${encodeURIComponent(r.sid)}`;
      card.innerHTML = `
        <div class="room-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M14 12h.01"/></svg></div>
        <div class="bld-info">
          <div class="bld-name"></div>
          <div class="bld-meta"></div>
        </div>
        <span class="bld-go">Lihat <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>`;
      card.querySelector(".bld-name").textContent = r.name;
      card.querySelector(".bld-meta").textContent = `${r.b.name} · ${r.f.name || "Lantai " + r.f.floor}`;
      card.addEventListener("mouseenter", () => select(r.b.id, false));
      bldList.appendChild(card);
    });
  }

  searchQ.addEventListener("input", e => render(e.target.value));
  render("");
}

init();
