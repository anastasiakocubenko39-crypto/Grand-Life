// about.js — Grand Life

// ── BURGER MENU ──
const burgerBtn   = document.getElementById("burgerBtn");
const sideMenu    = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");
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

// ── HEADER SCROLL ──
const header = document.querySelector(".header");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 60);
  });
}

// ── SCROLL ANIMATIONS ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".value-card, .astat, .team-card-main").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(24px)";
  el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  observer.observe(el);
});

// Додаємо клас visible через CSS
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    .value-card.visible,
    .astat.visible,
    .team-card-main.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
});
