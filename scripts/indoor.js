import { getParam, setParam, fetchCampusData, injectErrorState } from './utils.js';

// Started preloads, deduped across scene changes. Started ≠ finished, so
// goScene checks img.complete instead of this set before skipping the shimmer.
const preloadCache = new Set();
function preloadImage(src, priority = "auto") {
  if (!src || preloadCache.has(src)) return;
  preloadCache.add(src);
  const img = new Image();
  img.fetchPriority = priority;
  img.src = src;
}
function preloadAdjacent(scenes, currentId) {
  const s = scenes[currentId];
  if (!s) return;
  ["up","down","left","right"].forEach(dir => {
    if (s[dir]) preloadImage(scenes[s[dir]]?.img, "high");
  });
  // Then the rest of the floor, low priority, once the browser is idle.
  // ponytail: whole floor (~2 MB), switch to 2-hop neighbours if floors grow past ~40 scenes
  (window.requestIdleCallback || setTimeout)(() =>
    Object.values(scenes).forEach(x => preloadImage(x.img, "low")));
}

// Location list: a floating dropdown under the "Lokasi" button.
const scenePanel = document.getElementById("scenePanel");
const locBtn = document.getElementById("locBtn");
function setPanel(open) {
  scenePanel.hidden = !open;
  locBtn.setAttribute("aria-expanded", String(open));
  if (open) scenePanel.querySelector(".sc-btn.active")?.scrollIntoView({ block: "nearest" });
}
locBtn.addEventListener("click", () => setPanel(scenePanel.hidden));
document.addEventListener("click", e => {
  if (!scenePanel.hidden && !e.target.closest(".tools")) setPanel(false);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") setPanel(false); });

async function run() {
  const id = getParam("id");
  if (!id) { location.href = "./index.html"; return; }

  const floorQ = Number(getParam("floor") || 1);

  let data;
  try {
    data = await fetchCampusData();
  } catch (e) {
    injectErrorState(document.querySelector(".view-area"), "Tidak dapat memuat campus.json. Periksa koneksi Anda.");
    return;
  }

  const b = data.buildings.find(x => x.id === id);
  if (!b) {
    injectErrorState(document.querySelector(".view-area"), `Gedung dengan ID "${id}" tidak ditemukan.`);
    return;
  }

  document.getElementById("tbName").textContent = b.name;
  document.getElementById("toEntrance").href = `./entrance.html?id=${encodeURIComponent(b.id)}`;

  const floorSel = document.getElementById("floorSel");
  floorSel.innerHTML = b.floors.map(f => `<option value="${f.floor}">${f.name || "Lantai " + f.floor}</option>`).join("");

  const validFloor = b.floors.find(f => f.floor === floorQ) ? floorQ : b.floors[0].floor;
  floorSel.value = String(validFloor);

  const viewImg = document.getElementById("viewImg");
  const viewLoading = document.getElementById("viewLoading");
  const spList = document.getElementById("spList");
  const hudName = document.getElementById("hudName");
  const hudId = document.getElementById("hudId");

  const aUp = document.getElementById("aUp"), lUp = document.getElementById("lUp");
  const aDown = document.getElementById("aDown"), lDown = document.getElementById("lDown");
  const aLeft = document.getElementById("aLeft"), lLeft = document.getElementById("lLeft");
  const aRight = document.getElementById("aRight"), lRight = document.getElementById("lRight");

  const getFloor = n => b.floors.find(x => x.floor === Number(n));
  let currentScene = "";

  function applyArrow(btn, lbl, targetId, name, goFn) {
    if (!targetId) { btn.classList.add("hidden"); btn.onclick = null; return; }
    btn.classList.remove("hidden");
    lbl.textContent = name || targetId;
    btn.onclick = () => goFn(targetId);
  }

  function setActive(sid) {
    spList.querySelectorAll(".sc-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.sid === sid));
  }

  function buildSceneList(scenes, goFn) {
    spList.innerHTML = "";
    const entries = Object.entries(scenes || {});
    entries.sort((a, b) => {
      if (a[0] === "entrance") return -1;
      if (b[0] === "entrance") return 1;
      return (a[1].name || a[0]).localeCompare(b[1].name || b[0]);
    });
    for (const [sid, s] of entries) {
      const btn = document.createElement("button");
      btn.className = "sc-btn";
      btn.dataset.sid = sid;
      btn.innerHTML = `<span class="sc-btn-name">${s.name || sid}</span><span class="sc-btn-id">${sid}</span>`;
      btn.onclick = () => { goFn(sid); setPanel(false); };
      spList.appendChild(btn);
    }
  }

  function loadFloor(floorNum) {
    const f = getFloor(floorNum);
    if (!f) return;
    const scenes = f.scenes || null;
    const startScene = f.startScene || "entrance";
    const sceneQ = scenes?.[getParam("scene")] ? getParam("scene") : startScene;

    function goScene(sid) {
      const s = scenes[sid];
      if (!s) return;
      currentScene = sid;
      setParam("scene", sid);
      setActive(sid);
      hudName.textContent = s.name || sid;
      hudId.textContent = s.name && s.name !== sid ? sid : "";

      // Shimmer whenever the image isn't decoded yet — including a preload
      // that started but hasn't finished. Stale loads from fast clicking are ignored.
      const ni = new Image();
      const show = () => {
        if (currentScene !== sid) return;
        if (ni.naturalWidth) viewImg.src = ni.src;
        viewImg.style.opacity = "1";
        viewLoading.classList.add("done");
      };
      ni.onload = show;
      ni.onerror = show;
      ni.src = s.img;
      if (!ni.complete) {
        viewImg.style.opacity = "0";
        viewLoading.classList.remove("done");
      }
      applyArrow(aUp, lUp, s.up, scenes[s.up]?.name, goScene);
      applyArrow(aDown, lDown, s.down, scenes[s.down]?.name, goScene);
      applyArrow(aLeft, lLeft, s.left, scenes[s.left]?.name, goScene);
      applyArrow(aRight, lRight, s.right, scenes[s.right]?.name, goScene);
      preloadAdjacent(scenes, sid);
    }

    buildSceneList(scenes, goScene);
    goScene(sceneQ);

    if (loadFloor._keyHandler) window.removeEventListener("keydown", loadFloor._keyHandler);
    loadFloor._keyHandler = e => {
      const s = scenes[currentScene]; if (!s) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup"    || k === "w") { e.preventDefault(); if (s.up)    goScene(s.up); }
      if (k === "arrowdown"  || k === "s") { e.preventDefault(); if (s.down)  goScene(s.down); }
      if (k === "arrowleft"  || k === "a") { e.preventDefault(); if (s.left)  goScene(s.left); }
      if (k === "arrowright" || k === "d") { e.preventDefault(); if (s.right) goScene(s.right); }
    };
    window.addEventListener("keydown", loadFloor._keyHandler);
  }

  floorSel.onchange = () => {
    setParam("floor", floorSel.value);
    setParam("scene", "");
    loadFloor(floorSel.value);
  };
  loadFloor(validFloor);
}

run();
