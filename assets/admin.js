/* Realty template — admin panel logic */
import { S, TYPES, PUBLIC_TYPES, TYPE, CONDITIONS, WALLS, HEATING, PURPOSES, FEATURES, I, esc, fmt, store, norm, cardHTML, toast, supa as getSupa, $, $$ } from './core.js?v=20261126';

const ICON = {
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20h16M6 20V9l6-5 6 5v11"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M5.5 5h13L21 13v6H3v-6z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
};
const MAX_DOC = 950000; // Firestore document limit is ~1 MB
let RAW = [];
let view = 'list';
let filt = { q: '', type: '', status: '' };

/* ── chrome ── */
['#lLogo', '#sLogo', '#mLogo'].forEach((s, i) => ($(s).src = i ? S.logoLight : S.logo));
$('[data-view="list"]').innerHTML = ICON.list + 'Усі об’єкти';
$('[data-view="new"]').innerHTML = ICON.plus + 'Додати об’єкт';
$('[data-view="leads"]').innerHTML = ICON.inbox + 'Заявки <span class="nav-count" id="leadCount" hidden></span>';
$('#toSite').innerHTML = ICON.site + 'Відкрити сайт';
$('#logout').innerHTML = ICON.out + 'Вийти';
$$('.side-nav [data-view]').forEach((b) => (b.onclick = () => { $('#sideNav').classList.remove('open'); b.dataset.view === 'new' ? openEditor(null) : b.dataset.view === 'leads' ? showLeads() : showList(); }));
$('#mMenu').onclick = () => $('#sideNav').classList.toggle('open');

/* ── auth ── */
let supa = null;
async function auth() {
  if (!S.supabase) {
    $('#lForm').innerHTML = `<p>Демо-режим: об’єкти зберігаються в цьому браузері. Щоб керувати сайтом з будь-якого пристрою, підключіть базу даних у config.js.</p><button class="btn block" id="demoIn">Увійти в демо-панель</button>`;
    $('#demoIn').onclick = () => { sessionStorage.setItem('demoAdmin', '1'); start('Демо-режим'); };
    if (sessionStorage.getItem('demoAdmin')) start('Демо-режим');
    $('#logout').onclick = () => { sessionStorage.removeItem('demoAdmin'); location.reload(); };
    return;
  }
  supa = await getSupa();
  const allowed = (S.adminEmails || []).map((e) => e.toLowerCase());
  const ok = (sess) => !!sess && allowed.includes(String(sess.user?.email || '').toLowerCase());
  $('#lForm').innerHTML = `<p>Введіть робочу пошту — надішлемо посилання для входу. Пароль не потрібен.</p>
    <label class="f"><span>Email</span><input class="field" id="lEmail" type="email" autocomplete="email" placeholder="name@example.com"></label>
    <button class="btn block" id="lSend" style="margin-top:14px">Надіслати посилання</button><p class="err" id="lErr"></p>`;
  const send = async () => {
    const email = $('#lEmail').value.trim().toLowerCase();
    if (!allowed.includes(email)) { $('#lErr').textContent = 'Ця адреса не має доступу до панелі.'; return; }
    $('#lSend').disabled = true; $('#lSend').textContent = 'Надсилаємо…';
    const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } });
    $('#lSend').disabled = false; $('#lSend').textContent = 'Надіслати посилання';
    if (error) $('#lErr').textContent = 'Помилка: ' + error.message;
    else $('#lForm').innerHTML = `<p>Готово! Перевірте пошту <b>${esc(email)}</b> і натисніть посилання в листі — панель відкриється автоматично.</p><div class="note">Лист може потрапити в «Спам» або «Промоакції».</div>`;
  };
  $('#lSend').onclick = send; $('#lEmail').onkeydown = (e) => { if (e.key === 'Enter') send(); };
  // Посилання з листа прострочене або вже використане — Supabase повертає помилку в адресі.
  const linkErr = new URLSearchParams(location.hash.slice(1) || location.search).get('error_description');
  if (linkErr) { $('#lErr').textContent = 'Посилання для входу не спрацювало (' + linkErr.replace(/\+/g, ' ') + '). Надішліть нове.'; history.replaceState(null, '', location.pathname); }
  const { data } = await supa.auth.getSession();
  if (ok(data.session)) start(data.session.user.email);
  else if (data.session) { $('#lErr').textContent = `Ви увійшли як ${data.session.user.email || 'інший користувач'} — ця адреса не має доступу до панелі.`; await supa.auth.signOut(); }
  supa.auth.onAuthStateChange((_e, sess) => { if (ok(sess) && $('#app').hidden) start(sess.user.email); });
  $('#logout').onclick = async () => { await supa.auth.signOut(); location.reload(); };
}

