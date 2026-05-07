import { fetchCampusData, injectErrorState } from './utils.js';

const sidebar = document.getElementById("sidebar");
const collapseBtn = document.getElementById("collapseBtn");
const sheetHandle = document.getElementById("sheetHandle");
const mapArea = document.getElementById("mapArea");
const peekCount = document.getElementById("peekCount");

let isRail = false;
let isSheetOpen = false;
let leafMap = null;

const isMobile = () => window.innerWidth <= 820;

function applyMode() {
  if (isMobile()) {
    sheetHandle.style.display = "flex";
    collapseBtn.style.display = "none";
    sidebar.style.transform = "";
    if (leafMap) leafMap.zoomControl.setPosition("topright");
  } else {
    sheetHandle.style.display = "none";
    collapseBtn.style.display = "grid";
    sidebar.style.transform = "";
    sidebar.classList.remove("sheet-open");
    isSheetOpen = false;
    if (leafMap) leafMap.zoomControl.setPosition("topleft");
    requestAnimationFrame(syncBtnPos);
  }
}
applyMode();
requestAnimationFrame(() => requestAnimationFrame(() => {
  sidebar.classList.remove("no-transition");
}));
window.addEventListener("resize", applyMode);

function syncBtnPos() {
  const sbRect = sidebar.getBoundingClientRect();
  collapseBtn.style.left = (sbRect.left - 18) + "px";
}

let rafId = null;
function animateBtnPos(duration = 340) {
  const start = performance.now();
  function frame(now) {
    syncBtnPos();
    if (now - start < duration) rafId = requestAnimationFrame(frame);
    else syncBtnPos();
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}

collapseBtn.addEventListener("click", () => {
  isRail = !isRail;
  sidebar.classList.toggle("rail", isRail);
  collapseBtn.classList.toggle("is-rail", isRail);
  animateBtnPos();
  if (leafMap) setTimeout(() => leafMap.invalidateSize({ animate: true }), 340);
});

requestAnimationFrame(() => requestAnimationFrame(syncBtnPos));
window.addEventListener("resize", syncBtnPos);

sheetHandle.addEventListener("click", () => {
  isSheetOpen = !isSheetOpen;
  sidebar.classList.toggle("sheet-open", isSheetOpen);
  sidebar.style.transform = "";
});
mapArea.addEventListener("click", () => {
  if (!isMobile() || !isSheetOpen) return;
  isSheetOpen = false;
  sidebar.classList.remove("sheet-open");
  sidebar.style.transform = "";
});

let ty = 0;
sidebar.addEventListener("touchstart", e => { ty = e.touches[0].clientY; }, { passive: true });
sidebar.addEventListener("touchend", e => {
  if (!isMobile()) return;
  const dy = e.changedTouches[0].clientY - ty;
  if (dy > 48)  { isSheetOpen = false; sidebar.classList.remove("sheet-open"); sidebar.style.transform = ""; }
  if (dy < -48) { isSheetOpen = true;  sidebar.classList.add("sheet-open"); sidebar.style.transform = ""; }
}, { passive: true });

new ResizeObserver(() => {
  if (leafMap) leafMap.invalidateSize({ animate: false });
}).observe(mapArea);

async function init() {
  let data;
  try {
    data = await fetchCampusData();
  } catch (e) {
    console.error("Failed to load campus.json:", e);
    const container = document.getElementById("bldList");
    container.innerHTML = "";
    injectErrorState(container, "Tidak dapat memuat campus.json. Periksa koneksi Anda.", "./index.html");
    return;
  }

  const first = data.buildings[0];
  const clat  = first?.location?.lat ?? -6.9734;
  const clng  = first?.location?.lng ?? 107.6321;

  leafMap = L.map("map", { center:[clat, clng], zoom: 18, zoomControl: true });

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "© Esri", maxZoom: 22 }
  ).addTo(leafMap);

  applyMode();

  const bldList   = document.getElementById("bldList");
  const railList  = document.getElementById("railList");
  const searchQ   = document.getElementById("searchQ");
  const secLabel  = document.getElementById("sectionLabel");
  let markers     =[];

  function buildMarkers(buildings) {
    markers.forEach(m => leafMap.removeLayer(m));
    markers =[];
    buildings.forEach(b => {
      const lat = b.location?.lat ?? b.entrance.lat;
      const lng = b.location?.lng ?? b.entrance.lng;
      const icon = L.divIcon({
        html: `<div class="mk-wrap">
                 <div class="mk-pill"><div class="mk-dot"></div>${b.name}</div>
                 <div class="mk-tail"></div>
               </div>`,
        className: "", iconSize: [160, 48], iconAnchor: [80, 48], popupAnchor: [0, -52],
      });
      const m = L.marker([lat, lng], { icon }).addTo(leafMap);
      m.bindPopup(`
        <div class="map-popup">
          <div class="mp-tag">Gedung Kampus</div>
          <div class="mp-name">${b.name}</div>
          <button class="mp-btn" onclick="location.href='./entrance.html?id=${encodeURIComponent(b.id)}'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Lihat Entrance
          </button>
        </div>`, { maxWidth: 240 }
      );
      markers.push(m);
    });
  }

  function buildList(buildings, isFiltered) {
    bldList.innerHTML = "";
    railList.innerHTML = "";
    const count = buildings.length;
    peekCount.textContent = count ? `${count} gedung` : "";
    secLabel.textContent = !isFiltered ? "Semua Gedung" : (count ? `${count} Gedung Ditemukan` : "Tidak Ditemukan");

    if (!count) {
      bldList.innerHTML = `<div class="sb-empty">Tidak ada gedung ditemukan.</div>`;
      return;
    }

    buildings.forEach((b, i) => {
      const card = document.createElement("a");
      card.className = "bld-card";
      card.href = `./entrance.html?id=${encodeURIComponent(b.id)}`;
      card.style.animationDelay = `${i * .04}s`;
      card.innerHTML = `
        <img class="bld-thumb" src="${b.thumbnail}" alt="${b.name}" loading="lazy"/>
        <div class="bld-info">
          <div class="bld-name">${b.name}</div>
          <div class="bld-meta">${b.entrance.lat.toFixed(4)}, ${b.entrance.lng.toFixed(4)}</div>
        </div>
        <svg class="bld-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`;
      bldList.appendChild(card);

      const ri = document.createElement("a");
      ri.className = "rail-item";
      ri.href = `./entrance.html?id=${encodeURIComponent(b.id)}`;
      ri.setAttribute("data-name", b.name);
      ri.innerHTML = `<img src="${b.thumbnail}" alt="${b.name}" loading="lazy"/>`;
      railList.appendChild(ri);
    });
  }

  function render(f) {
    const q = (f || "").trim().toLowerCase();
    const isFiltered = q.length > 0;
    const buildings = data.buildings.filter(b => (b.name || "").toLowerCase().includes(q));
    buildList(buildings, isFiltered);
    buildMarkers(buildings);
  }

  searchQ.addEventListener("input", e => render(e.target.value));
  render("");
}

init();
