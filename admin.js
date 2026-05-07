// admin.js — Grand Life Admin Panel

// ── НАЛАШТУВАННЯ ──
const ADMIN_LOGIN    = "admin";
const ADMIN_PASSWORD = "grandlife2025";
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";
const ADMIN_EMAIL         = "your@email.com";

let verifyCode = "";
let uploadedFiles = [];
let activeListFilter = "all";

// ── EMAILJS INIT ──
if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ── LOGIN ──
document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("passInput").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

function doLogin() {
  const login = document.getElementById("loginInput").value.trim();
  const pass  = document.getElementById("passInput").value.trim();
  const err   = document.getElementById("loginError");

  if (login === ADMIN_LOGIN && pass === ADMIN_PASSWORD) {
    err.textContent = "";
    sendVerifyCode();
  } else {
    err.textContent = "Невірний логін або пароль";
    shake(document.getElementById("loginInput"));
    shake(document.getElementById("passInput"));
  }
}

// ── VERIFY ──
function sendVerifyCode() {
  verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("verifyPage").classList.remove("hidden");
  document.getElementById("codeInput").value = "";
  document.getElementById("verifyError").textContent = "";

  const hint = document.getElementById("verifyHint");

  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    hint.textContent = `⚠️ EmailJS не налаштовано. Тестовий код: ${verifyCode}`;
    return;
  }

  hint.textContent = "Надсилаємо код...";
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: ADMIN_EMAIL, code: verifyCode,
    time: new Date().toLocaleTimeString("uk-UA")
  }).then(() => {
    hint.textContent = "✅ Код надіслано на вашу пошту";
  }).catch(() => {
    hint.textContent = `⚠️ Помилка. Код: ${verifyCode}`;
  });
}

document.getElementById("verifyBtn").addEventListener("click", () => {
  const code = document.getElementById("codeInput").value.trim();
  const err  = document.getElementById("verifyError");
  if (code === verifyCode) {
    document.getElementById("verifyPage").classList.add("hidden");
    document.getElementById("adminPage").classList.remove("hidden");
    initAdmin();
  } else {
    err.textContent = "Невірний код";
    shake(document.getElementById("codeInput"));
  }
});

document.getElementById("resendBtn").addEventListener("click", sendVerifyCode);

// ── INIT ADMIN ──
function initAdmin() {
  updateSidebarCount();
  renderList();
  updateStats();
  setupDragDrop();
}

// ── SIDEBAR TOGGLE MOBILE ──
const sidebarToggleBtn = document.getElementById("sidebarToggle");
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener("click", () => {
    document.querySelector(".admin-sidebar").classList.toggle("open");
  });
}

