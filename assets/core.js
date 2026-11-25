/* Realty template — data layer, helpers, layout, animations */
const S = window.SITE;
export { S };

/* ── types ── */
export const TYPES = [
  { id: 'Будинок', label: 'Будинки', one: 'Будинок', note: 'Приватні будинки та котеджі', img: S.catImages?.['Будинок'] },
  { id: 'Квартира', label: 'Квартири', one: 'Квартира', note: 'Новобудови та вторинний ринок', img: S.catImages?.['Квартира'] },
  { id: 'Ділянка', label: 'Ділянки', one: 'Ділянка', note: 'Земля під забудову та відпочинок', img: S.catImages?.['Ділянка'] },
  { id: 'Оренда', label: 'Оренда', one: 'Оренда', note: 'Довгострокова оренда житла', img: S.catImages?.['Оренда'], hidden: true },
  { id: 'Комерція', label: 'Комерційна нерухомість', one: 'Комерційна нерухомість', note: 'Офіси, магазини, склади', img: S.catImages?.['Комерція'] },
];
export const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t]));
/* Типи, які показуються відвідувачам (Оренду прибрано з сайту, старі об’єкти оренди лишаються доступні за посиланням). */
export const PUBLIC_TYPES = TYPES.filter((t) => !t.hidden);

export const CONDITIONS = ['Новобудова від забудовника', 'Дизайнерський ремонт', 'Євроремонт', 'Сучасний ремонт', 'Житловий стан', 'Під ремонт', 'Після будівельників'];
export const WALLS = ['Цегла', 'Моноліт', 'Газоблок', 'Керамоблок', 'Панель', 'Дерево / каркас', 'Інше'];
export const HEATING = ['Індивідуальне газове', 'Централізоване', 'Електричне', 'Тепловий насос', 'Твердопаливне', 'Комбіноване', 'Немає'];
export const PURPOSES = ['Будівництво житлового будинку (ІЖБ)', 'Особисте селянське господарство', 'Садівництво', 'Комерційне призначення', 'Сільськогосподарське'];
export const FEATURES = {
  'Комунікації': ['Світло', 'Газ', 'Вода (центральна)', 'Свердловина', 'Каналізація', 'Септик', 'Інтернет'],
  'Комфорт': ['Меблі', 'Побутова техніка', 'Кондиціонер', 'Тепла підлога', 'Камін', 'Гардеробна', 'Панорамні вікна'],
  'Простір': ['Балкон', 'Лоджія', 'Тераса', 'Сад', 'Басейн', 'Лазня / сауна', 'Гараж', 'Паркінг', 'Комора'],
  'Будинок і безпека': ['Ліфт', 'Укриття', 'Генератор / автономність', 'Охорона', 'Відеоспостереження', 'Закрита територія', 'Консьєрж'],
  'Поруч': ['Школа', 'Дитячий садок', 'Супермаркет', 'Ліс', 'Водойма', 'Парк', 'Метро', 'Зупинка транспорту'],
  'Умови': ['Можлива іпотека', 'Можлива розстрочка', 'Торг доречний', 'Можна з тваринами', 'Можна з дітьми', 'Документи готові'],
};

/* ── helpers ── */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeImg = (u) => { u = String(u || '').trim(); if (!u) return ''; if (u.startsWith('data:image/')) return u; try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
const toDate = (v) => (v?.toDate ? v.toDate() : v?.seconds ? new Date(v.seconds * 1000) : v ? new Date(v) : null);
const num = (v) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace(/[^\d.]/g, '')); return isFinite(n) ? n : null; };
export const fmt = (n) => (n == null ? '' : Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' '));
/* Курс НБУ на сьогодні (кешується в браузері на добу). Якщо НБУ недоступний — запасний курс. */
const RATE = { '$': 1, '€': 1.08, '₴': 1 / 41.5 };
export const FX = { usd: 41.5, eur: 44.8, date: '', live: false };
await (async () => {
  const day = new Date().toISOString().slice(0, 10);
  let r = null;
  try { r = JSON.parse(localStorage.getItem('nbu_rate') || 'null'); } catch {}
  if (!r || r.day !== day) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
      const list = await (await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json', { signal: ctl.signal })).json();
      clearTimeout(t);
      const get = (c) => list.find((x) => x.cc === c)?.rate;
      if (get('USD')) { r = { day, usd: get('USD'), eur: get('EUR') || get('USD') * 1.08, date: list[0]?.exchangedate || '' }; try { localStorage.setItem('nbu_rate', JSON.stringify(r)); } catch {} }
    } catch {}
  }
  if (r?.usd) { Object.assign(FX, { usd: r.usd, eur: r.eur, date: r.date, live: true }); RATE['₴'] = 1 / r.usd; RATE['€'] = r.eur / r.usd; }
})();