async function start(who) {
  $('#login').hidden = true; $('#app').hidden = false; $('#who').textContent = who;
  try { await reload(); showList(); }
  catch (e) {
    console.error(e);
    $('#main').innerHTML = `<div class="empty"><b>Не вдалося завантажити об’єкти</b>${esc(e.message)}<br><br>Перевірте інтернет і оновіть сторінку. Якщо помилка про таблицю grandlife_properties — у Supabase не виконано файл supabase/schema.sql.</div>`;
  }
}
async function reload() { RAW = await store.raw(); countLeads(); }

/* ── заявки з реклами ── */
let LEADS = [];
async function countLeads() {
  try { LEADS = await store.leads(); } catch (e) { console.error(e); LEADS = []; }
  const n = LEADS.filter((l) => !l.done).length;
  const c = $('#leadCount'); if (c) { c.hidden = !n; c.textContent = n; }
}
async function showLeads() {
  view = 'leads'; navCur('leads');
  $('#main').innerHTML = '<div class="adm-top"><h1>Заявки</h1></div><div class="rows" id="leadRows"><div class="empty"><b>Завантажуємо…</b></div></div>';
  try { await countLeads(); } catch {}
  const draw = () => {
    $('#leadRows').innerHTML = LEADS.length ? LEADS.map((l) => `
      <div class="row lead${l.done ? ' done' : ''}" data-id="${esc(l.id)}">
        <div class="th lead-ic">${l.kind === 'Оренда' ? 'О' : 'П'}</div>
        <div><h3>${esc(l.name || 'Без імені')} · <a href="tel:${esc(String(l.phone).replace(/[^\d+]/g, ''))}">${esc(l.phone)}</a></h3>
          <div class="meta"><span class="pill">${l.kind === 'Оренда' ? 'Здати в оренду' : 'Продати'}</span>${l.done ? '<span class="pill">Опрацьовано</span>' : '<span class="pill star">Нова</span>'}<span>${new Date(l.created_at).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })}</span>${l.page ? `<span>зі сторінки ${esc(l.page)}</span>` : ''}</div></div>
        <div class="acts">
          <a class="ibtn" href="tel:${esc(String(l.phone).replace(/[^\d+]/g, ''))}">Зателефонувати</a>
          <button class="ibtn${l.done ? '' : ' on'}" data-a="done">${l.done ? 'Повернути в нові' : 'Опрацьовано'}</button>
          <button class="ibtn danger" data-a="del" title="Видалити">${ICON.trash}</button>
        </div>
      </div>`).join('') : '<div class="empty"><b>Заявок поки немає</b>Вони з’являться тут, коли відвідувачі заповнять форму в рекламному вікні або банері на сайті.</div>';
  };
  draw();
  $('#leadRows').onclick = async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const id = b.closest('.row').dataset.id; const l = LEADS.find((x) => String(x.id) === id); if (!l) return;
    try {
      if (b.dataset.a === 'done') await store.leadUpdate(l.id, { done: !l.done });
      if (b.dataset.a === 'del') { if (!confirm('Видалити заявку?')) return; await store.leadRemove(l.id); }
      await countLeads(); draw();
    } catch (err) { console.error(err); alert('Не вдалося зберегти: ' + err.message); }
  };
}

