// catalog.js — Grand Life — Всі об'єкти

const ITEMS_PER_PAGE = 12;
let currentPage    = 1;
let filteredData   = [];
let currentView    = 'grid';
let activeCategory = 'all';

const TYPE_MAP = {
  'будинок':  { label: 'Будинок',  icon: '🏡', page: 'houses.html' },
  'квартира': { label: 'Квартира', icon: '🏢', page: 'apartments.html' },
  'ділянка':  { label: 'Ділянка',  icon: '🌳', page: 'land.html' },
  'оренда':   { label: 'Оренда',   icon: '🔑', page: 'rent.html' },
};

// ── ДАНІ ──
function getAllProps() {
  return window._grandLifeProps || [];
}

function priceToUSD(str) {
  const num = parseInt((str||"").replace(/[^\d]/g,""))||0;
  const s = (str||"").toLowerCase();
  if (s.includes("€")||s.includes("eur")) return Math.round(num/0.93);
  if (s.includes("₴")||s.includes("грн")||s.includes("uah")) return Math.round(num/41);
  return num;
}

function parseNum(str) {
  return parseInt((str||"").replace(/[^\d]/g,""))||0;
}

function getTypeInfo(typeStr) {
  const t = (typeStr||"").toLowerCase();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (t.includes(key)) return val;
  }
  return { label: typeStr||"Об'єкт", icon: '🏠', page: 'catalog.html' };
}

// ── ЛІЧИЛЬНИКИ ВКЛАДОК ──
function updateCounts() {
  const all = getAllProps();
  document.getElementById("cnt-all").textContent = all.length;
  ["будинок","квартира","ділянка","оренда"].forEach(t => {
    const cnt = all.filter(p => (p.type||"").toLowerCase().includes(t)).length;
    const el  = document.getElementById(`cnt-${t}`);
    if (el) el.textContent = cnt;
  });
}

// ── КАТЕГОРІЯ ──
function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll(".cat-tab-btn").forEach(b => b.classList.remove("active"));
  const tab = document.getElementById(`tab-${cat}`);
  if (tab) tab.classList.add("active");
  applyFilters();
}

// ── ФІЛЬТРИ ──
function applyFilters() {
  const all    = getAllProps();
  const search = (document.getElementById("mainSearch").value||"").toLowerCase();
  const loc    = (document.getElementById("locSearch").value||"").toLowerCase();
  const pMin   = parseNum(document.getElementById("priceMin").value);
  const pMax   = parseNum(document.getElementById("priceMax").value)||Infinity;
  const aMin   = parseNum(document.getElementById("areaMin").value);
  const sort   = document.getElementById("sortSelect").value;

  filteredData = all.filter(h => {
    // Категорія
    if (activeCategory !== 'all' && !(h.type||"").toLowerCase().includes(activeCategory)) return false;
    // Ціна
    const usd = priceToUSD(h.price);
    if (pMin > 0 && usd < pMin) return false;
    if (usd > pMax) return false;
    // Площа
    if (aMin > 0 && parseNum(h.area) < aMin) return false;
    // Локація
    if (loc && !(h.location||"").toLowerCase().includes(loc)) return false;
    // Пошук по всьому
    if (search && ![h.title, h.location, h.description, h.type, h.price, h.area, h.rooms]
        .some(f => (f||"").toLowerCase().includes(search))) return false;
    return true;
  });

  // Сортування
  filteredData.sort((a, b) => {
    if (sort === "price_asc")  return priceToUSD(a.price) - priceToUSD(b.price);
    if (sort === "price_desc") return priceToUSD(b.price) - priceToUSD(a.price);
    if (sort === "area_asc")   return parseNum(a.area) - parseNum(b.area);
    if (sort === "area_desc")  return parseNum(b.area) - parseNum(a.area);
    return 0;
  });

  currentPage = 1;
  document.getElementById("countDisplay").textContent = filteredData.length;
  renderPage();
  renderPagination();
  updateCounts();
}

