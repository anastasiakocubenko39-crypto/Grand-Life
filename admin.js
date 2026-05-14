// admin.js — код перенесено в // admin.js — Grand Life Admin (без ES modules)
// Авторизація через Supabase Magic Link (в admin.html)

let uploadedFiles     = [];
let currentListFilter = "all";
let allProps          = [];
let unsubscribe       = null;

// ── FIREBASE (глобальний через CDN) ──
const { initializeApp }   = window.firebaseApp;
const { getFirestore, collection, addDoc, deleteDoc, doc,
        updateDoc, query, orderBy, onSnapshot,
        serverTimestamp } = window.firebaseFirestore;

const firebaseConfig = {
  apiKey:            "AIzaSyATPexSn7etxoBsTsBd3JXND5R9MsrtvJk",
  authDomain:        "grand-life-7c3a9.firebaseapp.com",
  projectId:         "grand-life-7c3a9",
  storageBucket:     "grand-life-7c3a9.firebasestorage.app",
  messagingSenderId: "855282740287",
  appId:             "1:855282740287:web:10081c86ad3a0c9c235c8a"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── LOGIN ──
document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("passInput").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});

function doLogin() {
  const login = document.getElementById("loginInput").value.trim();
  const pass  = document.getElementById("passInput").value.trim();
  const err   = document.getElementById("loginError");

  if (login === ADMIN_LOGIN && pass === ADMIN_PASSWORD) {
    err.textContent = "";
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminPage").classList.remove("hidden");
    initAdmin();
  } else {
    err.textContent = "Невірний логін або пароль";
    shakeEl(document.getElementById("loginInput"));
    shakeEl(document.getElementById("passInput"));
  }
}

// ── INIT ──
function initAdmin() {
  setupDragDrop();
  const q = query(collection(db, "properties"), orderBy("addedAt", "desc"));
  unsubscribe = onSnapshot(q, snap => {
    allProps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateSidebarCount();
    renderList();
    updateStats();
  });
}

// ── SIDEBAR ──
const sidebarToggleBtn = document.getElementById("sidebarToggle");
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener("click", () => {
    document.querySelector(".admin-sidebar").classList.toggle("open");
  });
}

function showTab(name) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.add("hidden"));
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${name}`).classList.remove("hidden");
  document.getElementById(`nav-${name}`).classList.add("active");
  document.querySelector(".admin-sidebar").classList.remove("open");
}

// ── ТИП ──
function selectType(type) {
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById(`type-${type}`).classList.add("selected");
  document.getElementById("selectedType").value = type;
  const hints = {
    "Будинок":  "🏡 Буде додано в розділ «Будинки» та «Всі об'єкти»",
    "Квартира": "🏢 Буде додано в розділ «Квартири» та «Всі об'єкти»",
    "Ділянка":  "🌳 Буде додано в розділ «Ділянки» та «Всі об'єкти»",
    "Оренда":   "🔑 Буде додано в розділ «Оренда» та «Всі об'єкти»",
  };
  document.getElementById("typeHint").textContent = hints[type] || "";
  document.getElementById("roomsGroup").style.display = type === "Ділянка" ? "none" : "";
}

// ── ФАЙЛИ ──
function handleFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      uploadedFiles.push({ name: file.name, data: e.target.result, type: file.type });
      renderFilePreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderFilePreviews() {
  const preview = document.getElementById("mediaPreview");
  const hint    = document.querySelector(".media-upload-hint");
  preview.innerHTML = "";
  if (hint) hint.style.display = uploadedFiles.length > 0 ? "none" : "";

  uploadedFiles.forEach((f, i) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = f.type.startsWith("video/")
      ? `<video src="${f.data}" muted></video>`
      : `<img src="${f.data}" alt="${f.name}">`;
    const btn = document.createElement("button");
    btn.className = "preview-remove";
    btn.textContent = "×";
    btn.onclick = e => { e.stopPropagation(); uploadedFiles.splice(i, 1); renderFilePreviews(); };
    item.appendChild(btn);
    preview.appendChild(item);
  });
}

function setupDragDrop() {
  const area = document.getElementById("mediaArea");
  if (!area) return;
  area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("drag-over"); });
  area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
  area.addEventListener("drop", e => {
    e.preventDefault();
    area.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });
}

// ── ДОДАТИ ОБ'ЄКТ ──
async function submitProperty() {
  const type     = document.getElementById("selectedType").value;
  const title    = document.getElementById("f-title").value.trim();
  const location = document.getElementById("f-location").value.trim();
  const priceVal = document.getElementById("f-price").value.trim();
  const currency = document.getElementById("f-currency").value;
  const areaVal  = document.getElementById("f-area").value.trim();
  const areaUnit = document.getElementById("f-area-unit").value;
  const rooms    = document.getElementById("f-rooms").value.trim();
  const desc     = document.getElementById("f-description").value.trim();
  const urlImg   = document.getElementById("f-image-url").value.trim();

  if (!type)     { alert("Оберіть тип об'єкта!"); return; }
  if (!title)    { alert("Введіть назву!"); return; }
  if (!location) { alert("Введіть локацію!"); return; }

  let image = urlImg;
  if (uploadedFiles.length > 0) image = uploadedFiles[0].data;

  const btn = document.getElementById("addPropertyBtn");
  btn.textContent = "Зберігаємо...";
  btn.disabled = true;

  try {
    await addDoc(collection(db, "properties"), {
      title, type, location,
      price:       priceVal ? `${priceVal} ${currency}` : "",
      area:        areaVal  ? `${areaVal} ${areaUnit}` : "",
      rooms:       type === "Ділянка" ? "—" : (rooms || "—"),
      image:       image || "",
      description: desc,
      sold:        false,
      addedAt:     serverTimestamp()
    });

    const msg = document.getElementById("addSuccess");
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("hidden"), 3000);
    clearForm();

  } catch (e) {
    alert("Помилка збереження: " + e.message);
    console.error(e);
  } finally {
    btn.textContent = "✅ Додати об'єкт";
    btn.disabled = false;
  }
}

function clearForm() {
  document.getElementById("selectedType").value = "";
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("typeHint").textContent = "Оберіть тип — об'єкт потрапить у відповідний розділ";
  ["f-title","f-location","f-price","f-area","f-rooms","f-description","f-image-url"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  uploadedFiles = [];
  renderFilePreviews();
  const hint = document.querySelector(".media-upload-hint");
  if (hint) hint.style.display = "";
}

// ── СПИСОК ──
function filterList(type) {
  currentListFilter = type;
  document.querySelectorAll(".lf-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`lf-${type}`).classList.add("active");
  renderList();
}

function renderList() {
  const search   = (document.getElementById("listSearch")?.value || "").toLowerCase();
  const filtered = allProps.filter(p => {
    if (currentListFilter !== "all" && !(p.type||"").toLowerCase().includes(currentListFilter.toLowerCase())) return false;
    if (search && ![p.title,p.location,p.type].some(f=>(f||"").toLowerCase().includes(search))) return false;
    return true;
  });

  const list = document.getElementById("adminList");
  if (!list) return;
  list.innerHTML = "";

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:16px">📭</div><p>Об'єктів не знайдено</p></div>`;
    return;
  }

  filtered.forEach(item => {
    const div = document.createElement("div");
    div.className = `admin-item${item.sold ? " is-sold-item" : ""}`;

    const imgHtml = item.image
      ? `<img src="${item.image}" class="admin-item-img" alt="${item.title}" onerror="this.style.display='none'">`
      : `<div class="admin-item-img-placeholder">${getTypeIcon(item.type)}</div>`;

    div.innerHTML = `
      ${imgHtml}
      <div class="admin-item-info">
        <h4>${item.title}</h4>
        <span class="admin-item-type">${getTypeIcon(item.type)} ${item.type||"—"}</span>
        <div class="admin-item-meta">
          <span>📍 ${item.location||"—"}</span>
          <span>💰 ${item.price||"—"}</span>
          ${item.area ? `<span>📐 ${item.area}</span>` : ""}
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-item-sold ${item.sold ? 'is-sold' : ''}"
          onclick="toggleSold('${item.id}', ${!!item.sold})">
          ${item.sold ? "🔄 Зняти статус" : "✅ Продано"}
        </button>
        <button class="admin-item-del" onclick="deleteItem('${item.id}')">🗑 Видалити</button>
      </div>`;
    list.appendChild(div);
  });
}

