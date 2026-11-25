/* Реклама: вікно при відкритті сайту (крок 1 — «Ви власник чи шукаєте оренду?», крок 2 — форма для власника
   або для орендаря) і банер унизу, що їде за сторінкою.
   Заявки зберігаються в Supabase (таблиця grandlife_leads) і видно в адмінці → «Заявки». */
import { S, I, esc, store, telHref, $ } from './core.js?v=20261133';

const SENT = 'gl_lead_sent2';   // коли відвідувач залишив заявку (вікно 3 дні не показуємо)
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } } };

const ICO = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  owner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
  tenant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/><path d="M8.5 12.5V10l2.5-2 2.5 2v2.5"/></svg>',
  sell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  rent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};
const phone = (S.phones || [])[0];
const OBJECTS = ['Квартира', 'Будинок', 'Ділянка', 'Комерція'];
const OBJ_LABEL = { 'Комерція': 'Комерційна нерухомість' }; // як показувати на кнопках

/* Тексти обох гілок. Змінюйте тут. */
const FLOW = {
  owner: {
    img: S.aboutImage || S.heroImage, badge: ['3 тижні', 'середній строк продажу'],
    kicker: 'Власникам нерухомості',
    title: 'Бажаєте <em>продати</em> чи <em>здати в оренду?</em>',
    choices: [['Продаж', 'Продати', 'оцінка, реклама, покупець', 'sell'], ['Оренда', 'Здати в оренду', 'перевірені орендарі', 'rent']],
    lead: 'Безкоштовно оцінимо ваш об’єкт і знайдемо покупця або орендаря. Фото, реклама і юридичний супровід — беремо на себе.',
    objects: OBJECTS, objectsLabel: 'Що у вас є',
    submit: 'Отримати безкоштовну оцінку',
    done: 'Менеджер зателефонує вам найближчим часом, щоб домовитись про безкоштовну оцінку.',
  },
  tenant: { // покупці та орендарі (?who=tenant або ?who=buyer)
    img: S.about?.image || S.aboutImage || S.heroImage, badge: ['Київ', 'та Київська область'],
    kicker: 'Для покупців і орендарів',
    title: 'Бажаєте <em>купити</em> чи <em>орендувати?</em>',
    lead: 'Підберемо квартиру, будинок, ділянку або комерційну нерухомість під ваш бюджет і район. Перевіряємо документи й власників, організовуємо покази і супроводжуємо угоду.',
    choices: [['Купівля', 'Купити', 'перевірені об’єкти й документи', 'sell'], ['Шукає оренду', 'Орендувати', 'перевірені власники', 'rent']],
    objects: OBJECTS, objectsLabel: 'Що шукаєте',
    submit: 'Підібрати варіанти',
    done: 'Менеджер зателефонує вам найближчим часом, уточнить побажання і надішле підходящі варіанти.',
  },
};