/* ── одноразове перенесення з Firebase (Firestore REST, тільки читання) ── */
function fsValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsValue);
  if ('mapValue' in v) return fsFields(v.mapValue.fields || {});
  return null;
}
const fsFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fsValue(v)]));
async function importFirebase() {
  const b = $('#importFb'); const fb = S.oldFirebase;
  b.disabled = true; b.textContent = 'Читаємо Firebase…';
  try {
    const docs = []; let page = '';
    do {
      const u = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents/properties?pageSize=50&key=${fb.apiKey}${page ? '&pageToken=' + encodeURIComponent(page) : ''}`;
      const r = await (await fetch(u)).json();
      if (r.error) throw new Error(r.error.message);
      (r.documents || []).forEach((d) => docs.push({ id: d.name.split('/').pop(), created: d.createTime, ...fsFields(d.fields || {}) }));
      page = r.nextPageToken;
    } while (page);
    const have = new Set(RAW.map((d) => d.id));
    const todo = docs.filter((d) => !have.has(d.id));
    let done = 0;
    for (const { id, created, updatedAt, ...d } of todo) {
      b.textContent = `Переносимо ${done + 1} з ${todo.length}…`;
      await store.add({ ...d, addedAt: d.addedAt || created }, id);
      done++;
    }
    toast(todo.length ? `Перенесено об’єктів: ${done}` : 'Усі об’єкти вже перенесено');
    await reload(); showList();
  } catch (e) { console.error(e); alert('Не вдалося перенести: ' + e.message); b.disabled = false; b.textContent = 'Спробувати ще раз'; }
}

/* ── list ── */
function showList() {
  view = 'list'; navCur('list');
  const P = RAW.map((d) => norm(d.id, d)).sort((a, b) => (b.date || 0) - (a.date || 0));
  const active = P.filter((p) => !p.sold);
  $('#main').innerHTML = `
    <div class="adm-top"><h1>Об’єкти</h1><button class="btn" id="addBtn">${ICON.plus}Додати об’єкт</button></div>
    ${S.oldFirebase && !store.demo ? `<div class="demo-note"><span>Перенесення зі старої бази Firebase: об’єкти, яких ще немає в Supabase, буде скопійовано разом із фото. Можна запускати повторно — дублікатів не буде.</span><button id="importFb">Перенести з Firebase</button></div>` : ''}
    ${store.demo ? `<div class="demo-note"><span>Демо-режим: зміни видно лише в цьому браузері.</span><button id="resetDemo">Повернути демо-об’єкти</button></div>` : ''}
    <div class="kpis">
      <div class="kpi"><b>${P.length}</b><span>усього об’єктів</span></div>
      <div class="kpi"><b>${active.length}</b><span>в продажу та оренді</span></div>
      <div class="kpi"><b>${P.length - active.length}</b><span>продано / здано</span></div>
      <div class="kpi"><b>${P.filter((p) => !p.images.length).length}</b><span>без фото</span></div>
    </div>
    <div class="list-tools">
      <input class="field" id="lq" placeholder="Пошук за назвою або локацією" value="${esc(filt.q)}">
      <select class="field" id="lt"><option value="">Усі типи</option>${TYPES.map((t) => `<option value="${t.id}"${filt.type === t.id ? ' selected' : ''}>${t.label}</option>`).join('')}</select>
      <select class="field" id="ls"><option value="">Будь-який статус</option><option value="active"${filt.status === 'active' ? ' selected' : ''}>Активні</option><option value="sold"${filt.status === 'sold' ? ' selected' : ''}>Продані / здані</option><option value="star"${filt.status === 'star' ? ' selected' : ''}>На головній</option></select>
    </div>
    <div class="rows" id="rows"></div>`;
  $('#addBtn').onclick = () => openEditor(null);
  $('#importFb')?.addEventListener('click', importFirebase);
  $('#resetDemo')?.addEventListener('click', async () => { if (confirm('Повернути початкові демо-об’єкти? Ваші зміни в демо буде скинуто.')) { store.resetDemo(); await reload(); showList(); } });
  const draw = () => {
    const q = filt.q.toLowerCase();
    const l = P.filter((p) => (!q || `${p.title} ${p.location}`.toLowerCase().includes(q)) && (!filt.type || p.type === filt.type)
      && (!filt.status || (filt.status === 'active' ? !p.sold : filt.status === 'sold' ? p.sold : p.featured)));
    $('#rows').innerHTML = l.length ? l.map((p) => `
      <div class="row" data-id="${esc(p.id)}">
        <div class="th">${p.images[0] ? `<img src="${esc(p.images[0])}" alt="" loading="lazy">` : `<img class="mk" src="${S.mark}" alt="">`}</div>
        <div><h3>${esc(p.title)}</h3><div class="meta"><span class="pill">${esc(TYPE[p.type].one)}</span>${p.sold ? '<span class="pill sold">Продано</span>' : ''}${p.featured ? '<span class="pill star">На головній</span>' : ''}<b>${p.priceValue != null ? (p.currency === '₴' ? fmt(p.priceValue) + ' ₴' : p.currency + fmt(p.priceValue)) : 'ціна не вказана'}</b><span>${esc(p.location)}</span><span>${p.images.length} фото</span>${p.date ? `<span>${p.date.toLocaleDateString('uk-UA')}</span>` : ''}</div></div>
        <div class="acts">
          <button class="ibtn" data-a="edit">${ICON.edit}Редагувати</button>
          <a class="ibtn" href="object.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">${ICON.eye}Переглянути</a>
          <button class="ibtn${p.featured ? ' on' : ''}" data-a="star" title="Показувати на головній">${ICON.star}</button>
          <button class="ibtn" data-a="sold">${p.sold ? 'Повернути в продаж' : (p.type === 'Оренда' ? 'Здано' : 'Продано')}</button>
          <button class="ibtn danger" data-a="del" title="Видалити">${ICON.trash}</button>
        </div>
      </div>`).join('') : `<div class="empty"><b>${P.length ? 'Нічого не знайдено' : 'Поки що немає об’єктів'}</b>${P.length ? 'Змініть пошук або фільтри.' : 'Натисніть «Додати об’єкт», щоб створити перший.'}</div>`;
  };
  $('#lq').oninput = (e) => { filt.q = e.target.value; draw(); };
  $('#lt').onchange = (e) => { filt.type = e.target.value; draw(); };
  $('#ls').onchange = (e) => { filt.status = e.target.value; draw(); };
  $('#rows').onclick = async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const id = b.closest('.row').dataset.id; const d = RAW.find((x) => x.id === id);
    try {
      if (b.dataset.a === 'edit') return openEditor(id);
      if (b.dataset.a === 'star') { await store.update(id, { featured: !d.featured }); toast(d.featured ? 'Прибрано з головної' : 'Показується на головній'); }
      if (b.dataset.a === 'sold') { await store.update(id, { sold: !d.sold }); toast(d.sold ? 'Повернуто в продаж' : 'Позначено як продано'); }
      if (b.dataset.a === 'del') { if (!confirm(`Видалити «${d.title || 'об’єкт'}» назавжди?`)) return; await store.remove(id); toast('Об’єкт видалено'); }
      await reload(); showList();
    } catch (err) { console.error(err); alert('Не вдалося зберегти: ' + err.message); }
  };
  draw();
}
const navCur = (v) => $$('.side-nav [data-view]').forEach((b) => b.toggleAttribute('aria-current', b.dataset.view === v));

/* ── editor ── */
const TEMPLATES = {
  'Будинок': 'Про будинок\nКоротко: площа, кількість поверхів, рік будівництва, з чого збудований і в якому стані.\n\nПланування\nПерший поверх: … Другий поверх: … Де спальні, санвузли, кухня-вітальня, гардеробна.\n\nДілянка і двір\nПлоща ділянки, огорожа, ландшафт, тераса, гараж або паркінг, господарські споруди.\n\nКомунікації\nСвітло (потужність), газ, вода, каналізація, опалення, інтернет.\n\nРозташування\nДо Києва …, до школи …, до магазину …, поруч ліс / водойма.\n\nДокументи та умови\nВласник, документи готові до угоди, можливість іпотеки чи розстрочки, торг.',
  'Квартира': 'Про квартиру\nКоротко: кількість кімнат, площа, поверх, стан ремонту, вид з вікон.\n\nПланування\nКухня-вітальня …, спальні …, санвузли …, гардеробна / комора, балкон.\n\nРемонт і що залишається\nМатеріали, техніка, меблі, кондиціонери, бойлер.\n\nБудинок і ЖК\nРік здачі, матеріал стін, ліфти, укриття, генератор, паркінг, охорона, двір.\n\nІнфраструктура\nШкола, садок, магазини, метро / зупинки, парки поруч.\n\nДокументи та умови\nВласник, документи, можливість іпотеки, торг.',
  'Ділянка': 'Про ділянку\nПлоща, форма, рельєф, цільове призначення, кадастровий номер.\n\nКомунікації\nСвітло по межі (потужність), газ, вода, каналізація.\n\nДоступ і оточення\nДорога (асфальт / щебінь), сусіди, ліс, водойма, тиша.\n\nРозташування\nВідстань до міста, транспорт, магазини, школа.\n\nДокументи та умови\nДержакт, все оформлено, можлива розстрочка, торг.',
  'Оренда': 'Про житло\nКількість кімнат, площа, поверх, стан ремонту.\n\nЩо є в квартирі\nМеблі, техніка, кондиціонер, інтернет.\n\nУмови оренди\nМінімальний строк, застава, комісія, комунальні платежі, чи можна з тваринами і дітьми.\n\nРозташування\nТранспорт, магазини, парки, час до центру.',
  'Комерція': 'Про приміщення\nПлоща, поверх, окремий вхід, висота стель, вітрини.\n\nПризначення\nОфіс, магазин, кафе, склад, салон — для чого підходить.\n\nТехнічні характеристики\nПотужність електрики, вентиляція, кондиціонування, санвузол.\n\nЛокація і трафік\nПішохідний / автомобільний трафік, паркінг, сусіди.\n\nУмови\nПродаж або оренда, документи, торг.',
};

const PAY_TERMS = ['Торг', 'Без торгу', 'Можлива іпотека', 'Можлива розстрочка', 'Торг, можлива іпотека', 'Торг, можлива розстрочка', 'Можлива іпотека або розстрочка', 'Торг, іпотека або розстрочка'];
const UNITS = ['м²', 'сот', 'га'];
let photos = []; // data URLs or http URLs
let form = {};
function openEditor(id) {
  view = 'edit'; navCur(id ? '' : 'new');
  const d = id ? RAW.find((x) => x.id === id) : {};
  const p = id ? norm(id, d) : null;
  form = {
    type: p?.type || '', title: d.title || '', location: d.location || '', address: d.address || '', complex: d.complex || '',
    priceValue: p?.priceValue ?? '', currency: p?.currency || '$', priceNote: d.priceNote || '',
    areaValue: p?.areaValue ?? '', areaUnit: p?.areaUnit || 'м²', livingArea: d.livingArea || '', kitchenArea: d.kitchenArea || '', landArea: d.landArea || '',
    livingUnit: d.livingUnit || 'м²', kitchenUnit: d.kitchenUnit || 'м²', landUnit: d.landUnit || 'сот',
    rooms: d.rooms && d.rooms !== '—' ? d.rooms : '', bedrooms: d.bedrooms || '', bathrooms: d.bathrooms || '', floor: d.floor || '', floors: d.floors || '', year: d.year || '', ceiling: d.ceiling || '',
    condition: d.condition || '', walls: d.walls || '', heating: d.heating || '', purpose: d.purpose || '', cadastre: d.cadastre || '',
    rentTerm: d.rentTerm || '', deposit: d.deposit || '', available: d.available || '',
    description: d.description || '', infrastructure: d.infrastructure || '', videoUrl: d.videoUrl || '', code: d.code || '',
    features: [...(p?.features || [])], featured: !!d.featured, sold: !!d.sold,
  };
  photos = [...(p?.images || [])];
  const opt = (arr, v) => `<option value="">— не вказано —</option>` + arr.map((x) => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const areaInp = (k, u, label, ph) => `<label class="f"><span>${label}</span><div class="combo"><input class="field" data-k="${k}" inputmode="decimal" value="${esc(form[k])}" placeholder="${esc(ph)}"><select class="field" data-k="${u}">${UNITS.map((c) => `<option${c === form[u] ? ' selected' : ''}>${c}</option>`).join('')}</select></div></label>`;
  const inp = (k, label, ph = '', extra = '') => `<label class="f${extra}"><span>${label}</span><input class="field" data-k="${k}" value="${esc(form[k])}" placeholder="${esc(ph)}"></label>`;
  $('#main').innerHTML = `
    <div class="adm-top"><h1>${id ? 'Редагування' : 'Новий об’єкт'}</h1><button class="btn line sm" id="back">← До списку</button></div>
    <div class="editor">
      <div>
        <section class="card"><h2><i>1</i>Тип об’єкта <em style="color:#B3261E;font-style:normal">*</em></h2><p class="hint">Від типу залежить розділ сайту і поля нижче.</p>
          <div class="types" id="types">${TYPES.filter((t) => !t.hidden || t.id === form.type).map((t) => `<button type="button" data-t="${t.id}" aria-pressed="${form.type === t.id}">${t.one}</button>`).join('')}</div></section>

        <section class="card"><h2><i>2</i>Основне</h2><p class="hint">Назва з’являється в картці та на сторінці об’єкта.</p>
          <div class="fgrid">
            <label class="f full"><span>Назва <em>*</em></span><input class="field" data-k="title" value="${esc(form.title)}" placeholder="Напр.: Сучасний будинок 160 м² біля лісу"><small>Коротко і конкретно: що, яка площа, головна перевага.</small></label>
            ${inp('location', 'Місто / район <em>*</em>', 'Ірпінь, Київська обл.')}
            ${inp('address', 'Вулиця, ЖК або орієнтир', 'вул. Садова')}
            ${inp('complex', 'Житловий комплекс / котеджне містечко', 'ЖК «…»')}
            ${inp('code', 'Код об’єкта (необов’язково)', 'GL-104')}
          </div></section>

        <section class="card"><h2><i>3</i>Ціна і площа</h2><p class="hint">Ціну вказуйте числом — так працюють фільтри і сортування на сайті.</p>
          <div class="fgrid">
            <label class="f"><span>Ціна</span><div class="combo"><input class="field" data-k="priceValue" inputmode="numeric" value="${esc(form.priceValue)}" placeholder="125000"><select class="field" data-k="currency">${['$', '€', '₴'].map((c) => `<option${c === form.currency ? ' selected' : ''}>${c}</option>`).join('')}</select></div><small id="rentHint">${form.type === 'Оренда' ? 'Для оренди — ціна за місяць.' : ''}</small></label>
            <label class="f"><span>Умови оплати</span><select class="field" data-k="priceNote">${opt(PAY_TERMS.includes(form.priceNote) || !form.priceNote ? PAY_TERMS : [form.priceNote, ...PAY_TERMS], form.priceNote)}</select></label>
            <label class="f"><span>Загальна площа</span><div class="combo"><input class="field" data-k="areaValue" inputmode="decimal" value="${esc(form.areaValue)}" placeholder="160"><select class="field" data-k="areaUnit">${['м²', 'сот', 'га'].map((c) => `<option${c === form.areaUnit ? ' selected' : ''}>${c}</option>`).join('')}</select></div></label>
            <div class="f only-build">${areaInp('livingArea', 'livingUnit', 'Житлова площа', '95')}</div>
            <div class="f only-build">${areaInp('kitchenArea', 'kitchenUnit', 'Площа кухні', '18')}</div>
            <div class="f only-build">${areaInp('landArea', 'landUnit', 'Площа земельної ділянки', '10')}</div>
          </div></section>

        <section class="card only-build"><h2><i>4</i>Характеристики</h2><p class="hint">Заповнюйте все, що знаєте, — порожні поля на сайті не показуються.</p>
          <div class="fgrid three">
            ${inp('rooms', 'Кімнат', '3')}${inp('bedrooms', 'Спалень', '2')}${inp('bathrooms', 'Санвузлів', '2')}
            ${inp('floor', 'Поверх', '7')}${inp('floors', 'Поверхів у будинку', '12')}${inp('year', 'Рік будівництва', '2021')}
            ${inp('ceiling', 'Висота стель, м', '2,9')}
            <label class="f"><span>Стан</span><select class="field" data-k="condition">${opt(CONDITIONS, form.condition)}</select></label>
            <label class="f"><span>Матеріал стін</span><select class="field" data-k="walls">${opt(WALLS, form.walls)}</select></label>
            <label class="f"><span>Опалення</span><select class="field" data-k="heating">${opt(HEATING, form.heating)}</select></label>
          </div></section>

        <section class="card only-land"><h2><i>4</i>Про ділянку</h2><p class="hint">Цільове призначення і кадастровий номер підвищують довіру покупця.</p>
          <div class="fgrid">
            <label class="f"><span>Цільове призначення</span><select class="field" data-k="purpose">${opt(PURPOSES, form.purpose)}</select></label>
            ${inp('cadastre', 'Кадастровий номер', '3222400000:00:000:0000')}
          </div></section>

        <section class="card only-rent"><h2><i>5</i>Умови оренди</h2>
          <div class="fgrid three">${inp('rentTerm', 'Мінімальний строк', 'від 6 місяців')}${inp('deposit', 'Застава / комісія', 'застава 1 місяць, комісія 50%')}${inp('available', 'Доступно з', 'одразу')}</div></section>

        <section class="card"><h2><i>6</i>Фото</h2><p class="hint">Перше фото — головне. Фото автоматично стискаються для швидкого сайту.</p>
          <div class="drop" id="drop"><b>Перетягніть фото сюди або натисніть, щоб вибрати</b>JPG, PNG, WebP · можна кілька одразу</div>
          <input type="file" id="file" accept="image/*" multiple hidden>
          <div class="fgrid" style="margin-top:12px"><label class="f full"><span>Або додайте посилання на фото</span><div class="combo" style="grid-template-columns:1fr auto"><input class="field" id="urlIn" placeholder="https://…/photo.jpg"><button class="btn sm" type="button" id="urlAdd">Додати</button></div></label></div>
          <div class="photos" id="photos"></div>
          <div class="size-meter" id="meter"></div></section>

        <section class="card"><h2><i>7</i>Опис</h2><p class="hint">Чим повніший опис — тим більше дзвінків. Розділяйте абзаци порожнім рядком.</p>
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><button class="ibtn" type="button" id="tpl">Вставити шаблон опису</button><span style="font-size:13px;color:var(--muted);align-self:center" id="chars"></span></div>
          <textarea class="field" data-k="description" id="desc" placeholder="Розкажіть про об’єкт: планування, ремонт, комунікації, що поруч, умови угоди…">${esc(form.description)}</textarea>
          <label class="f" style="margin-top:14px"><span>Інфраструктура поруч</span><textarea class="field" data-k="infrastructure" style="min-height:90px" placeholder="Школа — 5 хв пішки, супермаркет — 300 м, ліс — 10 хв…">${esc(form.infrastructure)}</textarea></label>
          <label class="f" style="margin-top:14px"><span>Відеоогляд (посилання YouTube / Instagram)</span><input class="field" data-k="videoUrl" value="${esc(form.videoUrl)}" placeholder="https://"></label></section>

        <section class="card"><h2><i>8</i>Переваги та зручності</h2><p class="hint">Позначте все, що є. За деякими з них клієнти фільтрують каталог.</p>
          <div class="feat-groups">${Object.entries(FEATURES).map(([g, l]) => `<div><b>${g}</b><div class="chips">${l.map((f) => `<button type="button" class="chip" data-f="${esc(f)}" aria-pressed="${form.features.includes(f)}">${esc(f)}</button>`).join('')}</div></div>`).join('')}</div></section>
      </div>

      <aside class="sticky-side">
        <section class="card"><h2>Публікація</h2>
          <ul class="progress-list" id="prog"></ul>
          <div class="toggles" style="margin-bottom:18px">
            <label class="switch">Показувати на головній<input type="checkbox" data-k="featured"${form.featured ? ' checked' : ''}></label>
            <label class="switch">Продано / здано<input type="checkbox" data-k="sold"${form.sold ? ' checked' : ''}></label>
          </div>
          <div class="save-bar"><button class="btn block" id="save">${id ? 'Зберегти зміни' : 'Опублікувати об’єкт'}</button>${id ? `<a class="btn line block sm" href="object.html?id=${encodeURIComponent(id)}" target="_blank" rel="noopener">Переглянути на сайті</a>` : ''}</div>
        </section>
        <section class="card preview-card"><h2 style="margin-bottom:14px">Як виглядатиме картка</h2><div id="prev"></div></section>
      </aside>
    </div>`;

  $('#back').onclick = () => { if (dirty && !confirm('Вийти без збереження?')) return; showList(); };
  let dirty = false;
  $('#main').addEventListener('input', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    form[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; dirty = true; refresh();
  });
  $('#main').addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) { form[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; dirty = true; refresh(); } });
  $('#types').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; form.type = b.dataset.t; $$('#types button').forEach((x) => x.setAttribute('aria-pressed', x === b)); dirty = true; refresh(); };
  $$('.feat-groups .chip').forEach((c) => (c.onclick = () => { const f = c.dataset.f; form.features = form.features.includes(f) ? form.features.filter((x) => x !== f) : [...form.features, f]; c.setAttribute('aria-pressed', form.features.includes(f)); dirty = true; refresh(); }));
  $('#tpl').onclick = () => {
    if (!form.type) { alert('Спочатку оберіть тип об’єкта.'); return; }
    const t = TEMPLATES[form.type]; const ta = $('#desc');
    if (ta.value.trim() && !confirm('Додати шаблон у кінець вашого тексту?')) return;
    ta.value = (ta.value.trim() ? ta.value.trim() + '\n\n' : '') + t; form.description = ta.value; dirty = true; refresh(); ta.focus();
  };
  const drop = $('#drop');
  drop.onclick = () => $('#file').click();
  $('#file').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; };
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };
  $('#urlAdd').onclick = () => { const u = $('#urlIn').value.trim(); if (!/^https?:\/\//.test(u)) { alert('Вставте посилання, що починається з https://'); return; } photos.push(u); $('#urlIn').value = ''; dirty = true; drawPhotos(); };
  $('#photos').onclick = (e) => {
    const b = e.target.closest('[data-p]'); if (!b) return; const i = +b.dataset.i;
    if (b.dataset.p === 'main') photos.unshift(photos.splice(i, 1)[0]);
    if (b.dataset.p === 'left' && i > 0) [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]];
    if (b.dataset.p === 'del') photos.splice(i, 1);
    dirty = true; drawPhotos();
  };
  $('#save').onclick = () => save(id);
  drawPhotos(); refresh();
}

function refresh() {
  const t = form.type;
  $$('.only-build').forEach((e) => (e.hidden = t === 'Ділянка'));
  $$('.only-house').forEach((e) => (e.hidden = t !== 'Будинок'));
  $$('.only-land').forEach((e) => (e.hidden = t !== 'Ділянка'));
  $$('.only-rent').forEach((e) => (e.hidden = t !== 'Оренда'));
  let n = 1; $$('.editor > div > .card').forEach((c) => { const i = c.querySelector('h2 i'); if (i && !c.hidden) i.textContent = n++; });
  $('#rentHint').textContent = t === 'Оренда' ? 'Для оренди — ціна за місяць.' : '';
  $('#chars').textContent = `${form.description.length} символів${form.description.length < 400 ? ' · радимо від 600' : ''}`;
  const checks = [
    [!!t, 'Тип обрано'], [!!form.title.trim(), 'Є назва'], [!!form.location.trim(), 'Вказано локацію'], [form.priceValue !== '', 'Вказано ціну'],
    [photos.length >= 3, `Фото: ${photos.length} (радимо 5+)`], [form.description.length >= 400, 'Детальний опис'], [form.features.length >= 3, 'Позначено переваги'],
  ];
  $('#prog').innerHTML = checks.map(([ok, l]) => `<li class="${ok ? 'ok' : ''}">${l}</li>`).join('');
  $('#prev').innerHTML = cardHTML(norm('preview', { ...data(), images: photos }));
  $$('#prev .rv').forEach((e) => e.classList.add('in'));
}
function data() {
  const f = form;
  const priceValue = f.priceValue === '' ? null : parseFloat(String(f.priceValue).replace(/\s/g, '').replace(',', '.'));
  const areaValue = f.areaValue === '' ? null : parseFloat(String(f.areaValue).replace(',', '.'));
  const out = {
    type: f.type, title: f.title.trim(), location: f.location.trim(), address: f.address.trim(), complex: f.complex.trim(), code: f.code.trim(),
    priceValue, currency: f.currency, priceNote: f.priceNote.trim(),
    price: priceValue != null ? `${priceValue} ${f.currency}` : '',
    areaValue, areaUnit: f.areaUnit, area: areaValue != null ? `${areaValue} ${f.areaUnit}` : '',
    description: f.description.trim(), infrastructure: f.infrastructure.trim(), videoUrl: f.videoUrl.trim(),
    features: f.features, featured: !!f.featured, sold: !!f.sold,
  };
  if (f.type !== 'Ділянка') Object.assign(out, { livingArea: f.livingArea, livingUnit: f.livingUnit, kitchenArea: f.kitchenArea, kitchenUnit: f.kitchenUnit, landArea: f.landArea, landUnit: f.landUnit, rooms: f.rooms || '—', bedrooms: f.bedrooms, bathrooms: f.bathrooms, floor: f.floor, floors: f.floors, year: f.year, ceiling: f.ceiling, condition: f.condition, walls: f.walls, heating: f.heating });
  else Object.assign(out, { rooms: '—', purpose: f.purpose, cadastre: f.cadastre });
  if (f.type === 'Оренда') Object.assign(out, { rentTerm: f.rentTerm, deposit: f.deposit, available: f.available });
  return out;
}
const bytes = () => photos.reduce((s, p) => s + p.length, 0) + JSON.stringify(data()).length;
function drawPhotos() {
  $('#photos').innerHTML = photos.map((src, i) => `<div class="ph"><img src="${esc(src)}" alt="">${i === 0 ? '<span class="main">Головне</span>' : ''}<div class="tools">
    ${i ? `<button type="button" data-p="main" data-i="${i}" title="Зробити головним">${ICON.star}</button><button type="button" data-p="left" data-i="${i}" title="Перемістити вліво">${I.left}</button>` : ''}
    <button type="button" data-p="del" data-i="${i}" title="Видалити">${ICON.trash}</button></div></div>`).join('');
  if (S.firebase) {
    const b = bytes(), pct = Math.min(100, b / MAX_DOC * 100);
    $('#meter').className = 'size-meter' + (pct > 90 ? ' warn' : '');
    $('#meter').innerHTML = `Місце для фото: ${(b / 1024).toFixed(0)} КБ з ${(MAX_DOC / 1024).toFixed(0)} КБ${pct > 90 ? ' — забагато, видаліть кілька фото або додайте їх посиланнями' : ''}<div class="bar"><i style="width:${pct}%"></i></div>`;
  }
  refresh();
}
async function compress(file, max = S.firebase ? 1280 : 1600, q = S.firebase ? 0.68 : 0.8) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  } finally { URL.revokeObjectURL(url); }
}
async function addFiles(list) {
  const files = [...list].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  $('#drop').querySelector('b').textContent = `Обробляємо ${files.length} фото…`;
  for (const f of files) {
    try {
      let d = await compress(f);
      if (S.firebase && bytes() + d.length > MAX_DOC) d = await compress(f, 960, 0.6);
      if (S.firebase && bytes() + d.length > MAX_DOC) { alert('Досягнуто ліміту розміру об’єкта. Решту фото додайте посиланнями.'); break; }
      photos.push(d);
    } catch { alert(`Не вдалося прочитати файл ${f.name}`); }
  }
  $('#drop').querySelector('b').textContent = 'Перетягніть фото сюди або натисніть, щоб вибрати';
  drawPhotos();
}
async function save(id) {
  const d = data();
  if (!d.type) return alert('Оберіть тип об’єкта (крок 1).');
  if (!d.title) return alert('Вкажіть назву об’єкта.');
  if (!d.location) return alert('Вкажіть місто або район.');
  if (S.firebase && bytes() > MAX_DOC) return alert('Забагато фото для одного об’єкта. Видаліть кілька або додайте їх посиланнями.');
  d.images = photos; d.image = photos[0] || '';
  const b = $('#save'); b.disabled = true; b.textContent = 'Зберігаємо…';
  try {
    const newId = id ? (await store.update(id, d), id) : await store.add(d);
    toast(id ? 'Зміни збережено' : 'Об’єкт опубліковано');
    await reload();
    if (!id) openEditor(newId); else showList();
  } catch (err) { console.error(err); alert('Не вдалося зберегти: ' + err.message); b.disabled = false; b.textContent = 'Спробувати ще раз'; }
}

auth();