// ── ПРОДАНО ──
async function toggleSold(id, currentlySold) {
  try {
    await updateDoc(doc(db, "properties", id), { sold: !currentlySold });
  } catch (e) {
    alert("Помилка: " + e.message);
  }
}

// ── ВИДАЛИТИ ──
async function deleteItem(id) {
  if (!confirm("Видалити цей об'єкт?")) return;
  try {
    await deleteDoc(doc(db, "properties", id));
  } catch (e) {
    alert("Помилка видалення: " + e.message);
  }
}

// ── СТАТИСТИКА ──
function updateStats() {
  const el = id => document.getElementById(id);
  if (el("stat-all"))   el("stat-all").textContent   = allProps.length;
  if (el("stat-house")) el("stat-house").textContent  = allProps.filter(p=>(p.type||"").toLowerCase().includes("будинок")).length;
  if (el("stat-apt"))   el("stat-apt").textContent    = allProps.filter(p=>(p.type||"").toLowerCase().includes("квартира")).length;
  if (el("stat-land"))  el("stat-land").textContent   = allProps.filter(p=>(p.type||"").toLowerCase().includes("ділянка")).length;
  if (el("stat-rent"))  el("stat-rent").textContent   = allProps.filter(p=>(p.type||"").toLowerCase().includes("оренда")).length;

  const recent = el("recentList");
  if (!recent) return;
  recent.innerHTML = "";
  allProps.slice(0, 5).forEach(p => {
    const d = document.createElement("div");
    d.className = "recent-item";
    d.innerHTML = `
      <div class="recent-icon">${getTypeIcon(p.type)}</div>
      <div class="recent-info"><strong>${p.title}</strong><span>📍 ${p.location||"—"}</span></div>
      <div class="recent-price">${p.price||"—"}</div>`;
    recent.appendChild(d);
  });
}

function updateSidebarCount() {
  const el = document.getElementById("sidebarCount");
  if (el) el.textContent = allProps.length;
}

function getTypeIcon(type) {
  const t = (type||"").toLowerCase();
  if (t.includes("будинок"))  return "🏡";
  if (t.includes("квартира")) return "🏢";
  if (t.includes("ділянка"))  return "🌳";
  if (t.includes("оренда"))   return "🔑";
  return "🏠";
}

function logout() { location.reload(); }

function shakeEl(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "shake 0.4s ease";
  setTimeout(() => el.style.animation = "", 400);
}admin.html