// ── TABS ──
function showTab(name) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.add("hidden"));
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${name}`).classList.remove("hidden");
  document.getElementById(`nav-${name}`).classList.add("active");
  if (name === "list") renderList();
  if (name === "stats") updateStats();
  document.querySelector(".admin-sidebar").classList.remove("open");
}

// ── ТИП ОБ'ЄКТА ──
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
  document.getElementById("typeHint").textContent = hints[type];

  // Ховаємо кімнати для ділянок
  document.getElementById("roomsGroup").style.display = type === "Ділянка" ? "none" : "";
}

// ── ЗАВАНТАЖЕННЯ ФАЙЛІВ ──
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

  if (uploadedFiles.length > 0) {
    hint.style.display = "none";
  } else {
    hint.style.display = "";
    return;
  }

  uploadedFiles.forEach((f, i) => {
    const item = document.createElement("div");
    item.className = "preview-item";

    if (f.type.startsWith("video/")) {
      item.innerHTML = `<video src="${f.data}" muted></video>`;
    } else {
      item.innerHTML = `<img src="${f.data}" alt="${f.name}">`;
    }

    const btn = document.createElement("button");
    btn.className = "preview-remove";
    btn.textContent = "×";
    btn.onclick = (e) => {
      e.stopPropagation();
      uploadedFiles.splice(i, 1);
      renderFilePreviews();
    };

    item.appendChild(btn);
    preview.appendChild(item);
  });
}

// Drag & Drop
function setupDragDrop() {
  const area = document.getElementById("mediaArea");
  area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("drag-over"); });
  area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
  area.addEventListener("drop", e => {
    e.preventDefault();
    area.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });
}

// ── ДОДАТИ ОБ'ЄКТ ──
function addProperty() {
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

  if (!type) { alert("Оберіть тип об'єкта!"); return; }
  if (!title) { alert("Введіть назву об'єкта!"); return; }
  if (!location) { alert("Введіть локацію!"); return; }

  // Фото: спочатку завантажений файл, потім URL
  let image = urlImg;
  if (uploadedFiles.length > 0) {
    image = uploadedFiles[0].data; // base64
  }

  const newProp = {
    title,
    type,
    location,
    price:       priceVal ? `${priceVal} ${currency}` : "",
    area:        areaVal  ? `${areaVal} ${areaUnit}` : "",
    rooms:       type === "Ділянка" ? "—" : (rooms || "—"),
    image,
    description: desc,
    addedAt:     Date.now()
  };

  const props = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  props.unshift(newProp);
  localStorage.setItem("grandLifeProperties", JSON.stringify(props));

  // Успіх
  const msg = document.getElementById("addSuccess");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 3000);

  clearForm();
  updateSidebarCount();
  updateStats();
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
  document.querySelector(".media-upload-hint").style.display = "";
}

// ── СПИСОК ──
let currentListFilter = "all";

function filterList(type) {
  currentListFilter = type;
  document.querySelectorAll(".lf-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`lf-${type}`).classList.add("active");
  renderList();
}

function renderList() {
  const props  = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  const search = (document.getElementById("listSearch")?.value || "").toLowerCase();

  const filtered = props.filter(p => {
    if (currentListFilter !== "all" && !(p.type||"").toLowerCase().includes(currentListFilter.toLowerCase())) return false;
    if (search && ![p.title,p.location,p.type].some(f => (f||"").toLowerCase().includes(search))) return false;
    return true;
  });

  const list = document.getElementById("adminList");
  list.innerHTML = "";

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:16px">📭</div>
      <p>Об'єктів не знайдено</p>
    </div>`;
    return;
  }

  filtered.forEach((item, i) => {
    const realIndex = props.indexOf(item);
    const div = document.createElement("div");
    div.className = "admin-item";

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
        <button class="admin-item-del" onclick="deleteProperty(${realIndex})">🗑 Видалити</button>
      </div>`;
    list.appendChild(div);
  });
}

function getTypeIcon(type) {
  const t = (type||"").toLowerCase();
  if (t.includes("будинок")) return "🏡";
  if (t.includes("квартира")) return "🏢";
  if (t.includes("ділянка")) return "🌳";
  if (t.includes("оренда")) return "🔑";
  return "🏠";
}

function deleteProperty(index) {
  if (!confirm("Видалити цей об'єкт?")) return;
  const props = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  props.splice(index, 1);
  localStorage.setItem("grandLifeProperties", JSON.stringify(props));
  renderList();
  updateSidebarCount();
  updateStats();
}

// ── СТАТИСТИКА ──
function updateStats() {
  const props = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  document.getElementById("stat-all").textContent  = props.length;
  document.getElementById("stat-house").textContent = props.filter(p => (p.type||"").toLowerCase().includes("будинок")).length;
  document.getElementById("stat-apt").textContent   = props.filter(p => (p.type||"").toLowerCase().includes("квартира")).length;
  document.getElementById("stat-land").textContent  = props.filter(p => (p.type||"").toLowerCase().includes("ділянка")).length;
  document.getElementById("stat-rent").textContent  = props.filter(p => (p.type||"").toLowerCase().includes("оренда")).length;

  const recent = document.getElementById("recentList");
  recent.innerHTML = "";
  props.slice(0, 5).forEach(p => {
    const d = document.createElement("div");
    d.className = "recent-item";
    d.innerHTML = `
      <div class="recent-icon">${getTypeIcon(p.type)}</div>
      <div class="recent-info">
        <strong>${p.title}</strong>
        <span>📍 ${p.location||"—"}</span>
      </div>
      <div class="recent-price">${p.price||"—"}</div>`;
    recent.appendChild(d);
  });
}

function updateSidebarCount() {
  const props = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  document.getElementById("sidebarCount").textContent = props.length;
}

// ── LOGOUT ──
function logout() {
  location.reload();
}

// ── SHAKE ──
function shake(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "shake 0.4s ease";
  setTimeout(() => el.style.animation = "", 400);
}