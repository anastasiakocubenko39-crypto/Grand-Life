// script.js — Grand Life

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

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSideMenu();
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

// ── ADMIN: 5 КЛІКІВ НА ЛОГО ──────────────────────────
const logoSecret = document.getElementById("logoSecret");
let logoClicks = 0, logoTimer = null;

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

// ── SHAKE ────────────────────────────────────────────
function shake(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 500);
}
