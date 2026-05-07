// rent.js — Grand Life — Оренда

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let filteredData = [];
let currentView  = 'grid';
let currentCurrency = 'USD';
let selectedLocations = [];

const RATES   = { USD: 1, EUR: 0.93, UAH: 41 };
const SYMBOLS = { USD: '$', EUR: '€', UAH: '₴' };

// ── НАСЕЛЕНІ ПУНКТИ УКРАЇНИ ──
const UA_LOCATIONS = [
  "Київ","Бровари","Бориспіль","Вишгород","Ірпінь","Буча","Гостомель","Ворзель",
  "Клавдієво","Немішаєве","Біла Церква","Васильків","Фастів","Обухів","Переяслав",
  "Борщагівка","Петропавлівська Борщагівка","Чабани","Крюківщина","Вита Поштова",
  "Тарасівка","Проців","Підгірці","Гореничі","Коцюбинське","Лебедівка","Димер",
  "Нові Петрівці","Старі Петрівці","Мощун","Козаровичі","Сухолуччя","Лютіж",
  "Українка","Баришівка","Березань","Яготин","Кагарлик","Миронівка","Ржищів",
  "Богуслав","Рокитне","Вінниця","Жмеринка","Могилів-Подільський","Хмільник",
  "Луцьк","Ковель","Нововолинськ","Дніпро","Кривий Ріг","Нікополь","Павлоград",
  "Краматорськ","Слов'янськ","Житомир","Бердичів","Коростень","Ужгород","Мукачево",
  "Запоріжжя","Мелітополь","Бердянськ","Івано-Франківськ","Калуш","Коломия",
  "Кропивницький","Олександрія","Львів","Дрогобич","Стрий","Червоноград",
  "Трускавець","Борислав","Самбір","Яворів","Золочів","Миколаїв","Первомайськ",
  "Одеса","Чорноморськ","Ізмаїл","Білгород-Дністровський","Южне","Полтава",
  "Кременчук","Лубни","Миргород","Рівне","Дубно","Острог","Суми","Конотоп",
  "Шостка","Тернопіль","Чортків","Харків","Лозова","Чугуїв","Херсон",
  "Хмельницький","Кам'янець-Подільський","Шепетівка","Черкаси","Умань",
  "Золотоноша","Сміла","Канів","Корсунь-Шевченківський","Чернівці","Чернігів",
  "Ніжин","Прилуки","Бахмач","Нова Каховка","Енергодар","Мукачево","Бориспільський район",
  "Вишгородський район","Броварський район","Бучанський район","Обухівський район",
  "Фастівський район","Васильківський район","Білоцерківський район",
  "Переяславський район","Яготинський район","Баришівський район"
];

// ── ВАЛЮТА ──
function setCurrency(cur) {
  currentCurrency = cur;
  document.getElementById("curLabel").textContent = cur;
  document.querySelectorAll(".cur-tab").forEach(b => {
    b.classList.toggle("active", b.textContent.includes(cur));
  });
  const hints = {
    USD: "1 $ ≈ 41 ₴ ≈ 0.93 €",
    EUR: "1 € ≈ 44 ₴ ≈ 1.07 $",
    UAH: "1 000 ₴ ≈ 24 $ ≈ 22 €"
  };
  document.getElementById("priceHint").textContent = hints[cur];
}

function priceToUSD(priceStr) {
  const num = parseInt((priceStr || "").toString().replace(/[^\d]/g, "")) || 0;
  const str = (priceStr || "").toString().toLowerCase();
  if (str.includes("€") || str.includes("eur")) return Math.round(num / RATES.EUR);
  if (str.includes("₴") || str.includes("грн") || str.includes("uah")) return Math.round(num / RATES.UAH);
  return num;
}

// ── ПОШУК ЛОКАЦІЙ ──
function filterLocationSuggestions() {
  const q   = (document.getElementById("locationSearch").value || "").toLowerCase().trim();
  const box = document.getElementById("locationSuggestions");
  box.innerHTML = "";
  if (!q) return;

  const matches = UA_LOCATIONS
    .filter(l => l.toLowerCase().includes(q) && !selectedLocations.includes(l))
    .slice(0, 10);

  if (matches.length === 0) {
    box.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:8px 0">Не знайдено — буде застосовано текстовий пошук</p>`;
    return;
  }

  matches.forEach(loc => {
    const item = document.createElement("div");
    item.className = "check-item";
    item.style.cursor = "pointer";
    item.innerHTML = `<span style="color:var(--text)">${loc}</span>`;
    item.onclick = () => addLocation(loc);
    box.appendChild(item);
  });
}