export function norm(id, d) {
  const p = { ...d, id };
  p.images = (Array.isArray(d.images) && d.images.length ? d.images : d.image ? [d.image] : []).map(safeImg).filter(Boolean);
  p.type = TYPE[d.type] ? d.type : 'Квартира';
  if (d.priceValue != null && d.priceValue !== '') { p.priceValue = num(d.priceValue); p.currency = d.currency || '$'; }
  else if (d.price) { p.priceValue = num(String(d.price).match(/[\d\s.,]+/)?.[0]); p.currency = /€/.test(d.price) ? '€' : /₴|грн|uah/i.test(d.price) ? '₴' : '$'; }
  else { p.priceValue = null; p.currency = '$'; }
  p.usd = p.priceValue != null ? p.priceValue * RATE[p.currency] : null;
  p.uah = p.usd != null ? p.usd * FX.usd : null;
  if (d.areaValue != null && d.areaValue !== '') { p.areaValue = num(d.areaValue); p.areaUnit = d.areaUnit || 'м²'; }
  else if (d.area) { p.areaValue = num(String(d.area).match(/[\d\s.,]+/)?.[0]); p.areaUnit = /сот/.test(d.area) ? 'сот' : /га/.test(d.area) ? 'га' : 'м²'; }
  else { p.areaValue = null; p.areaUnit = 'м²'; }
  p.roomsNum = num(d.rooms);
  p.date = toDate(d.addedAt);
  p.features = Array.isArray(d.features) ? d.features : [];
  p.title = d.title || 'Об’єкт без назви';
  p.location = d.location || '';
  return p;
}

/* Друга валюта: для цін у $ / € — гривні за курсом НБУ, для гривень — долари. */
export const altPrice = (p) => p.priceValue == null ? '' : p.currency === '₴' ? `≈ $${fmt(p.usd)}` : `≈ ${fmt(p.uah)} ₴`;
export const priceHTML = (p, cls = '') => p.priceValue == null ? `<span class="price ${cls}">Ціна за запитом</span>`
  : `<span class="price ${cls}">${p.currency === '₴' ? '' : p.currency}${fmt(p.priceValue)}${p.currency === '₴' ? ' ₴' : ''}${p.type === 'Оренда' ? ' <small>/ місяць</small>' : ''}<span class="price-alt" title="За курсом НБУ${FX.date ? ' на ' + FX.date : ''}">${altPrice(p)}${p.type === 'Оренда' ? ' / міс' : ''}</span></span>`;
export const priceText = (p) => p.priceValue == null ? 'За запитом' : `${p.currency === '₴' ? '' : p.currency}${fmt(p.priceValue)}${p.currency === '₴' ? ' ₴' : ''}${p.type === 'Оренда' ? ' / міс' : ''} (${altPrice(p)})`;
export const areaText = (p) => (p.areaValue != null ? `${String(p.areaValue).replace('.', ',')} ${p.areaUnit}` : '');

/* ── icons ── */
export const I = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 18V7M3 13h18v5M7 13V10h5a3 3 0 0 1 3 3"/></svg>',
  floor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.1-1.6M12 6v2M12 16v2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M13 3 5 14h6l-1 7 8-11h-6z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m15 5-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m9 5 7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
};