/* Кроки форми («власник чи орендар» → форма). Використовується у вікні на сайті і на міні-лендингу lead.html. */
export function mountFlow(body, { side = () => {}, close = () => {}, source = '', start = '', doneHref = '' } = {}) {

  /* Крок 1: хто ви? */
  const stepWho = () => {
    side(S.heroImage, ['Гранд Лайф', 'агентство нерухомості з 2017 року']);
    body.innerHTML = `
      <span class="kicker">Безкоштовна консультація</span>
      <h2 class="h2" id="promoTitle">Що саме вас <em>цікавить?</em></h2>
      <p class="promo-lead">Оберіть, і ми підкажемо, як допомогти саме вам.</p>
      <div class="promo-who">
        <button type="button" data-who="owner">${ICO.owner}<span><b>Продати або здати в оренду</b><small>квартиру, будинок, ділянку чи комерційну нерухомість</small></span>${ICO.arrow}</button>
        <button type="button" data-who="tenant">${ICO.tenant}<span><b>Купити або орендувати</b><small>квартиру, будинок, ділянку чи комерційну нерухомість</small></span>${ICO.arrow}</button>
      </div>
      ${phone ? `<p class="promo-alt">або зателефонуйте: <a href="${telHref(phone)}">${esc(phone)}</a></p>` : ''}`;
    body.querySelector('.promo-who').onclick = (e) => { const b = e.target.closest('[data-who]'); if (b) stepForm(b.dataset.who); };
  };

  /* Крок 2: форма для власника або орендаря */
  const stepForm = (who) => {
    const F = FLOW[who];
    let kind = F.choices[0][0];
    let object = '';
    side(F.img, F.badge);
    body.innerHTML = `
      <button class="promo-back" type="button">${ICO.back}Назад</button>
      <span class="kicker">${F.kicker}</span>
      <h2 class="h2" id="promoTitle">${F.title}</h2>
      <p class="promo-lead">${F.lead}</p>
      <form class="promo-form" novalidate>
        <div class="promo-choice" data-g="kind" role="radiogroup" aria-label="Що бажаєте">
          ${F.choices.map(([v, b, s, ic], i) => `<button type="button" data-v="${v}" aria-pressed="${i === 0}">${ICO[ic]}<span><b>${b}</b><small>${s}</small></span></button>`).join('')}
        </div>
        <div class="promo-objs-l">${F.objectsLabel}</div>
        <div class="promo-objs" data-g="object" role="radiogroup" aria-label="${F.objectsLabel}">
          ${F.objects.map((o) => `<button type="button" data-v="${o}" aria-pressed="false">${OBJ_LABEL[o] || o}</button>`).join('')}
        </div>
        <div class="promo-fields">
          <input class="field" name="name" autocomplete="name" placeholder="Ваше ім’я" maxlength="80">
          <input class="field" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Телефон *" maxlength="30" required>
          <input class="promo-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        </div>
        <button class="btn block" type="submit">${F.submit}</button>
        <p class="promo-err" aria-live="polite"></p>
        ${phone ? `<p class="promo-alt">або зателефонуйте: <a href="${telHref(phone)}">${esc(phone)}</a></p>` : ''}
      </form>`;
    body.querySelector('.promo-back').onclick = stepWho;
    body.querySelectorAll('[data-g]').forEach((g) => (g.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const on = g.dataset.g === 'object' && b.getAttribute('aria-pressed') === 'true' ? false : true; // тип об’єкта можна зняти
      g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', on && x === b));
      if (g.dataset.g === 'kind') kind = b.dataset.v; else object = on ? b.dataset.v : '';
    }));
    const form = body.querySelector('form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const err = form.querySelector('.promo-err'), btn = form.querySelector('[type=submit]');
      const name = form.name.value.trim(), tel = form.phone.value.trim();
      if (form.website.value) return close(); // бот заповнив приховане поле
      if (tel.replace(/\D/g, '').length < 9) { err.textContent = 'Вкажіть номер телефону, щоб ми могли передзвонити.'; form.phone.focus(); return; }
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Надсилаємо…';
      try {
        await store.lead({ kind, object, name, phone: tel, page: (source || location.pathname.split('/').pop() || 'index.html').slice(0, 60) });
        try { localStorage.setItem(SENT, String(Date.now())); } catch {}
        body.innerHTML = `<div class="promo-done"><span class="promo-done-ic">${ICO.check}</span><h2 class="h2">Дякуємо${name ? ', ' + esc(name) : ''}!</h2><p class="promo-lead">${F.done}</p>${doneHref ? `<a class="btn line block" href="${esc(doneHref)}">Перейти на сайт</a>` : '<button class="btn line block" type="button" id="promoDone">Повернутися на сайт</button>'}</div>`;
        body.querySelector('#promoDone')?.addEventListener('click', close);
      } catch (x) {
        console.error(x);
        err.innerHTML = `Не вдалося надіслати. ${phone ? `Зателефонуйте нам: <a href="${telHref(phone)}">${esc(phone)}</a>` : 'Спробуйте ще раз.'}`;
        btn.disabled = false; btn.textContent = F.submit;
      }
    };
    if (!matchMedia('(max-width: 760px)').matches) setTimeout(() => form.phone.focus({ preventScroll: true }), 50);
  };

  const st = start === 'buyer' ? 'tenant' : start;
  const begin = FLOW[st] ? () => stepForm(st) : stepWho;
  begin();
}

export function promo() {
  if (document.querySelector('.promo')) return;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="promo" id="promo" hidden role="dialog" aria-modal="true" aria-labelledby="promoTitle">
    <div class="promo-card">
      <button class="promo-x" type="button" aria-label="Закрити">${ICO.close}</button>
      <div class="promo-side">
        <img id="promoImg" src="${esc(S.heroImage)}" alt="" loading="lazy">
        <div class="promo-badge" id="promoBadge"><b>Гранд Лайф</b><span>агентство нерухомості з 2017 року</span></div>
      </div>
      <div class="promo-body" id="promoBody"></div>
    </div>
  </div>
  <div class="promo-bar" id="promoBar" hidden>
    <div class="wrap">
      <span class="promo-bar-ic">${ICO.sell}</span>
      <p><b>Продати, купити чи орендувати?</b><span> Безкоштовна консультація — підберемо рішення під вас.</span></p>
      ${phone ? `<a class="btn line sm promo-bar-call" href="${telHref(phone)}" aria-label="Зателефонувати">${I.phone}<span>${esc(phone)}</span></a>` : ''}
      <button class="btn sm" type="button" id="promoOpen"><span class="pb-d">Залишити заявку</span><span class="pb-m">Заявка</span></button>
      <button class="promo-bar-x" type="button" aria-label="Сховати банер">${ICO.close}</button>
    </div>
  </div>`);

  const modal = $('#promo'), bar = $('#promoBar'), body = $('#promoBody');
  const side = (img, [b, s]) => { $('#promoImg').src = img; $('#promoBadge').innerHTML = `<b>${esc(b)}</b><span>${esc(s)}</span>`; };
  const open = () => { mountFlow(body, { side, close }); modal.hidden = false; requestAnimationFrame(() => modal.classList.add('on')); document.body.classList.add('promo-open'); };
  const close = () => { modal.classList.remove('on'); document.body.classList.remove('promo-open'); setTimeout(() => (modal.hidden = true), 300); };
  modal.querySelector('.promo-x').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

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