function addLocation(loc) {
  if (!selectedLocations.includes(loc)) {
    selectedLocations.push(loc);
    document.getElementById("locationSearch").value = "";
    document.getElementById("locationSuggestions").innerHTML = "";
    renderSelectedLocations();
    applyFilters();
  }
}

function removeLocation(loc) {
  selectedLocations = selectedLocations.filter(l => l !== loc);
  renderSelectedLocations();
  applyFilters();
}

function renderSelectedLocations() {
  const box = document.getElementById("selectedLocations");
  box.innerHTML = "";
  selectedLocations.forEach(loc => {
    const tag = document.createElement("div");
    tag.className = "active-tag";
    tag.style.cssText = "font-size:12px;padding:3px 10px;cursor:default";
    tag.innerHTML = `${loc} <button onclick="removeLocation('${loc.replace(/'/g,"\\'")}')">×</button>`;
    box.appendChild(tag);
  });
  const btn = document.getElementById("btnLocation");
  if (btn) {
    if (selectedLocations.length > 0) {
      btn.classList.add("active");
      btn.innerHTML = `📍 ${selectedLocations.length} район(и) <span class="arrow">▼</span>`;
    } else {
      btn.classList.remove("active");
      btn.innerHTML = `📍 Район <span class="arrow">▼</span>`;
    }
  }
}

// ── ДАНІ ──
function getAll_Rent() {
  const all = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];
  return all.filter(p => p.type && p.type.toLowerCase().includes("оренда"));
}

function parsePrice(str) { return parseInt((str||"").toString().replace(/[^\d]/g,""))||0; }
function parseArea(str)  { return parseInt((str||"").toString().replace(/[^\d]/g,""))||0; }
function parseRooms(str) { return parseInt((str||"").toString().replace(/[^\d]/g,""))||0; }

// ── ФІЛЬТРИ ──
function applyFilters() {
  const houses = getAll_Rent();
  const pMin   = parsePrice(document.getElementById("priceMin").value) || 0;
  const pMax   = parsePrice(document.getElementById("priceMax").value) || Infinity;
  const aMin   = parseArea(document.getElementById("areaMin").value)   || 0;
  const aMax   = parseArea(document.getElementById("areaMax").value)   || Infinity;
  const search = (document.getElementById("searchHouses").value || "").toLowerCase();
  const sort   = document.getElementById("sortSelect").value;
  const rooms  = [...document.querySelectorAll(".room-check:checked")].map(c => parseInt(c.value));
  const rate   = RATES[currentCurrency];
  const pMinUSD = pMin > 0 ? pMin / rate : 0;
  const pMaxUSD = pMax < Infinity ? pMax / rate : Infinity;

  filteredData = houses.filter(h => {
    const usd   = priceToUSD(h.price);
    const area  = parseArea(h.area);
    const room  = parseRooms(h.rooms);
    if (usd < pMinUSD || usd > pMaxUSD) return false;
    if (area < aMin || area > aMax) return false;
    if (rooms.length > 0 && !rooms.some(r => r === 5 ? room >= 5 : room === r)) return false;
    if (selectedLocations.length > 0) {
      const ok = selectedLocations.some(l => (h.location||"").toLowerCase().includes(l.toLowerCase()));
      if (!ok) return false;
    }
    if (search && ![h.title, h.location, h.description].some(f => (f||"").toLowerCase().includes(search))) return false;
    return true;
  });

  filteredData.sort((a, b) => {
    if (sort === "price_asc")  return priceToUSD(a.price) - priceToUSD(b.price);
    if (sort === "price_desc") return priceToUSD(b.price) - priceToUSD(a.price);
    if (sort === "area_asc")   return parseArea(a.area)   - parseArea(b.area);
    if (sort === "area_desc")  return parseArea(b.area)   - parseArea(a.area);
    return 0;
  });

  currentPage = 1;
  document.getElementById("countDisplay").textContent = filteredData.length;
  renderActiveFilters();
  renderPage();
  renderPagination();
}

