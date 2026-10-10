(() => {
  'use strict';

  // ================================================================
  // Data
  // ================================================================
  const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const TYPE_COLORS = {
    normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', grass: '#7ac74c', electric: '#e5be1c',
    ice: '#7dd3d0', fighting: '#c22e28', poison: '#a33ea1', ground: '#d4a84c', flying: '#a98ff3',
    psychic: '#f95587', bug: '#a6b91a', rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc',
    dark: '#705746', steel: '#9fa0b8', fairy: '#d685ad',
  };
  const DEX = POKEDEX.map(([id, name, gen, leg, types, s]) => ({
    id, name, gen, leg: !!leg, types: types.map((i) => TYPES[i]),
    s: { hp: s[0], atk: s[1], def: s[2], spa: s[3], spd: s[4], spe: s[5] },
  }));
  const BY_ID = new Map(DEX.map((p) => [p.id, p]));
  const GENS = [
    [1, 'Kanto'], [2, 'Johto'], [3, 'Hoenn'], [4, 'Sinnoh'], [5, 'Unova'],
    [6, 'Kalos'], [7, 'Alola'], [8, 'Galar'], [9, 'Paldea'], [0, 'All'],
  ];
  const REGION = Object.fromEntries(GENS);

  // Position definitions: which line they're on and how base stats map to a rating.
  // pow = the better of Atk/SpA, fin = the other one.
  const LINES = {
    GK: { name: 'Goalkeeper', color: '#f5c84c' },
    DEF: { name: 'Defense', color: '#6aa8ff' },
    MID: { name: 'Midfield', color: '#5ee08a' },
    FWD: { name: 'Attack', color: '#ff7a7a' },
    SUB: { name: 'Bench', color: '#b9c0cc' },
  };
  const POS = {
    GK: { line: 'GK', w: { hp: 0.35, def: 0.3, spd: 0.35 } },
    CB: { line: 'DEF', w: { hp: 0.2, atk: 0.15, def: 0.45, spd: 0.2 } },
    LB: { line: 'DEF', w: { hp: 0.1, atk: 0.1, def: 0.35, spd: 0.15, spe: 0.3 } },
    RB: { line: 'DEF', w: { hp: 0.1, atk: 0.1, def: 0.35, spd: 0.15, spe: 0.3 } },
    LWB: { line: 'DEF', w: { hp: 0.1, atk: 0.15, def: 0.25, spd: 0.1, spe: 0.4 } },
    RWB: { line: 'DEF', w: { hp: 0.1, atk: 0.15, def: 0.25, spd: 0.1, spe: 0.4 } },
    CDM: { line: 'MID', w: { hp: 0.2, atk: 0.15, def: 0.3, spa: 0.05, spd: 0.25, spe: 0.05 } },
    CM: { line: 'MID', w: { hp: 0.15, atk: 0.15, def: 0.15, spa: 0.2, spd: 0.15, spe: 0.2 } },
    LM: { line: 'MID', w: { hp: 0.1, atk: 0.15, def: 0.1, spa: 0.15, spd: 0.1, spe: 0.4 } },
    RM: { line: 'MID', w: { hp: 0.1, atk: 0.15, def: 0.1, spa: 0.15, spd: 0.1, spe: 0.4 } },
    CAM: { line: 'MID', w: { hp: 0.1, pow: 0.25, fin: 0.15, spd: 0.1, spe: 0.4 } },
    LW: { line: 'FWD', w: { hp: 0.05, pow: 0.3, fin: 0.15, spd: 0.05, spe: 0.45 } },
    RW: { line: 'FWD', w: { hp: 0.05, pow: 0.3, fin: 0.15, spd: 0.05, spe: 0.45 } },
    ST: { line: 'FWD', w: { hp: 0.1, pow: 0.45, fin: 0.15, spe: 0.3 } },
  };

  // [position, x%, y%] — ordered back to front so players map sensibly between formations.
  const FORMATIONS = {
    '4-3-3': [['GK', 50, 88], ['LB', 13, 68], ['CB', 37, 72], ['CB', 63, 72], ['RB', 87, 68],
      ['CM', 25, 47], ['CDM', 50, 52], ['CM', 75, 47], ['LW', 16, 23], ['ST', 50, 17], ['RW', 84, 23]],
    '4-4-2': [['GK', 50, 88], ['LB', 13, 68], ['CB', 37, 72], ['CB', 63, 72], ['RB', 87, 68],
      ['LM', 13, 44], ['CM', 37, 49], ['CM', 63, 49], ['RM', 87, 44], ['ST', 34, 20], ['ST', 66, 20]],
    '4-2-3-1': [['GK', 50, 88], ['LB', 13, 70], ['CB', 37, 74], ['CB', 63, 74], ['RB', 87, 70],
      ['CDM', 33, 55], ['CDM', 67, 55], ['LM', 15, 34], ['CAM', 50, 37], ['RM', 85, 34], ['ST', 50, 16]],
    '3-5-2': [['GK', 50, 88], ['CB', 26, 72], ['CB', 50, 74], ['CB', 74, 72],
      ['LWB', 11, 50], ['CM', 31, 45], ['CDM', 50, 56], ['CM', 69, 45], ['RWB', 89, 50], ['ST', 36, 19], ['ST', 64, 19]],
    '5-3-2': [['GK', 50, 88], ['LWB', 10, 62], ['CB', 30, 73], ['CB', 50, 75], ['CB', 70, 73], ['RWB', 90, 62],
      ['CM', 27, 47], ['CM', 50, 51], ['CM', 73, 47], ['ST', 36, 20], ['ST', 64, 20]],
    '3-4-3': [['GK', 50, 88], ['CB', 26, 72], ['CB', 50, 74], ['CB', 74, 72],
      ['LM', 13, 48], ['CM', 37, 51], ['CM', 63, 51], ['RM', 87, 48], ['LW', 18, 23], ['ST', 50, 17], ['RW', 82, 23]],
  };
  const BENCH_SIZE = 5;

  const CLUBS = [
    'Pallet Town FC', 'Viridian City', 'Pewter Rock', 'Cerulean Athletic', 'Vermilion United',
    'Lavender Spirits', 'Celadon Rovers', 'Fuchsia Wanderers', 'Saffron City', 'Cinnabar Albion',
    'Goldenrod Galaxy', 'Ecruteak Rangers', 'Olivine Harbour', 'Blackthorn Dragons', 'Rustboro FC',
    'Lilycove Rovers', 'Sootopolis United', 'Hearthome Hotspur', 'Castelia City',
  ];

  // ================================================================
  // Helpers
  // ================================================================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  function rating(p, pos) {
    if (!p) return 0;
    const w = POS[pos].w;
    const s = p.s;
    const pow = Math.max(s.atk, s.spa), fin = Math.min(s.atk, s.spa);
    let raw = 0;
    for (const k in w) raw += w[k] * (k === 'pow' ? pow : k === 'fin' ? fin : s[k]);
    return clamp(Math.round(18 + raw * 0.62), 30, 99);
  }
  function bestPos(p) {
    let best = 'CM', v = -1;
    for (const k in POS) { const r = rating(p, k); if (r > v) { v = r; best = k; } }
    return { pos: best, ovr: v };
  }
  const lineOf = (pos) => (POS[pos] ? POS[pos].line : 'SUB');
  const posColor = (pos) => LINES[lineOf(pos)].color;

  function spriteUrl(id, style) {
    if (style === 'art') return `${SPR}other/official-artwork/${id}.png`;
    if (style === 'retro') {
      if (id <= 151) return `${SPR}versions/generation-i/yellow/transparent/${id}.png`;
      if (id <= 251) return `${SPR}versions/generation-ii/crystal/transparent/${id}.png`;
      if (id <= 386) return `${SPR}versions/generation-iii/emerald/${id}.png`;
      if (id <= 493) return `${SPR}versions/generation-iv/platinum/${id}.png`;
    }
    return `${SPR}${id}.png`;
  }
  const imgTag = (id, style, cls = '') =>
    `<img class="${cls}" src="${spriteUrl(id, style)}" alt="" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='${SPR}other/official-artwork/${id}.png'">`;
  const typeDots = (p) => `<span class="types">${p.types.map((t) => `<i title="${t}" style="background:${TYPE_COLORS[t]}"></i>`).join('')}</span>`;

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 1800);
  }

  // Team strength from an XI in a formation
  function teamRatings(fKey, xi) {
    const f = FORMATIONS[fKey];
    const by = { GK: [], DEF: [], MID: [], FWD: [] };
    let sum = 0;
    f.forEach(([pos], i) => {
      const r = xi[i] ? rating(BY_ID.get(xi[i]), pos) : 25;
      by[POS[pos].line].push(r); sum += r;
    });
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const gk = avg(by.GK), def = avg(by.DEF), mid = avg(by.MID), att = avg(by.FWD);
    return {
      ovr: Math.round(sum / f.length), gk: Math.round(gk), def: Math.round(def), mid: Math.round(mid), att: Math.round(att),
      attack: 0.6 * att + 0.4 * mid,
      defense: 0.55 * def + 0.25 * gk + 0.2 * mid,
    };
  }
  // Ratings panel: built once, then numbers count and bars slide on every change.
  function updateRatings(el, r) {
    if (!el.querySelector('.team-ovr')) {
      const bar = (k, c) => `<div class="bar-row" data-k="${k}"><span>${k.toUpperCase()}</span><div class="bar"><i style="width:0;background:${c}"></i></div><span class="v">0</span></div>`;
      el.innerHTML = `<div class="team-ovr"><div class="num">0</div><div class="cap">Team OVR</div><div class="delta"></div></div>
        ${bar('att', LINES.FWD.color)}${bar('mid', LINES.MID.color)}${bar('def', LINES.DEF.color)}${bar('gk', LINES.GK.color)}`;
    }
    const num = el.querySelector('.team-ovr .num');
    const prev = num.dataset.v == null ? null : +num.dataset.v;
    tweenNum(num, r.ovr);
    if (prev != null && prev !== r.ovr) {
      const d = el.querySelector('.delta');
      d.textContent = (r.ovr > prev ? '+' : '') + (r.ovr - prev);
      d.className = 'delta ' + (r.ovr > prev ? 'up' : 'down');
      void d.offsetWidth;
      d.classList.add('show');
    }
    for (const k of ['att', 'mid', 'def', 'gk']) {
      const row = el.querySelector(`[data-k="${k}"]`);
      requestAnimationFrame(() => { row.querySelector('i').style.width = clamp(r[k], 0, 99) + '%'; });
      tweenNum(row.querySelector('.v'), r[k]);
    }
  }
  function tweenNum(node, to) {
    const from = +node.dataset.v || 0;
    node.dataset.v = to;
    cancelAnimationFrame(node._raf);
    if (from === to || REDUCE) { node.textContent = to; return; }
    const t0 = performance.now(), dur = 500;
    const f = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * e);
      if (k < 1) node._raf = requestAnimationFrame(f);
    };
    node._raf = requestAnimationFrame(f);
  }

  function confetti(n = 160) {
    if (REDUCE) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    const dpr = devicePixelRatio || 1, W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
    const ctx = c.getContext('2d');
    const cols = ['#5ee08a', '#f5c84c', '#6aa8ff', '#ff7a7a', '#d685ad', '#ffffff'];
    const ps = Array.from({ length: n }, () => ({
      x: W * (0.25 + Math.random() * 0.5), y: H * 0.4,
      vx: (Math.random() - 0.5) * W * 0.022, vy: -(H * 0.008 + Math.random() * H * 0.024),
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      s: (6 + Math.random() * 7) * dpr, c: cols[rand(cols.length)],
    }));
    const t0 = performance.now();
    const f = (t) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += H * 0.0009; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
      if (t - t0 < 3200) requestAnimationFrame(f); else c.remove();
    };
    requestAnimationFrame(f);
  }
  const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* ignore */ } };
  const statLine = (p) => `HP ${p.s.hp} · Atk ${p.s.atk} · Def ${p.s.def} · SpA ${p.s.spa} · SpD ${p.s.spd} · Spe ${p.s.spe}`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  // ================================================================
  // State
  // ================================================================
  const S = Object.assign({ view: 'builder', sprite: 'pixel' }, store.get('pxi.settings', {}));
  let B = store.get('pxi.builder', null); // builder state
  let C = store.get('pxi.challenge', null) || newChallenge(); // challenge state
  let ST = Object.assign({ best: null, bestRec: null, runs: 0 }, store.get('pxi.stats', {}));

  function saveAll() {
    store.set('pxi.settings', S);
    store.set('pxi.builder', B);
    store.set('pxi.challenge', C);
    store.set('pxi.stats', ST);
  }

  function builderPool() {
    return DEX.filter((p) => (B.gen === 0 || p.gen === B.gen) && (B.leg || !p.leg));
  }

  // Greedy "best XI": assign the highest (slot, pokémon) ratings first.
  function bestXI(fKey, pool, withBench) {
    const f = FORMATIONS[fKey];
    const pairs = [];
    f.forEach(([pos], i) => { for (const p of pool) pairs.push([rating(p, pos), i, p.id]); });
    pairs.sort((a, b) => b[0] - a[0]);
    const xi = Array(11).fill(null), used = new Set();
    let filled = 0;
    for (const [, i, id] of pairs) {
      if (filled === 11) break;
      if (xi[i] != null || used.has(id)) continue;
      xi[i] = id; used.add(id); filled++;
    }
    const subs = Array(BENCH_SIZE).fill(null);
    if (withBench) {
      const rest = pool.filter((p) => !used.has(p.id)).map((p) => [bestPos(p).ovr, p.id]).sort((a, b) => b[0] - a[0]);
      rest.slice(0, BENCH_SIZE).forEach(([, id], i) => { subs[i] = id; });
    }
    return { xi, subs };
  }

  function defaultBuilder() {
    const b = { f: '4-3-3', gen: 1, leg: false, bench: false, ovr: true, xi: [], subs: Array(BENCH_SIZE).fill(null) };
    B = b;
    Object.assign(b, bestXI(b.f, builderPool(), b.bench));
    return b;
  }

  // URL hash <-> builder state
  function encodeHash() {
    const p = new URLSearchParams({
      f: B.f, g: B.gen, l: B.leg ? 1 : 0, b: B.bench ? 1 : 0,
      x: B.xi.map((v) => v || 0).join('.'),
    });
    if (B.bench) p.set('u', B.subs.map((v) => v || 0).join('.'));
    return '#' + p.toString();
  }
  function decodeHash() {
    if (!location.hash.includes('x=')) return null;
    const p = new URLSearchParams(location.hash.slice(1));
    const ids = (s, n) => {
      const a = (s || '').split('.').map((v) => +v || null).map((v) => (BY_ID.has(v) ? v : null));
      while (a.length < n) a.push(null);
      return a.slice(0, n);
    };
    const f = FORMATIONS[p.get('f')] ? p.get('f') : '4-3-3';
    const gen = clamp(+p.get('g') || 0, 0, 9);
    return {
      f, gen, leg: p.get('l') === '1', bench: p.get('b') === '1', ovr: true,
      xi: ids(p.get('x'), 11), subs: ids(p.get('u'), BENCH_SIZE),
    };
  }

  // ================================================================
  // Pitch rendering (shared by builder & challenge)
  // ================================================================
  const playersEl = $('#players');
  const benchEl = $('#bench');

  function currentSquad() {
    if (S.view === 'challenge') return { f: C.f, xi: C.xi, subs: [], bench: false, showOvr: true };
    return { f: B.f, xi: B.xi, subs: B.subs, bench: B.bench, showOvr: B.ovr };
  }

  function playerInner(id, pos, showOvr, fitText) {
    const sprite = S.sprite;
    if (!id) {
      return `<div class="slot-ring">+</div>
        <div class="plate"><div class="nm" style="opacity:.6">Empty</div><div class="meta"><span class="pos">${pos}</span></div></div>
        <div class="fit">${fitText || ''}</div>`;
    }
    const p = BY_ID.get(id);
    const isSub = pos === 'SUB';
    const r = isSub ? bestPos(p) : { pos, ovr: rating(p, pos) };
    return `${imgTag(id, sprite, 'sprite')}
      <div class="plate"><div class="nm">${esc(p.name)}</div>
      <div class="meta"><span class="pos">${isSub ? r.pos : pos}</span>${showOvr ? `<span class="ovr">${r.ovr}</span>` : ''}</div></div>`;
  }

  function renderPitch() {
    const sq = currentSquad();
    const f = FORMATIONS[sq.f];
    const pick = S.view === 'challenge' && C.phase === 'draft' && C.pick ? BY_ID.get(C.pick) : null;
    playersEl.classList.toggle('locked', S.view === 'challenge');

    // Keyed update so players glide when the formation changes.
    while (playersEl.children.length < 11) {
      const d = document.createElement('div');
      d.className = 'player';
      d.dataset.slot = playersEl.children.length;
      playersEl.appendChild(d);
    }
    let popN = 0;
    f.forEach(([pos, x, y], i) => {
      const el = playersEl.children[i];
      const id = sq.xi[i];
      const prevId = el.dataset.id;
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.style.setProperty('--pc', posColor(pos));
      el.className = 'player' + (id ? '' : ' empty') + (S.sprite === 'art' ? ' art' : '') + (pick && !id ? ' placeable' : '');
      const fit = pick && !id ? `${rating(pick, pos)} fit` : '';
      const key = `${id}|${pos}|${S.sprite}|${sq.showOvr}|${fit}`;
      if (el.dataset.key !== key) {
        el.innerHTML = playerInner(id, pos, sq.showOvr, fit);
        el.dataset.key = key;
        // New face in this slot: pop it in (staggered when many change at once, e.g. Randomize).
        if (id && prevId !== String(id) && !REDUCE) {
          const delay = popN++ * 35 + 'ms';
          el.querySelectorAll('.sprite, .plate').forEach((n) => { n.style.animationDelay = delay; n.classList.add('pop'); });
        }
      }
      el.dataset.id = id || '';
    });

    // Bench
    benchEl.hidden = !sq.bench;
    $('.pitch-wrap').classList.toggle('has-bench', sq.bench);
    const bkey = `${sq.subs.join('.')}|${S.sprite}|${sq.showOvr}`;
    if (sq.bench && benchEl.dataset.key !== bkey) {
      benchEl.dataset.key = bkey;
      benchEl.innerHTML = `<div class="bench-title">Substitutes</div><div class="bench-row">${sq.subs.map((id, i) =>
        `<div class="player${id ? '' : ' empty'}${S.sprite === 'art' ? ' art' : ''}" data-slot="${11 + i}" style="--pc:${LINES.SUB.color}">${playerInner(id, 'SUB', sq.showOvr)}</div>`).join('')}</div>`;
    }
  }

  // ================================================================
  // Builder
  // ================================================================
  function getSlot(slot) { return slot < 11 ? B.xi[slot] : B.subs[slot - 11]; }
  function setSlot(slot, id) { if (slot < 11) B.xi[slot] = id; else B.subs[slot - 11] = id; }
  function slotPos(slot) { return slot < 11 ? FORMATIONS[B.f][slot][0] : 'SUB'; }
  function findSlot(id) {
    let i = B.xi.indexOf(id);
    if (i >= 0) return i;
    if (B.bench) { i = B.subs.indexOf(id); if (i >= 0) return 11 + i; }
    return -1;
  }
  function swapSlots(a, b) { const t = getSlot(a); setSlot(a, getSlot(b)); setSlot(b, t); }

  function renderBuilderPanel() {
    $$('#formation-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === B.f));
    $$('#bench-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === (B.bench ? '1' : '0')));
    $$('#ovr-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === (B.ovr ? '1' : '0')));
    $$('#gen-grid button').forEach((b) => b.classList.toggle('on', +b.dataset.v === B.gen));
    $('#leg-toggle').checked = B.leg;
    updateRatings($('#team-ratings'), teamRatings(B.f, B.xi));
    $('#btn-undo').disabled = !undoStack.length;
    $('#btn-redo').disabled = !redoStack.length;
  }

  // ---------------- Undo / redo (builder lineup changes) ----------------
  const undoStack = [], redoStack = [];
  let lastSnap = null;
  const snapB = () => JSON.stringify({ f: B.f, gen: B.gen, leg: B.leg, bench: B.bench, xi: B.xi, subs: B.subs });
  function trackHistory() {
    const s = snapB();
    if (lastSnap && s !== lastSnap) {
      undoStack.push(lastSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    }
    lastSnap = s;
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapB());
    Object.assign(B, JSON.parse(undoStack.pop()));
    lastSnap = snapB();
    render(); toast('Undone');
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapB());
    Object.assign(B, JSON.parse(redoStack.pop()));
    lastSnap = snapB();
    render(); toast('Redone');
  }

  function renderSpriteSegs() {
    $$('[data-sprite-seg] button').forEach((b) => b.classList.toggle('on', b.dataset.v === S.sprite));
  }

  function render() {
    $('#builder-panel').hidden = S.view !== 'builder';
    $('#challenge-panel').hidden = S.view !== 'challenge';
    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === S.view));
    document.title = S.view === 'challenge' ? '38–0 Challenge · Pokémon Starting XI' : 'Pokémon Starting XI';
    renderSpriteSegs();
    if (S.view === 'builder') { trackHistory(); renderBuilderPanel(); } else renderChallenge();
    renderPitch();
    saveAll();
  }

  function initControls() {
    $('#formation-seg').innerHTML = Object.keys(FORMATIONS).map((k) => `<button data-v="${k}">${k}</button>`).join('');
    $('#ch-formation-seg').innerHTML = $('#formation-seg').innerHTML;
    $('#gen-grid').innerHTML = GENS.map(([g, n]) => `<button data-v="${g}"><b>${n}</b><small>${g ? 'Gen ' + g : 'Gen 1–9'}</small></button>`).join('');
    $$('[data-sprite-seg]').forEach((el) => {
      el.innerHTML = '<button data-v="pixel">Pixel</button><button data-v="retro">Retro</button><button data-v="art">Artwork</button>';
    });

    $$('.mode-btn').forEach((b) => b.addEventListener('click', () => { S.view = b.dataset.view; render(); }));
    $$('[data-sprite-seg]').forEach((el) => el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      S.sprite = b.dataset.v; render();
    }));

    $('#formation-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      B.f = b.dataset.v; render();
    });
    $('#bench-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      B.bench = b.dataset.v === '1';
      if (B.bench && B.subs.every((v) => !v)) {
        const used = new Set(B.xi);
        const rest = builderPool().filter((p) => !used.has(p.id)).map((p) => [bestPos(p).ovr, p.id]).sort((a, c) => c[0] - a[0]);
        B.subs = Array(BENCH_SIZE).fill(null).map((_, i) => (rest[i] ? rest[i][1] : null));
      }
      render();
    });
    $('#ovr-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      B.ovr = b.dataset.v === '1'; render();
    });
    $('#gen-grid').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      B.gen = +b.dataset.v;
      Object.assign(B, bestXI(B.f, builderPool(), B.bench));
      render();
    });
    $('#leg-toggle').addEventListener('change', (e) => {
      B.leg = e.target.checked;
      Object.assign(B, bestXI(B.f, builderPool(), B.bench));
      render();
    });

    $('#btn-random').addEventListener('click', () => {
      const ids = shuffle(builderPool().map((p) => p.id));
      B.xi = ids.slice(0, 11);
      B.subs = B.bench ? ids.slice(11, 11 + BENCH_SIZE) : Array(BENCH_SIZE).fill(null);
      render();
    });
    $('#btn-reset').addEventListener('click', () => { Object.assign(B, bestXI(B.f, builderPool(), B.bench)); render(); toast('Best XI by stats loaded'); });
    $('#btn-clear').addEventListener('click', () => { B.xi = Array(11).fill(null); B.subs = Array(BENCH_SIZE).fill(null); render(); });
    $('#btn-copy').addEventListener('click', async () => {
      const url = location.href.split('#')[0] + encodeHash();
      history.replaceState(null, '', encodeHash());
      try { await navigator.clipboard.writeText(url); toast('Link copied!'); } catch { prompt('Copy this link:', url); }
    });
    $('#btn-download').addEventListener('click', downloadImage);
    $('#btn-undo').addEventListener('click', undo);
    $('#btn-redo').addEventListener('click', redo);
    document.addEventListener('keydown', (e) => {
      if (S.view !== 'builder' || !$('#picker').hidden || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    });
  }

  // ---------------- Drag & drop / tap ----------------
  let drag = null;
  function onPointerDown(e) {
    const el = e.target.closest('.player');
    if (!el || e.button > 0) return;
    if (S.view === 'challenge') {
      if (el.classList.contains('placeable')) placePick(+el.dataset.slot);
      return;
    }
    drag = { el, slot: +el.dataset.slot, x: e.clientX, y: e.clientY, started: false, target: null, ghost: null };
  }
  function onPointerMove(e) {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7 || !getSlot(drag.slot)) return;
      drag.started = true;
      const img = drag.el.querySelector('.sprite');
      const r = img.getBoundingClientRect();
      const g = img.cloneNode();
      g.className = 'drag-ghost';
      Object.assign(g.style, { width: r.width + 'px', height: r.height + 'px', imageRendering: S.sprite === 'art' ? 'auto' : 'pixelated' });
      document.body.appendChild(g);
      drag.ghost = g;
      drag.el.classList.add('dragging');
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const t = over && over.closest('.player');
    if (drag.target && drag.target !== t) drag.target.classList.remove('drop-target');
    drag.target = t && t !== drag.el ? t : null;
    if (drag.target) drag.target.classList.add('drop-target');
  }
  function onPointerUp() {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.started) {
      d.ghost.remove();
      d.el.classList.remove('dragging');
      if (d.target) {
        d.target.classList.remove('drop-target');
        swapSlots(d.slot, +d.target.dataset.slot);
        render();
      }
    } else {
      openPicker(d.slot);
    }
  }
  [playersEl, benchEl].forEach((el) => el.addEventListener('pointerdown', onPointerDown));
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // ---------------- Picker ----------------
  let pickerSlot = null;
  function openPicker(slot) {
    pickerSlot = slot;
    const pos = slotPos(slot);
    const chip = $('#picker-pos');
    chip.textContent = pos;
    chip.style.setProperty('--pc', posColor(pos));
    $('#picker-title').textContent = `${LINES[lineOf(pos)].name}: pick a Pokémon`;
    $('#picker-search').value = '';
    $('#picker-sort').value = S.sort || 'dex';
    $('#picker').hidden = false;
    renderPickerGrid();
    const sel = $('#picker-grid .pk.sel');
    if (sel) sel.scrollIntoView({ block: 'center' });
    if (matchMedia('(pointer: fine)').matches) $('#picker-search').focus();
  }
  function closePicker() { $('#picker').hidden = true; pickerSlot = null; $('#picker-search').blur(); }
  function renderPickerGrid() {
    const pos = slotPos(pickerSlot);
    const q = $('#picker-search').value.trim().toLowerCase().replace(/^#/, '');
    const sort = $('#picker-sort').value;
    let list = builderPool();
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q) || String(p.id) === q.replace(/^0+/, '') || p.types.includes(q));
    }
    const fit = (p) => (pos === 'SUB' ? bestPos(p).ovr : rating(p, pos));
    let rows = list.map((p) => ({ p, fit: fit(p) }));
    if (sort === 'fit') rows.sort((a, b) => b.fit - a.fit || a.p.id - b.p.id);
    const cur = getSlot(pickerSlot);
    const art = S.sprite === 'art' ? ' art' : '';
    $('#picker-grid').innerHTML = rows.map(({ p, fit: v }) => {
      const at = findSlot(p.id);
      const tag = at >= 0 ? `<span class="tag">${slotPos(at)}</span>` : '';
      const col = v >= 85 ? '#5ee08a' : v >= 70 ? '#f5c84c' : '#8b93a1';
      return `<button class="pk${art}${p.id === cur ? ' sel' : ''}" data-id="${p.id}" title="${statLine(p)}">
        <span class="fitv" style="color:${col}">${v}</span>${tag}
        ${imgTag(p.id, S.sprite)}
        <span class="no">#${String(p.id).padStart(3, '0')}</span><span class="n">${esc(p.name)}</span>${typeDots(p)}
        ${p.leg ? '<span class="leg" title="Legendary">★</span>' : ''}</button>`;
    }).join('') || '<p class="muted">No Pokémon match that search.</p>';
  }
  $('#picker-search').addEventListener('input', renderPickerGrid);
  $('#picker-sort').addEventListener('change', () => { S.sort = $('#picker-sort').value; store.set('pxi.settings', S); renderPickerGrid(); });
  $('#picker-search').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = $('#picker-grid .pk');
    if (first) first.click();
  });
  $('#picker-close').addEventListener('click', closePicker);
  $('#picker').addEventListener('click', (e) => { if (e.target.id === 'picker') closePicker(); });
  $('#picker-empty').addEventListener('click', () => { setSlot(pickerSlot, null); closePicker(); render(); });
  $('#picker-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.pk'); if (!b) return;
    const id = +b.dataset.id;
    const at = findSlot(id);
    if (at >= 0) swapSlots(at, pickerSlot); else setSlot(pickerSlot, id);
    closePicker(); render();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#picker').hidden) closePicker(); });

  // ---------------- Image export ----------------
  function loadImg(src) {
    return new Promise((res) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  async function downloadImage() {
    const sq = currentSquad();
    const f = FORMATIONS[sq.f];
    toast('Rendering image…');
    await document.fonts.ready;
    const W = 1080, PX = 40, PY = 150, PW = 1000, PH = 1350;
    const benchH = sq.bench ? 260 : 0;
    const H = PY + PH + benchH + 70;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(0, 0, W, H);

    // Header
    const tr = teamRatings(sq.f, sq.xi);
    ctx.fillStyle = '#eef1f5'; ctx.font = '800 54px Inter, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('My Pokémon ', PX, 92);
    const w1 = ctx.measureText('My Pokémon ').width;
    ctx.fillStyle = '#5ee08a'; ctx.fillText('Starting XI', PX + w1, 92);
    ctx.fillStyle = '#8b93a1'; ctx.font = '600 26px Inter, sans-serif';
    const sub = S.view === 'challenge' ? `38–0 Challenge · ${sq.f}` : `${sq.f} · ${REGION[B.gen]}${B.gen ? ' (Gen ' + B.gen + ')' : ' Gens'}`;
    ctx.fillText(sub, PX, 130);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#eef1f5'; ctx.font = '700 64px "JetBrains Mono", monospace'; ctx.fillText(String(tr.ovr), W - PX, 96);
    ctx.fillStyle = '#8b93a1'; ctx.font = '700 20px Inter, sans-serif'; ctx.fillText('TEAM OVR', W - PX, 128);
    ctx.textAlign = 'left';

    // Pitch
    ctx.save();
    roundRect(ctx, PX, PY, PW, PH, 24); ctx.clip();
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#46963f' : '#3f8a3a'; ctx.fillRect(PX, PY + (PH / 16) * i, PW, PH / 16 + 1); }
    const ix = PX + PW * 0.035, iy = PY + PH * 0.035, iw = PW * 0.93, ih = PH * 0.93;
    ctx.strokeStyle = 'rgba(255,255,255,.82)'; ctx.lineWidth = 4;
    ctx.strokeRect(ix, iy, iw, ih);
    ctx.beginPath(); ctx.moveTo(ix, iy + ih / 2); ctx.lineTo(ix + iw, iy + ih / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(ix + iw / 2, iy + ih / 2, iw * 0.13, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.beginPath(); ctx.arc(ix + iw / 2, iy + ih / 2, 6, 0, Math.PI * 2); ctx.fill();
    for (const top of [true, false]) {
      const bw = iw * 0.58, bh = ih * 0.155, sw = iw * 0.27, sh = ih * 0.055;
      const by = top ? iy : iy + ih - bh, sy = top ? iy : iy + ih - sh;
      ctx.strokeRect(ix + (iw - bw) / 2, by, bw, bh);
      ctx.strokeRect(ix + (iw - sw) / 2, sy, sw, sh);
      ctx.beginPath();
      if (top) ctx.ellipse(ix + iw / 2, iy + bh, iw * 0.1, ih * 0.046, 0, 0, Math.PI);
      else ctx.ellipse(ix + iw / 2, iy + ih - bh, iw * 0.1, ih * 0.046, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    const style = S.sprite;
    const ids = [...sq.xi, ...(sq.bench ? sq.subs : [])].filter(Boolean);
    const imgs = new Map(await Promise.all(ids.map(async (id) => {
      let im = await loadImg(spriteUrl(id, style));
      if (!im) im = await loadImg(spriteUrl(id, 'art'));
      return [id, im];
    })));
    ctx.imageSmoothingEnabled = style === 'art';

    function drawPlayer(cx, cy, id, pos, scale) {
      const size = (style === 'art' ? 128 : 150) * scale;
      const plateY = cy + size * 0.38;
      if (id) {
        const im = imgs.get(id);
        if (im) {
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
          ctx.drawImage(im, cx - size / 2, cy - size * 0.62, size, size); ctx.restore();
        }
      } else {
        ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy - size * 0.12, size * 0.34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const p = id ? BY_ID.get(id) : null;
      const name = p ? p.name.toUpperCase() : 'EMPTY';
      const isSub = pos === 'SUB';
      const r = p ? (isSub ? bestPos(p) : { pos, ovr: rating(p, pos) }) : { pos, ovr: '' };
      ctx.font = `800 ${Math.round(22 * scale)}px Inter, sans-serif`;
      const nw = ctx.measureText(name).width;
      const pw = Math.max(nw + 28 * scale, 140 * scale), ph = 56 * scale;
      ctx.fillStyle = 'rgba(12,14,18,.92)';
      roundRect(ctx, cx - pw / 2, plateY, pw, ph, 12 * scale); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = p ? '#eef1f5' : '#8b93a1';
      ctx.fillText(name, cx, plateY + 25 * scale);
      ctx.font = `700 ${Math.round(18 * scale)}px "JetBrains Mono", monospace`;
      const posTxt = isSub && p ? r.pos : pos;
      const ovrTxt = p && sq.showOvr ? '  ' + r.ovr : '';
      const totalW = ctx.measureText(posTxt + ovrTxt).width;
      ctx.textAlign = 'left';
      ctx.fillStyle = isSub ? LINES.SUB.color : posColor(pos);
      ctx.fillText(posTxt, cx - totalW / 2, plateY + 47 * scale);
      ctx.fillStyle = '#d6dbe3';
      ctx.fillText(ovrTxt, cx - totalW / 2 + ctx.measureText(posTxt).width, plateY + 47 * scale);
    }

    f.forEach(([pos, x, y], i) => drawPlayer(PX + (PW * x) / 100, PY + (PH * y) / 100, sq.xi[i], pos, 1));

    if (sq.bench) {
      const by = PY + PH + 20;
      ctx.fillStyle = '#12161b'; roundRect(ctx, PX, by, PW, benchH - 20, 20); ctx.fill();
      ctx.fillStyle = '#8b93a1'; ctx.font = '800 18px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('SUBSTITUTES', PX + 20, by + 34);
      sq.subs.forEach((id, i) => drawPlayer(PX + (PW / 5) * (i + 0.5), by + 130, id, 'SUB', 0.82));
    }

    ctx.textAlign = 'right'; ctx.fillStyle = '#8b93a1'; ctx.font = '700 22px Inter, sans-serif';
    ctx.fillText('Pokémon Starting XI', W - PX, H - 26);

    try {
      const a = document.createElement('a');
      a.download = 'pokemon-starting-xi.png';
      a.href = c.toDataURL('image/png');
      a.click();
      toast('Image saved!');
    } catch {
      toast('Could not export image');
    }
  }

  // ================================================================
  // 38–0 Challenge
  // ================================================================
  function newChallenge() {
    return { phase: 'setup', pool: 'all', f: '4-3-3', xi: Array(11).fill(null), round: 0, roll: null, legUsed: 0, rerolls: 2, pick: null, result: null };
  }

  function rollRound() {
    const maxGen = C.pool === 'retro' ? 4 : 9;
    const taken = new Set(C.xi);
    for (let tries = 0; tries < 200; tries++) {
      const gen = 1 + rand(maxGen);
      const type = TYPES[rand(TYPES.length)];
      const opts = DEX.filter((p) => p.gen === gen && p.types.includes(type) && !taken.has(p.id));
      const usable = opts.filter((p) => !p.leg || C.legUsed < 3);
      if (usable.length >= 3) { C.roll = { gen, type, ids: opts.map((p) => p.id) }; C.pick = null; return; }
    }
  }

  function placePick(slot) {
    if (C.phase !== 'draft' || !C.pick || C.xi[slot]) return;
    const p = BY_ID.get(C.pick);
    C.xi[slot] = C.pick;
    if (p.leg) C.legUsed++;
    C.round++;
    C.pick = null;
    buzz();
    if (C.round >= 11) {
      C.phase = 'ready'; C.roll = null; render();
      confetti(70);
    } else { rollRound(); startRoll(); }
  }

  // Slot-machine spin: cycle random regions/types, slowing down, then land on the real roll.
  let rolling = false, rollTimer = null;
  const rollChips = (gen, type, cls = '') =>
    `<span class="chip region ${cls}">${REGION[gen]} · Gen ${gen}</span><span class="chip ${cls}" style="background:${TYPE_COLORS[type]}">${cap(type)}</span>`;
  function startRoll() {
    clearTimeout(rollTimer);
    if (REDUCE) { rolling = false; render(); return; }
    rolling = true;
    render();
    const maxGen = C.pool === 'retro' ? 4 : 9, dur = 1100, t0 = performance.now();
    const tick = () => {
      const t = performance.now() - t0;
      if (t >= dur || S.view !== 'challenge' || C.phase !== 'draft') {
        rolling = false;
        render();
        const r = $('#ch-roll');
        r.classList.remove('landed'); void r.offsetWidth; r.classList.add('landed');
        buzz(20);
        return;
      }
      $('#ch-roll').innerHTML = rollChips(1 + rand(maxGen), TYPES[rand(TYPES.length)], 'spin');
      rollTimer = setTimeout(tick, 45 + Math.pow(t / dur, 2) * 190);
    };
    tick();
  }

  function renderChallenge() {
    $('#ch-setup').hidden = C.phase !== 'setup';
    $('#ch-draft').hidden = C.phase !== 'draft';
    $('#ch-ready').hidden = C.phase !== 'ready';
    $('#ch-result').hidden = C.phase !== 'result';
    $$('#ch-pool-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === C.pool));
    $$('#ch-formation-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === C.f));
    $('#st-best').textContent = ST.best == null ? '–' : ST.best + ' pts';
    $('#st-rec').textContent = ST.bestRec || '–';
    $('#st-runs').textContent = ST.runs;

    if (C.phase === 'draft' && C.roll) {
      $('#ch-round').textContent = `Round ${C.round + 1} / 11`;
      $('#ch-leg').textContent = `Legendaries ${C.legUsed} / 3`;
      $('#ch-reroll').textContent = `🎲 Reroll (${C.rerolls})`;
      $('#ch-reroll').disabled = C.rerolls <= 0 || rolling;
      const opts = $('#ch-options');
      opts.classList.toggle('veiled', rolling);
      if (rolling) {
        $('#ch-hint').textContent = 'Rolling…';
        opts.innerHTML = ''; opts.dataset.key = '';
        return;
      }
      $('#ch-roll').innerHTML = rollChips(C.roll.gen, C.roll.type);
      $('#ch-hint').textContent = C.pick
        ? `Now tap a glowing open spot to place ${BY_ID.get(C.pick).name}.`
        : 'Pick a Pokémon, then tap an open spot on the pitch.';
      const f = FORMATIONS[C.f];
      const open = f.map(([pos], i) => (C.xi[i] ? null : pos)).filter(Boolean);
      const art = S.sprite === 'art' ? ' art' : '';
      const okey = `${C.roll.ids.join('.')}|${open.join('.')}|${C.legUsed}|${S.sprite}`;
      if (opts.dataset.key === okey) {
        // Same roll: just move the selection highlight instead of rebuilding (no flicker).
        $$('.pk', opts).forEach((b) => b.classList.toggle('sel', +b.dataset.id === C.pick));
        return;
      }
      opts.dataset.key = okey;
      opts.innerHTML = C.roll.ids.map((id, n) => {
        const p = BY_ID.get(id);
        let bp = open[0], bv = -1;
        for (const pos of open) { const v = rating(p, pos); if (v > bv) { bv = v; bp = pos; } }
        const locked = p.leg && C.legUsed >= 3;
        const col = bv >= 85 ? '#5ee08a' : bv >= 70 ? '#f5c84c' : '#8b93a1';
        return `<button class="pk deal${art}${C.pick === id ? ' sel' : ''}" data-id="${id}" style="--i:${Math.min(n, 24)}" title="${locked ? 'Legendary limit reached' : statLine(p)}" ${locked ? 'disabled' : ''}>
          <span class="fitv" style="color:${col}">${bv}</span><span class="tag" style="color:${posColor(bp)}">${bp}</span>
          ${imgTag(id, S.sprite)}<span class="n">${esc(p.name)}</span>${typeDots(p)}
          ${p.leg ? '<span class="leg" title="Legendary">★</span>' : ''}</button>`;
      }).join('');
    }
    if (C.phase === 'ready') updateRatings($('#ch-ratings'), teamRatings(C.f, C.xi));
    if (C.phase === 'result' && C.result && !seasonTimer) renderResult();
  }

  $('#ch-pool-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.pool = b.dataset.v; render(); });
  $('#ch-formation-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.f = b.dataset.v; render(); });
  $('#ch-start').addEventListener('click', () => {
    const { pool, f } = C;
    C = newChallenge(); C.pool = pool; C.f = f; C.phase = 'draft';
    rollRound(); startRoll();
  });
  $('#ch-options').addEventListener('click', (e) => {
    const b = e.target.closest('.pk'); if (!b || b.disabled) return;
    C.pick = +b.dataset.id; render();
  });
  $('#ch-reroll').addEventListener('click', () => { if (C.rerolls > 0 && !rolling) { C.rerolls--; rollRound(); startRoll(); } });
  $('#ch-quit').addEventListener('click', () => {
    if (!confirm('Abandon this run?')) return;
    const { pool, f } = C; C = newChallenge(); C.pool = pool; C.f = f; render();
  });
  $('#ch-play').addEventListener('click', () => {
    C.result = simulateSeason(teamRatings(C.f, C.xi));
    C.phase = 'result';
    const r = C.result.me;
    ST.runs++;
    const newBest = ST.best == null || r.pts > ST.best;
    if (newBest) { ST.best = r.pts; ST.bestRec = `${r.w}–${r.d}–${r.l}`; }
    playSeason(newBest);
  });
  $('#ch-again').addEventListener('click', () => { const { pool, f } = C; C = newChallenge(); C.pool = pool; C.f = f; render(); });

  // Season playback: tick through matchdays with a live record, then reveal the full result.
  let seasonTimer = null;
  function playSeason(newBest) {
    clearTimeout(seasonTimer);
    seasonTimer = 1; // mark as running before render() so it doesn't draw the final result
    C.phase = 'result';
    render();
    const { games } = C.result;
    const box = $('#ch-result-box');
    $('#ch-again').hidden = true;
    box.innerHTML = `
      <div class="round-row"><div class="box-title">Matchday <span id="lv-md">0</span> / 38</div><span class="streak" id="lv-streak"></span></div>
      <div class="record" id="lv-rec">0–0–0</div>
      <div class="sub" id="lv-pts">0 pts</div>
      <div class="ticker" id="lv-tick"><span class="muted">Kick-off…</span></div>
      <div class="form-strip">${games.map(() => '<i class="pending"></i>').join('')}</div>
      <button class="btn" id="lv-skip">Skip to final table ⏭</button>`;
    const cells = $$('.form-strip i', box);
    let i = 0, w = 0, d = 0, l = 0;
    const finish = () => {
      clearTimeout(seasonTimer); seasonTimer = null;
      renderResult();
      $('#ch-again').hidden = false;
      const me = C.result.me;
      if (me.position === 1 || me.l === 0) confetti(me.w === 38 ? 320 : 180);
      if (newBest) toast(`New best: ${me.pts} pts!`);
      saveAll();
    };
    const step = () => {
      if (S.view !== 'challenge') { finish(); return; }
      const g = games[i];
      if (g.res === 'W') w++; else if (g.res === 'D') d++; else l++;
      cells[i].className = g.res + ' flip';
      cells[i].textContent = g.res;
      $('#lv-md', box).textContent = i + 1;
      $('#lv-rec', box).textContent = `${w}–${d}–${l}`;
      $('#lv-pts', box).textContent = `${w * 3 + d} pts`;
      const t = $('#lv-tick', box);
      t.innerHTML = `<span class="muted">MD${g.md}</span> ${g.home ? 'vs' : '@'} ${esc(g.opp)} <b class="${g.res}">${g.gf}–${g.ga}</b>`;
      t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
      $('#lv-streak', box).textContent = l === 0 && d === 0 ? '🔥 Perfect' : l === 0 ? '🛡️ Unbeaten' : '';
      i++;
      if (i >= games.length) { seasonTimer = setTimeout(finish, 500); return; }
      // Slow down for the final stretch — maximum drama when a perfect run is alive.
      const late = games.length - i <= 5;
      seasonTimer = setTimeout(step, late ? (l === 0 ? 420 : 220) : 85);
    };
    $('#lv-skip', box).addEventListener('click', finish);
    if (REDUCE) finish(); else seasonTimer = setTimeout(step, 400);
  }

  // ---------------- Season simulation ----------------
  function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }

  function simulateSeason(tr) {
    const names = shuffle(CLUBS.slice());
    const teams = [{ name: 'Your XI', me: true, attack: tr.attack, defense: tr.defense }];
    names.forEach((name, i) => {
      const base = 62 + (22 * i) / (names.length - 1) + (Math.random() * 4 - 2);
      teams.push({ name, attack: base + (Math.random() * 6 - 3), defense: base + (Math.random() * 6 - 3) });
    });
    teams.forEach((t) => Object.assign(t, { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));

    // Double round-robin via the circle method.
    const n = teams.length, idx = teams.map((_, i) => i), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const games = [];
      for (let i = 0; i < n / 2; i++) {
        const a = idx[i], b = idx[n - 1 - i];
        games.push(r % 2 ? [b, a] : [a, b]);
      }
      rounds.push(games);
      idx.splice(1, 0, idx.pop());
    }
    const all = rounds.concat(rounds.map((g) => g.map(([a, b]) => [b, a])));
    const myGames = [];
    all.forEach((games, ri) => games.forEach(([h, a]) => {
      const H = teams[h], A = teams[a];
      const gh = poisson(Math.min(5, 1.45 * Math.exp((H.attack - A.defense) / 20)));
      const ga = poisson(Math.min(5, 1.15 * Math.exp((A.attack - H.defense) / 20)));
      for (const [t, f, ag] of [[H, gh, ga], [A, ga, gh]]) {
        t.p++; t.gf += f; t.ga += ag;
        if (f > ag) { t.w++; t.pts += 3; } else if (f === ag) { t.d++; t.pts += 1; } else t.l++;
      }
      if (H.me || A.me) {
        const home = !!H.me, mine = home ? gh : ga, theirs = home ? ga : gh;
        myGames.push({ md: ri + 1, home, opp: (home ? A : H).name, gf: mine, ga: theirs, res: mine > theirs ? 'W' : mine === theirs ? 'D' : 'L' });
      }
    }));
    const table = teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      .map((t) => ({ name: t.name, me: !!t.me, p: t.p, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga, pts: t.pts }));
    const me = table.find((t) => t.me);
    me.position = table.indexOf(me) + 1;
    return { me, table, games: myGames };
  }

  function renderResult() {
    const { me, table, games } = C.result;
    const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
    let verdict;
    if (me.w === 38) verdict = '🏆 PERFECT 38–0! Absolute legends.';
    else if (me.l === 0) verdict = '🛡️ Unbeaten — The Invincibles!';
    else if (me.position === 1) verdict = '🏆 League Champions!';
    else if (me.position === 2) verdict = '🥈 Runners-up — so close!';
    else if (me.position <= 4) verdict = '⭐ Top-four finish';
    else if (me.position <= 17) verdict = 'Mid-table season';
    else verdict = '⬇️ Relegated…';
    $('#ch-result-box').innerHTML = `
      <div class="box-title">Season result</div>
      <div class="record">${me.w}–${me.d}–${me.l}</div>
      <div class="sub">W–D–L · ${me.pts} pts · ${ord(me.position)} place · GD ${me.gf - me.ga >= 0 ? '+' : ''}${me.gf - me.ga}</div>
      <div class="verdict">${verdict}</div>
      <div class="form-strip">${games.map((g) => `<i class="${g.res}" title="MD${g.md} ${g.home ? 'vs' : '@'} ${esc(g.opp)} ${g.gf}-${g.ga}">${g.res}</i>`).join('')}</div>
      <details open><summary>League table</summary><div class="table-wrap"><table class="league">
        <tr><th>#</th><th class="team">Club</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        ${table.map((t, i) => `<tr class="${t.me ? 'me' : ''}"><td>${i + 1}</td><td class="team">${esc(t.name)}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf - t.ga}</td><td>${t.pts}</td></tr>`).join('')}
      </table></div></details>
      <details><summary>All 38 results</summary><div class="matches">
        ${games.map((g) => `<div><span class="muted">${g.md}</span><span class="muted">${g.home ? 'vs' : '@'}</span><span>${esc(g.opp)}</span><span class="${g.res}">${g.res} ${g.gf}–${g.ga}</span></div>`).join('')}
      </div></details>`;
  }

  // ================================================================
  // Boot
  // ================================================================
  const fromHash = decodeHash();
  if (fromHash) { B = fromHash; S.view = 'builder'; }
  if (!B || !Array.isArray(B.xi) || !FORMATIONS[B.f]) defaultBuilder();
  if (!Array.isArray(B.subs)) B.subs = Array(BENCH_SIZE).fill(null);
  if (!FORMATIONS[C.f]) C = newChallenge();

  initControls();
  render();
})();