/* ── data ── */
/* База — Supabase: таблиця grandlife_properties (id, data jsonb, created_at), фото — бакет grandlife-photos. Схема: supabase/schema.sql */
const TABLE = 'grandlife_properties';
const BUCKET = 'grandlife-photos';
const LEADS = 'grandlife_leads';
let supaP = null;
export function supa() {
  if (!supaP) supaP = (async () => {
    if (!window.supabase) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = res; s.onerror = rej; document.head.append(s); });
    return window.supabase.createClient(S.supabase.url, S.supabase.key);
  })();
  return supaP;
}
const check = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const row = (r) => ({ ...r.data, id: r.id, addedAt: r.data?.addedAt || r.created_at });

/* Фото у вигляді data:… завантажуються в Storage, у базі лишається лише посилання. */
async function uploadImages(id, list) {
  const sb = await supa();
  return Promise.all((list || []).map(async (src) => {
    if (!String(src).startsWith('data:image/')) return src;
    const blob = await (await fetch(src)).blob();
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' }));
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }));
}
async function withPhotos(id, data) {
  if (!('images' in data)) return data;
  const images = await uploadImages(id, data.images);
  return { ...data, images, image: images[0] || '' };
}
const DEMO_KEY = (S.storageKey || 'realty') + '_props_v1';
async function demoAll() {
  try { const s = localStorage.getItem(DEMO_KEY); if (s) return JSON.parse(s); } catch {}
  const list = await (await fetch('data/demo.json')).json();
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch {}
  return list;
}
const demoSave = (list) => { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); };

