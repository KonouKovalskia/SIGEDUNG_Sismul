import { getParam, setParam, fetchCampusData, injectErrorState } from './utils.js';

const preloadCache = new Set();
function preloadImage(src) {
  if (!src || preloadCache.has(src)) return;
  preloadCache.add(src);
  const img = new Image();
  img.src = src;
}
function preloadAdjacent(scenes, currentId) {
  const s = scenes[currentId];
  if (!s) return;
  ["up","down","left","right"].forEach(dir => {
    if (s[dir]) preloadImage(scenes[s[dir]]?.img);
  });
}

const scenePanel = document.getElementById("scenePanel");
const panelCollapseBtn = document.getElementById("panelCollapseBtn");
const mobilePanelToggle = document.getElementById("mobilePanelToggle");
let isPanelCollapsed = false;
let rafId = null;

function syncBtnPos() {
  const r = scenePanel.getBoundingClientRect();
  panelCollapseBtn.style.left = r.right + "px";
}

function animateBtnPos(duration = 300) {
  const start = performance.now();
  function frame(now) {
    syncBtnPos();
    if (now - start < duration) rafId = requestAnimationFrame(frame);
    else syncBtnPos();
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}

panelCollapseBtn.addEventListener("click", () => {
  isPanelCollapsed = !isPanelCollapsed;
  scenePanel.classList.toggle("collapsed", isPanelCollapsed);
  panelCollapseBtn.classList.toggle("is-collapsed", isPanelCollapsed);
  animateBtnPos();
});

const COLLAPSED_H = 48;
let isMobilePanelCollapsed = false; 

function initPanelHeight() {
  if (window.innerWidth > 720) {
    scenePanel.style.height = "";
    return;
  }
  scenePanel.classList.remove("mobile-collapsed");
  isMobilePanelCollapsed = false;
  scenePanel.style.height = "auto";
  const expandedPanelH = Math.min(scenePanel.scrollHeight, Math.round(window.innerHeight * 0.42));
  scenePanel.style.height = expandedPanelH + "px";
}

mobilePanelToggle.addEventListener("click", () => {
  isMobilePanelCollapsed = !isMobilePanelCollapsed;
  if (isMobilePanelCollapsed) {
    scenePanel.classList.add("mobile-collapsed");
    scenePanel.style.height = COLLAPSED_H + "px";
  } else {
    scenePanel.style.visibility = "hidden";
    scenePanel.style.height = "auto";
    const naturalH = Math.min(scenePanel.scrollHeight, Math.round(window.innerHeight * 0.42));
    scenePanel.style.height = COLLAPSED_H + "px";
    scenePanel.style.visibility = "";
    scenePanel.getBoundingClientRect(); // force reflow
    scenePanel.classList.remove("mobile-collapsed");
    scenePanel.style.height = naturalH + "px";
  }
});

window.addEventListener("resize", () => {
  initPanelHeight();
  if (window.innerWidth > 720) {
    syncBtnPos();
    if (isMobilePanelCollapsed) {
      isMobilePanelCollapsed = false;
      scenePanel.classList.remove("mobile-collapsed");
    }
  }
});

requestAnimationFrame(() => requestAnimationFrame(syncBtnPos));

async function run() {
  const id = getParam("id");
  // BUG 3 FIX: redirect if no id, same as entrance.js
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
  document.getElementById("spTitle").textContent = b.name;
  document.getElementById("mobilePanelLabel").textContent = b.name;
  document.getElementById("toEntrance").href = `./entrance.html?id=${encodeURIComponent(b.id)}`;

  const floorSel = document.getElementById("floorSel");
  floorSel.innerHTML = b.floors.map(f => `<option value="${f.floor}">${f.name || "Lantai " + f.floor}</option>`).join("");

  // BUG 4 FIX: clamp to a valid floor — if ?floor=99 has no match, use first available
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
    if (isMobilePanelCollapsed) return;
    const active = spList.querySelector(`.sc-btn[data-sid="${sid}"]`);
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function buildSceneList(scenes, goFn) {
    spList.innerHTML = "";
    const entries = Object.entries(scenes || {});
    entries.sort((a, b) => {
      if (a[0] === "entrance") return -1;
      if (b[0] === "entrance") return 1;
      return (a[1].name || a[0]).localeCompare(b[1].name || b[0]);
    });
    for (const[sid, s] of entries) {
      const btn = document.createElement("button");
      btn.className = "sc-btn";
      btn.dataset.sid = sid;
      btn.innerHTML = `<span class="sc-btn-name">${s.name || sid}</span><span class="sc-btn-id">${sid}</span>`;
      btn.onclick = () => goFn(sid);
      spList.appendChild(btn);
    }
  }

  function loadFloor(floorNum) {
    const f = getFloor(floorNum);
    if (!f) return;
    const scenes = f.scenes || null;
    const startScene = f.startScene || "entrance";
    const sceneQ = getParam("scene") || startScene;

    function goScene(sid) {
      const s = scenes[sid];
      if (!s) return;
      currentScene = sid;
      setParam("scene", sid);
      setActive(sid);
      hudName.textContent = s.name || sid;
      hudId.textContent = sid;
      viewImg.style.opacity = "0";
      viewLoading.classList.remove("done");
      
      const ni = new Image();
      ni.onload = () => { viewImg.src = ni.src; viewImg.style.opacity = "1"; viewLoading.classList.add("done"); };
      ni.onerror = () => { viewImg.style.opacity = "1"; viewLoading.classList.add("done"); };
      ni.src = s.img;
      
      applyArrow(aUp, lUp, s.up, scenes[s.up]?.name, goScene);
      applyArrow(aDown, lDown, s.down, scenes[s.down]?.name, goScene);
      applyArrow(aLeft, lLeft, s.left, scenes[s.left]?.name, goScene);
      applyArrow(aRight, lRight, s.right, scenes[s.right]?.name, goScene);
      preloadAdjacent(scenes, sid);
    }

    buildSceneList(scenes, goScene);
    goScene(sceneQ);
    requestAnimationFrame(() => initPanelHeight());

    if (loadFloor._keyHandler) window.removeEventListener("keydown", loadFloor._keyHandler);
    loadFloor._keyHandler = e => {
      const s = scenes[currentScene]; if (!s) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") { e.preventDefault(); if (s.up) goScene(s.up); }
      if (k === "arrowdown" || k === "s") { e.preventDefault(); if (s.down) goScene(s.down); }
      if (k === "arrowleft" || k === "a") { e.preventDefault(); if (s.left) goScene(s.left); }
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
