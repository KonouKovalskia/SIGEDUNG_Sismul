import { getParam, fetchCampusData, injectErrorState } from './utils.js';

async function init() {
  const id = getParam("id");
  if (!id) { location.href = "./index.html"; return; }

  let data;
  try {
    data = await fetchCampusData();
  } catch (e) {
    document.getElementById("loading").classList.add("done");
    injectErrorState(document.getElementById("sceneContainer"), "Tidak dapat memuat data. Periksa koneksi Anda.");
    return;
  }

  const b = data.buildings.find(x => x.id === id);
  if (!b) {
    document.getElementById("loading").classList.add("done");
    injectErrorState(document.getElementById("sceneContainer"), `Gedung dengan ID "${id}" tidak ditemukan.`);
    return;
  }

  document.getElementById("bldName").textContent = b.name;

  const img = document.getElementById("sceneImg");
  const loading = document.getElementById("loading");
  // Warm the first indoor scene while the user looks at the entrance.
  const f1 = b.floors[0];
  img.onload  = () => {
    loading.classList.add("done");
    const first = f1?.scenes?.[f1.startScene || "entrance"]?.img;
    if (first) new Image().src = first;
  };
  img.onerror = () => loading.classList.add("done");
  img.src = b.entrance.image;

  const encodedId = encodeURIComponent(b.id);
  const indoorUrl = `./indoor.html?id=${encodedId}&floor=1`;

  const upArrow = document.getElementById("aUp");
  upArrow.classList.remove("hidden");
  upArrow.onclick = () => location.href = indoorUrl;

  document.getElementById("btnDir").onclick = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.entrance.lat},${b.entrance.lng}`, "_blank");
  };

  document.getElementById("btnEnter").onclick = () => {
    location.href = indoorUrl;
  };
}

init();