export const store = {
  demo: !S.supabase,
  async all() {
    return (await store.raw()).map((d) => norm(d.id, d));
  },
  async one(id) {
    if (!S.supabase) { const d = (await demoAll()).find((x) => x.id === id); return d ? norm(d.id, d) : null; }
    const r = check(await (await supa()).from(TABLE).select('*').eq('id', id).maybeSingle());
    return r ? norm(r.id, row(r)) : null;
  },
  async raw() {
    if (!S.supabase) return demoAll();
    return check(await (await supa()).from(TABLE).select('*').order('created_at', { ascending: false })).map(row);
  },
  /* id і addedAt можна передати явно — так переносимо об'єкти з Firebase зі старими посиланнями. */
  async add(data, id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)) {
    if (!S.supabase) { const l = await demoAll(); l.unshift({ ...data, id, addedAt: new Date().toISOString() }); demoSave(l); return id; }
    const d = await withPhotos(id, data);
    const created_at = d.addedAt || new Date().toISOString();
    check(await (await supa()).from(TABLE).insert({ id, data: { ...d, addedAt: created_at }, created_at }));
    return id;
  },
  async update(id, data) {
    if (!S.supabase) { const l = await demoAll(); const i = l.findIndex((x) => x.id === id); if (i > -1) l[i] = { ...l[i], ...data }; demoSave(l); return; }
    const sb = await supa();
    const cur = check(await sb.from(TABLE).select('data').eq('id', id).single());
    const d = await withPhotos(id, data);
    check(await sb.from(TABLE).update({ data: { ...cur.data, ...d, updatedAt: new Date().toISOString() } }).eq('id', id));
    if ('images' in d) { // прибрати зі сховища фото, які видалили з об'єкта
      const keep = new Set(d.images.map((u) => decodeURIComponent(String(u).split(`/${BUCKET}/`)[1] || '')));
      const files = (await sb.storage.from(BUCKET).list(id)).data || [];
      const gone = files.map((f) => `${id}/${f.name}`).filter((f) => !keep.has(f));
      if (gone.length) await sb.storage.from(BUCKET).remove(gone);
    }
  },
  async remove(id) {
    if (!S.supabase) { demoSave((await demoAll()).filter((x) => x.id !== id)); return; }
    const sb = await supa();
    check(await sb.from(TABLE).delete().eq('id', id));
    const files = (await sb.storage.from(BUCKET).list(id)).data || [];
    if (files.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`));
  },
  resetDemo() { localStorage.removeItem(DEMO_KEY); },
  /* Заявки з реклами (вікно і банер). Відвідувач може лише додати заявку; читати й змінювати — тільки адмін. */
  async lead(d) {
    const KINDS = ['Продаж', 'Оренда', 'Купівля', 'Шукає оренду', 'Юридична послуга'], OBJS = ['Квартира', 'Будинок', 'Ділянка', 'Комерція'];
    const kind = KINDS.includes(d.kind) ? d.kind : 'Продаж';
    const object = kind === 'Юридична послуга' ? String(d.object || '').slice(0, 80) : OBJS.includes(d.object) ? d.object : '';
    const row = { kind, object, name: String(d.name || '').slice(0, 80), phone: String(d.phone || '').slice(0, 30), page: String(d.page || '').slice(0, 60) };
    if (!S.supabase) { const l = JSON.parse(localStorage.getItem(DEMO_KEY + '_leads') || '[]'); l.unshift({ ...row, id: Date.now(), created_at: new Date().toISOString(), done: false }); localStorage.setItem(DEMO_KEY + '_leads', JSON.stringify(l)); return; }
    check(await (await supa()).from(LEADS).insert(row));
  },
  async leads() {
    if (!S.supabase) return JSON.parse(localStorage.getItem(DEMO_KEY + '_leads') || '[]');
    return check(await (await supa()).from(LEADS).select('*').order('created_at', { ascending: false }).limit(500));
  },
  async leadUpdate(id, patch) {
    if (!S.supabase) { const l = await store.leads(); const r = l.find((x) => x.id === id); if (r) Object.assign(r, patch); localStorage.setItem(DEMO_KEY + '_leads', JSON.stringify(l)); return; }
    check(await (await supa()).from(LEADS).update(patch).eq('id', id));
  },
  async leadRemove(id) {
    if (!S.supabase) { localStorage.setItem(DEMO_KEY + '_leads', JSON.stringify((await store.leads()).filter((x) => x.id !== id))); return; }
    check(await (await supa()).from(LEADS).delete().eq('id', id));
  },
};

/* ── card ── */
export const shortPurpose = (s) => (s.match(/\(([^)]+)\)/)?.[1] || s.split(' ').slice(0, 2).join(' '));
export function cardHTML(p, i = 0) {
  const img = p.images[0];
  const specs = [
    areaText(p) && `<span>${I.area}${areaText(p)}</span>`,
    p.type !== 'Ділянка' && p.roomsNum && `<span>${I.bed}${p.roomsNum} кімн.</span>`,
    p.floor && `<span>${I.floor}${esc(p.floor)}${p.floors ? '/' + esc(p.floors) : ''} пов.</span>`,
    p.type === 'Ділянка' && p.purpose && `<span>${I.floor}${esc(shortPurpose(p.purpose))}</span>`,
  ].filter(Boolean).join('');
  return `<a class="pcard rv${p.sold ? ' is-sold' : ''}" style="--d:${(i % 3) * 0.07}s" href="object.html?id=${encodeURIComponent(p.id)}">
    <div class="pcard-img">
      ${img ? `<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">` : `<div class="noimg"><img src="${S.mark}" alt=""></div>`}
      <div class="badges"><span class="badge">${esc(TYPE[p.type].one)}</span>${p.featured ? `<span class="badge accent">${esc(S.featuredLabel || 'Ексклюзив')}</span>` : ''}${p.sold ? `<span class="badge sold">${p.type === 'Оренда' ? 'Здано' : 'Продано'}</span>` : ''}</div>
      ${p.images.length > 1 ? `<span class="pcount">${I.photo}${p.images.length}</span>` : ''}
    </div>
    <div class="pcard-body">
      ${priceHTML(p)}
      <h3>${esc(p.title)}</h3>
      ${p.location ? `<div class="loc">${I.pin}<span>${esc(p.location)}</span></div>` : ''}
      ${specs ? `<div class="specs">${specs}</div>` : ''}
    </div>
  </a>`;
}

/* ── layout ── */
export function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 2200); }
export const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

export function layout({ page = '', overDark = false } = {}) {
  document.documentElement.classList.add('js');
  const links = [['index.html', 'Головна', 'home'], ['catalog.html', 'Об’єкти', 'catalog'], ['legal.html', 'Юридичні послуги', 'legal'], ['about.html', 'Про нас', 'about'], ['index.html?to=contacts', 'Контакти', 'contacts']];
  const nav = links.map(([h, t, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const phone = S.phones?.[0];
  const logo = `<a class="logo" href="index.html" aria-label="${esc(S.name)} — на головну"><img class="on-light" src="${S.logo}" alt="${esc(S.name)}"><img class="on-dark" src="${S.logoLight}" alt=""></a>`;
  document.body.insertAdjacentHTML('afterbegin', `
  <header class="hdr${overDark ? ' over-dark' : ' always'}"><div class="wrap">${logo}<nav class="nav" aria-label="Меню">${nav}</nav>
    ${phone ? `<a class="hdr-phone" href="${telHref(phone)}">${esc(phone)}</a>` : ''}
    <a class="btn sm" href="catalog.html">Знайти житло</a>
    <button class="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span></button></div></header>
  <nav class="drawer" aria-label="Мобільне меню">${links.map(([h, t]) => `<a class="big" href="${h}">${t}</a>`).join('')}
    ${phone ? `<a class="btn" href="${telHref(phone)}">${I.phone}${esc(phone)}</a>` : ''}<small>${esc(S.region || '')}</small></nav>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="ftr"><div class="wrap"><div class="ftr-grid">
    <div><a class="logo" href="index.html"><img src="${S.logoLight}" alt="${esc(S.name)}" style="height:calc(var(--logo-h,44px) * 1.1)"></a><p>${esc(S.footerText)}</p></div>
    <div><h5>Об’єкти</h5><ul>${PUBLIC_TYPES.map((t) => `<li><a href="catalog.html?type=${encodeURIComponent(t.id)}">${t.label}</a></li>`).join('')}</ul></div>
    <div><h5>Компанія</h5><ul><li><a href="about.html">Про нас</a></li><li><a href="legal.html">Юридичні послуги</a></li><li><a href="about.html?to=process">Як ми працюємо</a></li><li><a href="about.html?to=faq">Питання і відповіді</a></li><li><a href="index.html?to=contacts">Контакти</a></li></ul></div>
    <div><h5>Контакти</h5><ul>${(S.phones || []).map((p) => `<li><a href="${telHref(p)}">${esc(p)}</a></li>`).join('')}${S.email ? `<li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>` : ''}${S.instagram ? `<li><a href="https://instagram.com/${esc(S.instagram)}" target="_blank" rel="noopener">@${esc(S.instagram)}</a></li>` : ''}<li>${esc(S.region || '')}</li></ul></div>
  </div><div class="ftr-bottom"><span>© ${new Date().getFullYear()} ${esc(S.name)}. Усі права захищені.</span><a href="admin.html">Вхід для менеджера</a></div></div></footer>`);

  const hdr = $('.hdr'); const burger = $('.burger');
  const setMenu = (o) => { document.body.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o); };
  burger.onclick = () => setMenu(!document.body.classList.contains('menu-open'));
  $$('.drawer a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('solid', y > 30);
    hdr.classList.toggle('hide', y > 500 && y > last && !document.body.classList.contains('menu-open'));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  reveal();

  /* Сторінка завжди відкривається зверху. До розділу (?to=contacts) гортаємо лише після кліку по меню. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const params = new URLSearchParams(location.search);
  const target = params.get('to');
  if (location.hash || target) {
    params.delete('to');
    const q = params.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
  }
  scrollTo(0, 0);
  if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 400);
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('a[href*="?to="]').forEach((a) => {
    const [file, q] = a.getAttribute('href').split('?');
    if (file !== here) return;
    a.addEventListener('click', (e) => {
      const el = document.getElementById(new URLSearchParams(q).get('to'));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  // Реклама для власників: вікно при відкритті і банер унизу (assets/promo.js).
  if (S.promo !== false) import('./promo.js?v=20261132').then((m) => m.promo()).catch((e) => console.error(e));
}

const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .05 }) : null;
export function reveal(root = document) { $$('.rv:not(.in), .rv-img:not(.in)', root).forEach((el) => (io ? io.observe(el) : el.classList.add('in'))); }