// ── КАРТКИ ──
function renderPage() {
  const grid  = document.getElementById("housesGrid");
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const page  = filteredData.slice(start, start + ITEMS_PER_PAGE);
  grid.innerHTML = "";

  if (!page.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔑</div><h3>Об'єктів не знайдено</h3><p>Спробуйте змінити параметри фільтрування</p></div>`;
    return;
  }

  page.forEach((h, i) => {
    const card = document.createElement("div");
    card.className = "house-card";
    card.style.animationDelay = `${i * 0.06}s`;
    const usd = priceToUSD(h.price);
    const eur = usd > 0 ? Math.round(usd * RATES.EUR) : 0;
    const uah = usd > 0 ? Math.round(usd * RATES.UAH) : 0;
    const allPrices = usd > 0
      ? `<div class="price-all-currencies">$${usd.toLocaleString("uk-UA")} &nbsp;·&nbsp; €${eur.toLocaleString("uk-UA")} &nbsp;·&nbsp; ${uah.toLocaleString("uk-UA")} ₴</div>`
      : "";
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${h.image||'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'}" alt="${h.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'">
        <div class="card-badges"><span class="badge badge-type">Оренда</span></div>
        <div class="card-favorite" onclick="toggleFav(this)">🤍</div>
      </div>
      <div class="house-info">
        <h3>${h.title}</h3>
        <div class="house-location">📍 ${h.location}</div>
        <div class="house-price">${h.price}</div>
        ${allPrices}
        <div class="house-specs">
          ${h.area  ? `<span class="spec-tag">📐 ${h.area}</span>` : ""}
          ${h.rooms ? `<span class="spec-tag">🛏️ ${h.rooms}</span>` : ""}
        </div>
        <p class="house-desc">${h.description||""}</p>
        <div class="card-actions">
          <button class="btn-contact" onclick="location.href='index.html#contacts'">📞 Зателефонувати</button>
          <button class="btn-details">Детальніше</button>
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
  const mk = (txt, pg, disabled) => {
    const b = document.createElement("button");
    b.className = "page-btn" + (pg === currentPage ? " active" : "");
    b.textContent = txt;
    b.disabled = disabled;
    b.onclick = () => { currentPage = pg; renderPage(); renderPagination(); document.querySelector(".catalog-page").scrollIntoView({behavior:"smooth"}); };
    pag.appendChild(b);
  };
  mk("←", currentPage - 1, currentPage === 1);
  for (let i = 1; i <= total; i++) mk(i, i, false);
  mk("→", currentPage + 1, currentPage === total);
}

// ── ТЕГИ ──
function renderActiveFilters() {
  const wrap = document.getElementById("activeFilters");
  wrap.innerHTML = "";
  let any = false;
  const sym = SYMBOLS[currentCurrency];
  const pMin = document.getElementById("priceMin").value;
  const pMax = document.getElementById("priceMax").value;
  if (pMin || pMax) { addTag(wrap, `💰 ${pMin||0}–${pMax||"∞"} ${sym}`, () => { document.getElementById("priceMin").value=""; document.getElementById("priceMax").value=""; applyFilters(); }); any = true; }
  [...document.querySelectorAll(".room-check:checked")].forEach(c => { addTag(wrap, `🛏️ ${c.value==="5"?"5+":c.value} кімн.`, () => { c.checked=false; applyFilters(); }); any = true; });
  selectedLocations.forEach(l => { addTag(wrap, `📍 ${l}`, () => removeLocation(l)); any = true; });
  const s = document.getElementById("searchHouses").value;
  if (s) { addTag(wrap, `🔍 "${s}"`, () => { document.getElementById("searchHouses").value=""; applyFilters(); }); any = true; }
  if (any) { const b = document.createElement("button"); b.className = "clear-all"; b.textContent = "Скинути всі"; b.onclick = resetFilters; wrap.appendChild(b); }
}

function addTag(wrap, text, fn) {
  const t = document.createElement("div");
  t.className = "active-tag";
  t.innerHTML = `${text} <button>×</button>`;
  t.querySelector("button").onclick = fn;
  wrap.appendChild(t);
}

function resetFilters() {
  ["priceMin","priceMax","areaMin","areaMax","landMin","landMax","searchHouses"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
  document.querySelectorAll(".room-check").forEach(c => c.checked = false);
  selectedLocations = [];
  renderSelectedLocations();
  applyFilters();
}

function toggleDropdown(id, btnId) {
  const isOpen = document.getElementById(id).classList.contains("open");
  closeDropdowns();
  if (!isOpen) { document.getElementById(id).classList.add("open"); document.getElementById(btnId).classList.add("open"); }
}

function closeDropdowns() {
  document.querySelectorAll(".filter-dropdown").forEach(d => d.classList.remove("open"));
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("open"));
  if (selectedLocations.length > 0) renderSelectedLocations();
}

document.addEventListener("click", e => { if (!e.target.closest(".filter-group")) closeDropdowns(); });

function setView(type) {
  currentView = type;
  document.getElementById("housesGrid").classList.toggle("list-view", type === "list");
  document.getElementById("viewGrid").classList.toggle("active", type === "grid");
  document.getElementById("viewList").classList.toggle("active", type === "list");
}

function toggleFav(el) {
  el.classList.toggle("liked");
  el.textContent = el.classList.contains("liked") ? "❤️" : "🤍";
}

applyFilters();