// ── РЕНДЕР КАРТОК ──
function renderPage() {
  const grid  = document.getElementById("housesGrid");
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const page  = filteredData.slice(start, start + ITEMS_PER_PAGE);
  grid.innerHTML = "";

  if (!page.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏠</div>
        <h3>Об'єктів не знайдено</h3>
        <p>Спробуйте змінити параметри пошуку</p>
      </div>`;
    return;
  }

  page.forEach((h, i) => {
    const info = getTypeInfo(h.type);
    const card = document.createElement("div");
    card.className = "house-card" + (h.sold ? " sold" : "");
    card.style.animationDelay = `${i * 0.05}s`;
    const soldOverlay = h.sold ? `
      <div class="sold-overlay">
        <span class="sold-badge">✓ Продано</span>
      </div>` : "";

    const usd = priceToUSD(h.price);
    const eur = usd > 0 ? Math.round(usd * 0.93) : 0;
    const uah = usd > 0 ? Math.round(usd * 41)   : 0;
    const allPrices = usd > 0
      ? `<div class="price-all-currencies">$${usd.toLocaleString("uk-UA")} &nbsp;·&nbsp; €${eur.toLocaleString("uk-UA")} &nbsp;·&nbsp; ${uah.toLocaleString("uk-UA")} ₴</div>`
      : "";

    const isLand = (h.type||"").toLowerCase().includes("ділянка");

    card.innerHTML = `
      ${soldOverlay}
      <div class="card-img-wrap">
        <img src="${h.image || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'}"
             alt="${h.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'">
        <div class="card-badges">
          <span class="badge badge-type">${info.icon} ${info.label}</span>
        </div>
        <div class="card-favorite" onclick="toggleFav(this)">🤍</div>
      </div>
      <div class="house-info">
        <h3>${h.title}</h3>
        <div class="house-location">📍 ${h.location || "—"}</div>
        <div class="house-price">${h.price || "Ціна за запитом"}</div>
        ${allPrices}
        <div class="house-specs">
          ${h.area  ? `<span class="spec-tag">📐 ${h.area}</span>` : ""}
          ${h.rooms && !isLand ? `<span class="spec-tag">🛏️ ${h.rooms}</span>` : ""}
        </div>
        <p class="house-desc">${h.description || ""}</p>
        <div class="card-actions">
          <button class="btn-contact" onclick="location.href='index.html#contacts'">📞 Зателефонувати</button>
          <a href="${info.page}" class="btn-details">Детальніше →</a>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ── ПАГІНАЦІЯ ──
function renderPagination() {
  const total = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const pag   = document.getElementById("pagination");
  pag.innerHTML = "";
  if (total <= 1) return;

  const mk = (txt, pg, dis) => {
    const b = document.createElement("button");
    b.className = "page-btn" + (pg === currentPage ? " active" : "");
    b.textContent = txt;
    b.disabled = dis;
    b.onclick = () => {
      currentPage = pg;
      renderPage();
      renderPagination();
      document.querySelector(".catalog-page").scrollIntoView({ behavior: "smooth" });
    };
    pag.appendChild(b);
  };

  mk("←", currentPage - 1, currentPage === 1);
  for (let i = 1; i <= total; i++) mk(i, i, false);
  mk("→", currentPage + 1, currentPage === total);
}

// ── ВИГЛЯД ──
function setView(type) {
  currentView = type;
  document.getElementById("housesGrid").classList.toggle("list-view", type === "list");
  document.getElementById("viewGrid").classList.toggle("active", type === "grid");
  document.getElementById("viewList").classList.toggle("active", type === "list");
}

// ── ОБРАНЕ ──
function toggleFav(el) {
  el.classList.toggle("liked");
  el.textContent = el.classList.contains("liked") ? "❤️" : "🤍";
}

// ── INIT ──
document.querySelectorAll(".sf-input").forEach(inp => {
  inp.addEventListener("input", applyFilters);
});


// Слухаємо Firebase — оновлення в реальному часі
