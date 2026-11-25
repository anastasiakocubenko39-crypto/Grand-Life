/* Реклама для власників: вікно при відкритті сайту і банер унизу, що їде за сторінкою.
   Заявки зберігаються в Supabase (таблиця grandlife_leads) і видно в адмінці → «Заявки». */
import { S, I, esc, store, telHref, $ } from './core.js?v=20261127';

const SENT = 'gl_lead_sent2';   // коли відвідувач залишив заявку (вікно 3 дні не показуємо)
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } } };

const ICO = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  sell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  rent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};
const phone = (S.phones || [])[0];

export function promo() {
  if (document.querySelector('.promo')) return;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="promo" id="promo" hidden role="dialog" aria-modal="true" aria-labelledby="promoTitle">
    <div class="promo-card">
      <button class="promo-x" type="button" aria-label="Закрити">${ICO.close}</button>
      <div class="promo-side">
        <img src="${esc(S.aboutImage || S.heroImage)}" alt="" loading="lazy">
        <div class="promo-badge"><b>3 тижні</b><span>середній строк продажу</span></div>
      </div>
      <div class="promo-body" id="promoBody">
        <span class="kicker">Власникам нерухомості</span>
        <h2 class="h2" id="promoTitle">Бажаєте <em>продати</em> чи <em>здати в оренду?</em></h2>
        <p class="promo-lead">Безкоштовно оцінимо ваш об’єкт і знайдемо покупця або орендаря. Фото, реклама і юридичний супровід — беремо на себе.</p>
        <form class="promo-form" novalidate>
          <div class="promo-choice" role="radiogroup" aria-label="Що вас цікавить">
            <button type="button" data-k="Продаж" aria-pressed="true">${ICO.sell}<span><b>Продати</b><small>квартиру, будинок, ділянку</small></span></button>
            <button type="button" data-k="Оренда" aria-pressed="false">${ICO.rent}<span><b>Здати в оренду</b><small>перевірені орендарі</small></span></button>
          </div>
          <div class="promo-fields">
            <input class="field" name="name" autocomplete="name" placeholder="Ваше ім’я" maxlength="80">
            <input class="field" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Телефон *" maxlength="30" required>
            <input class="promo-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          </div>
          <button class="btn block" type="submit">Отримати безкоштовну оцінку</button>
          <p class="promo-err" aria-live="polite"></p>
          ${phone ? `<p class="promo-alt">або зателефонуйте: <a href="${telHref(phone)}">${esc(phone)}</a></p>` : ''}
        </form>
      </div>
    </div>
  </div>
  <div class="promo-bar" id="promoBar" hidden>
    <div class="wrap">
      <span class="promo-bar-ic">${ICO.sell}</span>
      <p><b>Продаєте чи здаєте нерухомість?</b><span> Безкоштовна оцінка і покупець у середньому за 3 тижні.</span></p>
      ${phone ? `<a class="btn line sm promo-bar-call" href="${telHref(phone)}" aria-label="Зателефонувати">${I.phone}<span>${esc(phone)}</span></a>` : ''}
      <button class="btn sm" type="button" id="promoOpen"><span class="pb-d">Залишити заявку</span><span class="pb-m">Заявка</span></button>
      <button class="promo-bar-x" type="button" aria-label="Сховати банер">${ICO.close}</button>
    </div>
  </div>`);

  const modal = $('#promo'), bar = $('#promoBar');
  let kind = 'Продаж';
  const open = () => { modal.hidden = false; requestAnimationFrame(() => modal.classList.add('on')); document.body.classList.add('promo-open'); setTimeout(() => modal.querySelector('[name=phone]')?.focus({ preventScroll: true }), 350); };
  const close = () => { modal.classList.remove('on'); document.body.classList.remove('promo-open'); setTimeout(() => (modal.hidden = true), 300); };
  modal.querySelector('.promo-x').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  modal.querySelector('.promo-choice').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
    modal.querySelectorAll('.promo-choice button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  };
  modal.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, err = f.querySelector('.promo-err'), btn = f.querySelector('[type=submit]');
    const name = f.name.value.trim(), tel = f.phone.value.trim();
    if (f.website.value) return close(); // бот заповнив приховане поле
    if (tel.replace(/\D/g, '').length < 9) { err.textContent = 'Вкажіть номер телефону, щоб ми могли передзвонити.'; f.phone.focus(); return; }
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Надсилаємо…';
    try {
      await store.lead({ kind, name, phone: tel, page: location.pathname.split('/').pop() || 'index.html' });
      try { localStorage.setItem(SENT, String(Date.now())); } catch {}
      $('#promoBody').innerHTML = `<div class="promo-done"><span class="promo-done-ic">${ICO.check}</span><h2 class="h2">Дякуємо${name ? ', ' + esc(name) : ''}!</h2><p class="promo-lead">Менеджер зателефонує вам найближчим часом, щоб домовитись про безкоштовну оцінку.</p><button class="btn line block" type="button" id="promoDone">Повернутися на сайт</button></div>`;
      $('#promoDone').onclick = close;
    } catch (x) {
      console.error(x);
      err.innerHTML = `Не вдалося надіслати. ${phone ? `Зателефонуйте нам: <a href="${telHref(phone)}">${esc(phone)}</a>` : 'Спробуйте ще раз.'}`;
      btn.disabled = false; btn.textContent = 'Отримати безкоштовну оцінку';
    }
  };

  $('#promoOpen').onclick = open;
  bar.querySelector('.promo-bar-x').onclick = () => { bar.classList.remove('on'); document.body.classList.remove('has-promo-bar'); setTimeout(() => (bar.hidden = true), 300); };

  // Банер — при кожному відкритті й оновленні сторінки (хрестик ховає його лише до наступного завантаження).
  bar.hidden = false; document.body.classList.add('has-promo-bar'); setTimeout(() => bar.classList.add('on'), 1200);
  // Вікно — при кожному новому заході на сайт і при оновленні сторінки, але не при переході між сторінками сайту.
  // Хто вже залишив заявку, вікно 3 дні не бачить.
  const nav = performance.getEntriesByType?.('navigation')?.[0]?.type;
  let internal = false; try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch {}
  const sentAt = +(ls.get(SENT) || 0);
  const recentlySent = sentAt > 1 && Date.now() - sentAt < 3 * 864e5;
  if (!recentlySent && (nav === 'reload' || !internal)) setTimeout(() => { if (modal.hidden && !document.body.classList.contains('menu-open')) open(); }, 3500);
}
