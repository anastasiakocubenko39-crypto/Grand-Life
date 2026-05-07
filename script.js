// =====================================================
// script.js — Grand Life
// =====================================================

// ── НАЛАШТУВАННЯ ─────────────────────────────────────
const ADMIN_LOGIN    = "admin";
const ADMIN_PASSWORD = "grandlife2025";

// ── BURGER MENU ──────────────────────────────────────
const burgerBtn    = document.getElementById("burgerBtn");
const sideMenu     = document.getElementById("sideMenu");
const menuOverlay  = document.getElementById("menuOverlay");
const closeMenuBtn = document.getElementById("closeMenu");

if (burgerBtn)    burgerBtn.addEventListener("click", openMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSideMenu);
if (menuOverlay)  menuOverlay.addEventListener("click", closeSideMenu);

function openMenu() {
  sideMenu.classList.add("active");
  menuOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSideMenu() {
  sideMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeSideMenu(); }
});

document.querySelectorAll(".side-menu a").forEach(link => {
  link.addEventListener("click", closeSideMenu);
});

// ── HEADER SCROLL ────────────────────────────────────
const header = document.querySelector(".header");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 60);
  });
}

// ── ДАНІ ОБ'ЄКТІВ ────────────────────────────────────
let properties = JSON.parse(localStorage.getItem("grandLifeProperties")) || [];

function saveProperties() {
  localStorage.setItem("grandLifeProperties", JSON.stringify(properties));
}

// ── РЕНДЕР КАРТОК ────────────────────────────────────
const propertyGrid = document.getElementById("propertyGrid");

function renderProperties(list = properties) {
  if (!propertyGrid) return;
  propertyGrid.innerHTML = "";

  if (list.length === 0) {
    propertyGrid.innerHTML = `<p class="no-results">Об'єктів не знайдено.</p>`;
    return;
  }

  list.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "property-card";
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'">
        <div class="card-type-badge">${item.type}</div>
      </div>
      <div class="property-info">
        <h3>${item.title}</h3>
        <div class="price">${item.price}</div>
        <div class="meta">
          <span>📍 ${item.location}</span>
          <span>📐 ${item.area}</span>
          <span>🛏️ ${item.rooms}</span>
        </div>
        <p class="desc">${item.description}</p>
      </div>
    `;
    propertyGrid.appendChild(card);
  });
}

// ── ПОШУК ────────────────────────────────────────────
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const v = searchInput.value.toLowerCase();
    renderProperties(properties.filter(item =>
      item.title.toLowerCase().includes(v) ||
      item.type.toLowerCase().includes(v) ||
      item.location.toLowerCase().includes(v) ||
      item.price.toLowerCase().includes(v)
    ));
  });
}

renderProperties();

// ── SCROLL ANIMATIONS ────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".cat-card, .why-card, .contact-card, .stat-item").forEach(el => {
  observer.observe(el);
});

// ── ADMIN: 5 КЛІКІВ НА ЛОГО → admin.html ──────────────
const logoSecret = document.getElementById("logoSecret");
let logoClicks = 0;
let logoTimer  = null;

if (logoSecret) {
  logoSecret.addEventListener("click", () => {
    logoClicks++;
    clearTimeout(logoTimer);

    if (logoClicks >= 5) {
      window.location.href = "admin.html";
      logoClicks = 0;
    }

    logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
  });
}

// ── SHAKE HELPER ─────────────────────────────────────
function shake(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 500);
}