export const getParam = (k) => new URL(location.href).searchParams.get(k);

export const setParam = (k, v) => {
  const u = new URL(location.href);
  if (!v) u.searchParams.delete(k); else u.searchParams.set(k, v);
  history.replaceState({}, "", u);
};

export async function fetchCampusData() {
  const res = await fetch("./data/campus.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export function injectErrorState(container, msg, backUrl = "./index.html") {
  let el = container.querySelector(".error-state");
  if (!el) {
    el = document.createElement("div");
    el.className = "error-state visible";
    el.innerHTML = `
      <div class="error-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      </div>
      <div class="error-title">Gagal Memuat Data</div>
      <div class="error-msg">${msg}</div>
      <div class="error-actions">
        <button class="error-btn" onclick="location.href='${backUrl}'">← Kembali</button>
        <button class="error-btn primary" onclick="location.reload()">Coba Lagi</button>
      </div>`;
    container.appendChild(el);
  } else {
    el.querySelector(".error-msg").textContent = msg;
    el.classList.add("visible");
  }
}
