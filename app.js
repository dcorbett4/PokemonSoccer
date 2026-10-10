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
  const TOUCH = matchMedia('(pointer: coarse)').matches;
  const buzz = (ms = 12) => {
    if (!TOUCH || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return;
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  };
  const STAT_KEYS = [['hp', 'HP'], ['atk', 'Atk'], ['def', 'Def'], ['spa', 'SpA'], ['spd', 'SpD'], ['spe', 'Spe']];
  const statCol = (v) => (v >= 110 ? '#5ee08a' : v >= 80 ? '#f5c84c' : v >= 55 ? '#c9ced6' : '#7d8593');
  const bst = (p) => STAT_KEYS.reduce((t, [k]) => t + p.s[k], 0);
  const statGrid = (p, hl) => `<span class="stats">${STAT_KEYS.map(([k, l]) =>
    `<span class="${hl === k ? 'hl' : ''}"><em>${l}</em><b style="color:${statCol(p.s[k])}">${p.s[k]}</b></span>`).join('')}</span>`;
  const statLine = (p) => `HP ${p.s.hp} · Atk ${p.s.atk} · Def ${p.s.def} · SpA ${p.s.spa} · SpD ${p.s.spd} · Spe ${p.s.spe}`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  // ================================================================
  // State
  // ================================================================
  const S = Object.assign({ view: 'builder', sprite: 'pixel' }, store.get('pxi.settings', {}));
  let B = store.get('pxi.builder', null); // builder state
  // One saved run per challenge mode; C always points at the run for the current view.
  const RUNS = {
    challenge: Object.assign(newRun('classic'), store.get('pxi.challenge', {}), { mode: 'classic' }),
    regions: Object.assign(newRun('regions'), store.get('pxi.regions', {}), { mode: 'regions' }),
  };
  const isRun = () => S.view === 'challenge' || S.view === 'regions';
  let C = RUNS[S.view] || RUNS.challenge;
  let ST = Object.assign({ best: null, bestRec: null, runs: 0 }, store.get('pxi.stats', {}));
  let SR = Object.assign({ runs: 0, titles: 0, bestScore: null, bestText: null }, store.get('pxi.rstats', {}));

  function saveAll() {
    store.set('pxi.settings', S);
    store.set('pxi.builder', B);
    store.set('pxi.challenge', RUNS.challenge);
    store.set('pxi.regions', RUNS.regions);
    store.set('pxi.stats', ST);
    store.set('pxi.rstats', SR);
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
    const b = { f: '4-3-3', gen: 1, leg: false, bench: false, xi: [], subs: Array(BENCH_SIZE).fill(null) };
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
      f, gen, leg: p.get('l') === '1', bench: p.get('b') === '1',
      xi: ids(p.get('x'), 11), subs: ids(p.get('u'), BENCH_SIZE),
    };
  }

  // ================================================================
  // Pitch rendering (shared by builder & challenge)
  // ================================================================
  const playersEl = $('#players');
  const benchEl = $('#bench');

  function currentSquad() {
    if (isRun()) return { f: C.f, xi: C.xi, subs: [], bench: false };
    return { f: B.f, xi: B.xi, subs: B.subs, bench: B.bench };
  }

  function playerInner(id, pos) {
    if (!id) {
      return `<div class="slot-ring">+</div>
        <div class="plate"><div class="nm" style="opacity:.6">Empty</div><div class="meta"><span class="pos">${pos}</span></div></div>`;
    }
    const p = BY_ID.get(id);
    return `${imgTag(id, S.sprite, 'sprite')}
      <div class="plate"><div class="nm">${esc(p.name)}</div><div class="meta"><span class="pos">${pos}</span></div></div>`;
  }

  // Small "2G 1A" badge on a player's plate; bumps when it changes during playback.
  function updateGA(el, st) {
    const meta = el.querySelector('.meta');
    if (!meta) return;
    let b = meta.querySelector('.ga');
    const txt = st && (st.g || st.a) ? `${st.g ? st.g + 'G' : ''}${st.g && st.a ? ' ' : ''}${st.a ? st.a + 'A' : ''}` : '';
    if (!txt) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'ga'; meta.appendChild(b); }
    if (b.textContent !== txt) {
      b.textContent = txt;
      if (seasonTimer && !REDUCE) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    }
  }

  function updatePerf(el, v) {
    let b = el.querySelector('.perf');
    if (v == null) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('span');
      b.className = 'perf';
      b.title = 'Season performance rating';
      el.appendChild(b);
    }
    b.textContent = v;
    b.style.setProperty('--rc', perfColor(v));
  }

  function renderPitch() {
    const sq = currentSquad();
    const f = FORMATIONS[sq.f];
    const pick = isRun() && C.phase === 'draft' && C.pick ? BY_ID.get(C.pick) : null;
    playersEl.classList.toggle('locked', isRun());

    // Keyed update so players glide when the formation changes.
    while (playersEl.children.length < 11) {
      const d = document.createElement('div');
      d.className = 'player';
      d.dataset.slot = playersEl.children.length;
      playersEl.appendChild(d);
    }
    let popN = 0;
    const live = isRun() && (C.phase === 'result' || C.phase === 'national') ? runGames() : null;
    const gaStats = live ? seasonPlayerStats(live) : null;
    const perf = live && !seasonTimer ? perfRatings(live) : null;
    f.forEach(([pos, x, y], i) => {
      const el = playersEl.children[i];
      const id = sq.xi[i];
      const prevId = el.dataset.id;
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.style.setProperty('--pc', posColor(pos));
      el.className = 'player' + (id ? '' : ' empty') + (S.sprite === 'art' ? ' art' : '') + (pick && !id ? ' placeable' : '');
      el.title = id ? `${BY_ID.get(id).name} — ${statLine(BY_ID.get(id))}` : '';
      const key = `${id}|${pos}|${S.sprite}`;
      if (el.dataset.key !== key) {
        el.innerHTML = playerInner(id, pos);
        el.dataset.key = key;
        // New face in this slot: pop it in (staggered when many change at once, e.g. Randomize).
        if (id && prevId !== String(id) && !REDUCE) {
          const delay = popN++ * 35 + 'ms';
          el.querySelectorAll('.sprite, .plate').forEach((n) => { n.style.animationDelay = delay; n.classList.add('pop'); });
        }
      }
      el.dataset.id = id || '';
      updateGA(el, gaStats && id ? gaStats[i] : null);
      updatePerf(el, perf && id ? perf[i] : null);
    });

    // Bench
    benchEl.hidden = !sq.bench;
    $('.pitch-wrap').classList.toggle('has-bench', sq.bench);
    const bkey = `${sq.subs.join('.')}|${S.sprite}`;
    if (sq.bench && benchEl.dataset.key !== bkey) {
      benchEl.dataset.key = bkey;
      benchEl.innerHTML = `<div class="bench-title">Substitutes</div><div class="bench-row">${sq.subs.map((id, i) =>
        `<div class="player${id ? '' : ' empty'}${S.sprite === 'art' ? ' art' : ''}" data-slot="${11 + i}" style="--pc:${LINES.SUB.color}" title="${id ? statLine(BY_ID.get(id)) : ''}">${playerInner(id, 'SUB')}</div>`).join('')}</div>`;
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
    $$('#gen-grid button').forEach((b) => b.classList.toggle('on', +b.dataset.v === B.gen));
    $('#leg-toggle').checked = B.leg;
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
    $('#challenge-panel').hidden = !isRun();
    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === S.view));
    document.title = ({ challenge: '38–0 Challenge · ', regions: 'Region League · ' }[S.view] || '') + 'Pokémon Starting XI';
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

    $$('.mode-btn').forEach((b) => b.addEventListener('click', () => {
      if (skipPlayback) skipPlayback();
      S.view = b.dataset.view;
      if (RUNS[S.view]) C = RUNS[S.view];
      render();
    }));
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
    if (isRun()) {
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
    if (!$('#picker-sort').value) $('#picker-sort').value = 'dex'; // e.g. a removed sort saved earlier
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
    const val = (p) => (sort === 'bst' ? bst(p) : p.s[sort]);
    const rows = list.slice();
    if (sort !== 'dex') rows.sort((a, b) => val(b) - val(a) || a.id - b.id);
    const cur = getSlot(pickerSlot);
    const art = S.sprite === 'art' ? ' art' : '';
    $('#picker-grid').innerHTML = rows.map((p) => {
      const at = findSlot(p.id);
      const tag = at >= 0 ? `<span class="tag">${slotPos(at)}</span>` : '';
      return `<button class="pk${art}${p.id === cur ? ' sel' : ''}" data-id="${p.id}" title="${p.types.map(cap).join(' / ')}">
        <span class="bst${sort === 'bst' ? ' hl' : ''}" title="Base stat total">${bst(p)}</span>${tag}
        ${imgTag(p.id, S.sprite)}
        <span class="no">#${String(p.id).padStart(3, '0')}</span><span class="n">${esc(p.name)}</span>${typeDots(p)}${statGrid(p, sort)}
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
    ctx.fillStyle = '#eef1f5'; ctx.font = '800 54px Inter, sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('My Pokémon ', PX, 92);
    const w1 = ctx.measureText('My Pokémon ').width;
    ctx.fillStyle = '#5ee08a'; ctx.fillText('Starting XI', PX + w1, 92);
    ctx.fillStyle = '#8b93a1'; ctx.font = '600 26px Inter, sans-serif';
    const res = isRun() && (C.phase === 'result' || C.phase === 'national') && C.result ? C.result.me : null;
    const mode = C.mode === 'regions' ? `${REGION[C.home]} League` : '38–0 Challenge';
    const nat = res && C.national ? ` · National: ${NAT_LABEL[C.national.finish]}` : '';
    const sub = isRun() ? `${mode} · ${sq.f}${res ? ` · ${res.w}–${res.d}–${res.l} · ${ord(res.position)}${nat}` : ''}` : `${sq.f} · ${REGION[B.gen]}${B.gen ? ' (Gen ' + B.gen + ')' : ' Gens'}`;
    ctx.fillText(sub, PX, 130);

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

    function drawPlayer(cx, cy, id, pos, scale, ga = '', rtg = null) {
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
      if (id && rtg != null) {
        const rx = cx + size * 0.36, ry = cy - size * 0.5;
        ctx.fillStyle = 'rgba(12,14,18,.92)';
        ctx.beginPath(); ctx.arc(rx, ry, 22 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = perfColor(rtg); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = perfColor(rtg); ctx.font = `700 ${Math.round(19 * scale)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(rtg), rx, ry + 1);
        ctx.textBaseline = 'alphabetic';
      }
      const p = id ? BY_ID.get(id) : null;
      const name = p ? p.name.toUpperCase() : 'EMPTY';
      ctx.font = `800 ${Math.round(22 * scale)}px Inter, sans-serif`;
      const nw = ctx.measureText(name).width;
      const pw = Math.max(nw + 28 * scale, 140 * scale), ph = 56 * scale;
      ctx.fillStyle = 'rgba(12,14,18,.92)';
      roundRect(ctx, cx - pw / 2, plateY, pw, ph, 12 * scale); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = p ? '#eef1f5' : '#8b93a1';
      ctx.fillText(name, cx, plateY + 25 * scale);
      ctx.font = `700 ${Math.round(18 * scale)}px "JetBrains Mono", monospace`;
      const label = pos + (ga ? '  ' + ga : '');
      const lw = ctx.measureText(label).width, pw2 = ctx.measureText(pos).width;
      ctx.textAlign = 'left';
      ctx.fillStyle = posColor(pos);
      ctx.fillText(pos, cx - lw / 2, plateY + 47 * scale);
      if (ga) { ctx.fillStyle = '#eef1f5'; ctx.fillText('  ' + ga, cx - lw / 2 + pw2, plateY + 47 * scale); }
    }

    const allGames = res ? runGames() : null;
    const gaAll = allGames ? seasonPlayerStats(allGames) : null;
    const prAll = allGames ? perfRatings(allGames) : null;
    const gaTxt = (st) => (st && (st.g || st.a) ? [st.g ? st.g + 'G' : '', st.a ? st.a + 'A' : ''].filter(Boolean).join(' ') : '');
    f.forEach(([pos, x, y], i) => drawPlayer(PX + (PW * x) / 100, PY + (PH * y) / 100, sq.xi[i], pos, 1, gaAll ? gaTxt(gaAll[i]) : '', prAll ? prAll[i] : null));

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
  // Runs: 38–0 Challenge ("classic") and Region League ("regions")
  // ================================================================
  const HOME_ODDS = 0.75;
  const REGION_TOWNS = {
    1: ['Pallet', 'Viridian', 'Pewter', 'Cerulean', 'Vermilion', 'Lavender', 'Celadon', 'Fuchsia', 'Saffron', 'Cinnabar', 'Indigo'],
    2: ['New Bark', 'Cherrygrove', 'Violet', 'Azalea', 'Goldenrod', 'Ecruteak', 'Olivine', 'Cianwood', 'Mahogany', 'Blackthorn'],
    3: ['Littleroot', 'Oldale', 'Petalburg', 'Rustboro', 'Dewford', 'Slateport', 'Mauville', 'Verdanturf', 'Fallarbor', 'Lavaridge', 'Fortree', 'Lilycove', 'Mossdeep', 'Sootopolis', 'Pacifidlog'],
    4: ['Twinleaf', 'Sandgem', 'Jubilife', 'Oreburgh', 'Floaroma', 'Eterna', 'Hearthome', 'Solaceon', 'Veilstone', 'Pastoria', 'Celestic', 'Canalave', 'Snowpoint', 'Sunyshore'],
    5: ['Nuvema', 'Accumula', 'Striaton', 'Nacrene', 'Castelia', 'Nimbasa', 'Driftveil', 'Mistralton', 'Icirrus', 'Opelucid', 'Lacunosa', 'Undella', 'Humilau', 'Aspertia', 'Virbank'],
    6: ['Vaniville', 'Aquacorde', 'Santalune', 'Lumiose', 'Camphrier', 'Ambrette', 'Cyllage', 'Geosenge', 'Shalour', 'Coumarine', 'Laverre', 'Dendemille', 'Anistar', 'Couriway', 'Snowbelle'],
    7: ['Iki Town', "Hau'oli", 'Heahea', 'Paniola', 'Konikoni', 'Malie', 'Tapu Village', 'Seafolk', 'Po Town', 'Hano'],
    8: ['Postwick', 'Wedgehurst', 'Motostoke', 'Turffield', 'Hulbury', 'Stow-on-Side', 'Ballonlea', 'Hammerlocke', 'Circhester', 'Spikemuth', 'Wyndon'],
    9: ['Mesagoza', 'Cabo Poco', 'Los Platos', 'Cortondo', 'Artazon', 'Levincia', 'Cascarrafa', 'Porto Marinada', 'Medali', 'Montenevera', 'Alfornada', 'Zapapico'],
  };
  // [pattern, isPlaceName] — place-style names are skipped for towns already called "X Town"/"X Village".
  const CLUB_FORMATS = [['%s FC'], ['%s United'], ['%s City', 1], ['%s Athletic'], ['%s Rovers'], ['%s Wanderers'],
    ['%s Albion'], ['Real %s'], ['Sporting %s'], ['%s Rangers'], ['Dynamo %s'], ['%s Town', 1]];
  function clubsFor(gen, n) {
    const towns = shuffle(REGION_TOWNS[gen].slice());
    const out = [], used = new Set();
    for (let i = 0; out.length < n && i < 500; i++) {
      const raw = towns[i % towns.length];
      const base = raw.replace(/ (Town|City|Village)$/, '');
      const fmts = CLUB_FORMATS.filter(([, place]) => !(place && base !== raw));
      const name = fmts[rand(fmts.length)][0].replace('%s', base);
      if (!used.has(name)) { used.add(name); out.push(name); }
    }
    return out;
  }

  const NAT_STAGES = ['Group stage', 'Quarter-final', 'Semi-final', 'Runner-up', 'Champion'];
  const NAT_LABEL = { 'Group stage': 'Group stage exit', 'Quarter-final': 'Quarter-finalists', 'Semi-final': 'Semi-finalists', 'Runner-up': 'Runners-up', Champion: '🏆 Champions' };

  function newRun(mode) {
    return {
      mode, phase: 'setup', pool: 'all', home: 1, f: '4-3-3', xi: Array(11).fill(null),
      round: 0, roll: null, legUsed: 0, rerolls: 2, pick: null, result: null, national: null,
    };
  }
  const viewOf = (mode) => (mode === 'regions' ? 'regions' : 'challenge');
  function resetRun() {
    const { mode, pool, f, home } = C;
    C = Object.assign(newRun(mode), { pool, f, home });
    RUNS[viewOf(mode)] = C;
  }

  function otherGen(home) { let g; do { g = 1 + rand(9); } while (g === home); return g; }

  function rollRound() {
    const taken = new Set(C.xi);
    for (let tries = 0; tries < 300; tries++) {
      const gen = C.mode === 'regions'
        ? (Math.random() < HOME_ODDS ? C.home : otherGen(C.home))
        : 1 + rand(C.pool === 'retro' ? 4 : 9);
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
  function rollChips(gen, type, cls = '') {
    const home = C.mode === 'regions' && gen === C.home;
    return `<span class="chip region${home ? ' home' : ''} ${cls}">${home ? '🏠 ' : ''}${REGION[gen]} · Gen ${gen}</span><span class="chip ${cls}" style="background:${TYPE_COLORS[type]}">${cap(type)}</span>`;
  }
  function startRoll() {
    clearTimeout(rollTimer);
    if (REDUCE) { rolling = false; render(); return; }
    rolling = true;
    render();
    const run = C;
    const maxGen = C.mode !== 'regions' && C.pool === 'retro' ? 4 : 9, dur = 1100, t0 = performance.now();
    const tick = () => {
      const t = performance.now() - t0;
      if (t >= dur || C !== run || !isRun() || C.phase !== 'draft') {
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

  const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
  const sgn = (n) => (n > 0 ? '+' : '') + n;
  const qualifies = () => C.mode === 'regions' && C.result && C.result.me.position <= 4;

  function renderChallenge() {
    const R = C.mode === 'regions';
    $('#ch-mode-title').textContent = R ? 'Region League' : '38–0 Challenge';
    $('#ch-lede').textContent = R
      ? `Pick a home region — 75% of your draft rolls come from there. Fill all 11, play a 38-game regional league, and finish top 4 to reach the National League against the best clubs from every other region.`
      : 'Each round rolls a region and a type. Draft a matching Pokémon (up to 3 Legendaries) into any open spot, fill all 11, then play a 38-game league season. Can you go 38–0?';
    $('#ch-pool-wrap').hidden = R;
    $('#ch-home-wrap').hidden = !R;
    $('#ch-setup').hidden = C.phase !== 'setup';
    $('#ch-draft').hidden = C.phase !== 'draft';
    $('#ch-ready').hidden = C.phase !== 'ready';
    $('#ch-result').hidden = !(C.phase === 'result' || C.phase === 'national');
    $$('#ch-pool-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === C.pool));
    $$('#ch-formation-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === C.f));
    $$('#ch-home-grid button').forEach((b) => b.classList.toggle('on', +b.dataset.v === C.home));
    $('#ch-play').textContent = R ? `▶ Play the ${REGION[C.home]} League` : '▶ Play the season';

    if (R) {
      $('#st-k1').textContent = 'National titles'; $('#st-best').textContent = SR.titles;
      $('#st-k2').textContent = 'Best finish'; $('#st-rec').textContent = SR.bestText || '–';
    } else {
      $('#st-k1').textContent = 'Best points'; $('#st-best').textContent = ST.best == null ? '–' : ST.best + ' pts';
      $('#st-k2').textContent = 'Best record'; $('#st-rec').textContent = ST.bestRec || '–';
    }
    $('#st-runs').textContent = R ? SR.runs : ST.runs;

    const canGoNational = qualifies() && C.phase === 'result' && !C.national;
    $('#ch-national').hidden = !canGoNational || !!seasonTimer;
    $('#ch-again').hidden = !!seasonTimer;
    $('#ch-again').className = canGoNational ? 'btn wide' : 'btn btn-gold';
    $('#ch-again').textContent = canGoNational ? 'End run' : 'New run';

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
      const open = C.xi.map((v, i) => (v ? '' : i)).join('.');
      const art = S.sprite === 'art' ? ' art' : '';
      const okey = `${C.roll.ids.join('.')}|${open}|${C.legUsed}|${S.sprite}`;
      if (opts.dataset.key === okey) {
        // Same roll: just move the selection highlight instead of rebuilding (no flicker).
        $$('.pk', opts).forEach((b) => b.classList.toggle('sel', +b.dataset.id === C.pick));
        return;
      }
      opts.dataset.key = okey;
      opts.innerHTML = C.roll.ids.map((id, n) => {
        const p = BY_ID.get(id);
        const locked = p.leg && C.legUsed >= 3;
        return `<button class="pk deal${art}${C.pick === id ? ' sel' : ''}" data-id="${id}" style="--i:${Math.min(n, 24)}" title="${locked ? 'Legendary limit reached' : p.types.map(cap).join(' / ')}" ${locked ? 'disabled' : ''}>
          <span class="bst" title="Base stat total">${bst(p)}</span>
          ${imgTag(id, S.sprite)}<span class="n">${esc(p.name)}</span>${typeDots(p)}${statGrid(p)}
          ${p.leg ? '<span class="leg" title="Legendary">★</span>' : ''}</button>`;
      }).join('');
    }
    if ((C.phase === 'result' || C.phase === 'national') && C.result && !seasonTimer) renderResult();
  }

  $('#ch-home-grid').innerHTML = GENS.filter(([g]) => g).map(([g, n]) => `<button data-v="${g}"><b>${n}</b><small>Gen ${g}</small></button>`).join('');
  $('#ch-home-grid').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.home = +b.dataset.v; render(); });
  $('#ch-pool-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.pool = b.dataset.v; render(); });
  $('#ch-formation-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.f = b.dataset.v; render(); });
  $('#ch-start').addEventListener('click', () => {
    resetRun(); C.phase = 'draft';
    rollRound(); startRoll();
  });
  $('#ch-options').addEventListener('click', (e) => {
    const b = e.target.closest('.pk'); if (!b || b.disabled) return;
    C.pick = +b.dataset.id; render();
  });
  $('#ch-reroll').addEventListener('click', () => { if (C.rerolls > 0 && !rolling) { C.rerolls--; rollRound(); startRoll(); } });
  $('#ch-quit').addEventListener('click', () => {
    if (!confirm('Abandon this run?')) return;
    resetRun(); render();
  });
  $('#ch-again').addEventListener('click', () => { resetRun(); render(); });

  // Track the best Region League finish: national stage beats any league-only finish.
  function recordRegionFinish() {
    const pos = C.result.me.position;
    const score = C.national ? 1 + NAT_STAGES.indexOf(C.national.finish) : (21 - pos) / 100;
    const text = C.national ? NAT_LABEL[C.national.finish] : `${ord(pos)} in league`;
    if (SR.bestScore == null || score > SR.bestScore) { SR.bestScore = score; SR.bestText = text; return true; }
    return false;
  }

  $('#ch-play').addEventListener('click', () => {
    const R = C.mode === 'regions';
    const names = R ? clubsFor(C.home, 19) : shuffle(CLUBS.slice());
    C.result = simulateSeason(teamRatings(C.f, C.xi), C.f, C.xi, names);
    C.national = null;
    C.phase = 'result';
    resultComp = 'league';
    const r = C.result.me;
    let newBest;
    if (R) { SR.runs++; newBest = recordRegionFinish(); } else {
      ST.runs++;
      newBest = ST.best == null || r.pts > ST.best;
      if (newBest) { ST.best = r.pts; ST.bestRec = `${r.w}–${r.d}–${r.l}`; }
    }
    const n = C.result.games.length;
    playGames(C.result.games, {
      phase: 'league',
      label: (g, i) => `Matchday ${i + 1} / ${n}`,
      short: (g) => `MD${g.md}`,
      sub: (w, d) => `${w * 3 + d} pts`,
      streak: (w, d, l) => (l === 0 && d === 0 ? '🔥 Perfect' : l === 0 ? '🛡️ Unbeaten' : ''),
      delay: (i, l) => (n - i <= 5 ? (l === 0 ? 420 : 220) : 85),
      onFinish: () => {
        const me = C.result.me;
        if (me.position === 1 || me.l === 0) confetti(me.w === 38 ? 320 : 180);
        else if (R && me.position <= 4) confetti(90);
        if (R && me.position <= 4) toast('Top 4 — you qualified for the National League!');
        else if (!R && newBest) toast(`New best: ${me.pts} pts!`);
      },
    });
  });

  $('#ch-national').addEventListener('click', () => {
    C.national = simulateNational(teamRatings(C.f, C.xi), C.f, C.xi, C.home);
    C.phase = 'national';
    resultComp = 'national';
    if (C.national.finish === 'Champion') SR.titles++;
    const newBest = recordRegionFinish();
    playGames(C.national.games, {
      phase: 'national',
      label: (g) => g.stage,
      short: (g) => g.short,
      sub: (w, d, l, gf, ga) => `GF ${gf} · GA ${ga}`,
      streak: (w, d, l) => (l === 0 ? '🛡️ Unbeaten' : ''),
      // Group games tick along; knockout ties get a dramatic pause.
      delay: (i) => (C.national.games[i] && !C.national.games[i].short.startsWith('G') ? 1100 : 380),
      onFinish: () => {
        const fin = C.national.finish;
        if (fin === 'Champion') { confetti(360); toast('🏆 National Champions!'); } else if (newBest) toast(`New best finish: ${NAT_LABEL[fin]}`);
      },
    });
  });

  // Playback: tick through our games with a live record and pitch stats, then reveal the full result.
  let seasonTimer = null, liveUpTo = 0, livePhase = 'league', skipPlayback = null;
  function playGames(games, cfg) {
    liveUpTo = 0; livePhase = cfg.phase;
    clearTimeout(seasonTimer);
    seasonTimer = 1; // mark as running before render() so it doesn't draw the final result
    render();
    const box = $('#ch-result-box');
    box.innerHTML = `
      <div class="round-row"><div class="box-title" id="lv-md">Kick-off</div><span class="streak" id="lv-streak"></span></div>
      <div class="record" id="lv-rec">0–0–0</div>
      <div class="sub" id="lv-pts">${cfg.sub(0, 0, 0, 0, 0)}</div>
      <div class="ticker" id="lv-tick"><span class="muted">Kick-off…</span></div>
      <div class="form-strip">${games.map(() => '<i class="pending"></i>').join('')}</div>
      <button class="btn" id="lv-skip">Skip to the end ⏭</button>`;
    const cells = $$('.form-strip i', box);
    let i = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
    const finish = () => {
      clearTimeout(seasonTimer); seasonTimer = null; skipPlayback = null;
      render();
      cfg.onFinish();
      saveAll();
    };
    skipPlayback = finish;
    const step = () => {
      const g = games[i];
      if (g.res === 'W') w++; else if (g.res === 'D') d++; else l++;
      gf += g.gf; ga += g.ga;
      const cr = cellRes(g);
      cells[i].className = cr + ' flip';
      cells[i].textContent = cr;
      $('#lv-md', box).textContent = cfg.label(g, i);
      $('#lv-rec', box).textContent = `${w}–${d}–${l}`;
      $('#lv-pts', box).textContent = cfg.sub(w, d, l, gf, ga);
      const t = $('#lv-tick', box);
      t.innerHTML = `<span class="muted">${cfg.short(g)}</span> ${g.home ? 'vs' : '@'} ${esc(g.opp)}${g.oppRegion ? ` <span class="muted">(${REGION[g.oppRegion]})</span>` : ''} <b class="${cr}">${scoreText(g)}</b>`
        + (g.goals && g.goals.length ? `<div class="scorers">⚽ ${scorerText(g, false)}</div>` : '');
      liveUpTo = i + 1;
      renderPitch();
      t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
      $('#lv-streak', box).textContent = cfg.streak(w, d, l);
      i++;
      if (i >= games.length) { seasonTimer = setTimeout(finish, 600); return; }
      seasonTimer = setTimeout(step, cfg.delay(i, l));
    };
    $('#lv-skip', box).addEventListener('click', finish);
    if (REDUCE) finish(); else seasonTimer = setTimeout(step, 400);
  }

  // ---------------- Match simulation ----------------
  function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }

  function playMatch(H, A, homeAdv = true) {
    const lh = Math.min(5, (homeAdv ? 1.45 : 1.3) * Math.exp((H.attack - A.defense) / 20));
    const la = Math.min(5, (homeAdv ? 1.15 : 1.3) * Math.exp((A.attack - H.defense) / 20));
    return { gh: poisson(lh), ga: poisson(la), lh, la };
  }
  function tally(t, f, a) {
    t.p++; t.gf += f; t.ga += a;
    if (f > a) { t.w++; t.pts += 3; } else if (f === a) { t.d++; t.pts += 1; } else t.l++;
  }
  const blankRec = () => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  const sortTable = (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
  const tableRow = (t) => ({ name: t.name, region: t.region, me: !!t.me, p: t.p, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga, pts: t.pts });

  // Who scored / assisted: weighted by line and (hidden) fit for the slot they're playing.
  function goalEvents(n, fKey, xi, lo = 1, hi = 90) {
    const W_SCORE = { GK: 0.004, DEF: 0.12, MID: 0.45, FWD: 1 };
    const W_ASSIST = { GK: 0.03, DEF: 0.35, MID: 1, FWD: 0.6 };
    const ps = FORMATIONS[fKey].map(([pos], i) => {
      const k = Math.exp((rating(BY_ID.get(xi[i]), pos) - 70) / 12);
      const line = POS[pos].line;
      return { i, sc: W_SCORE[line] * k, as: W_ASSIST[line] * k };
    });
    const pick = (key, excl) => {
      const tot = ps.reduce((t, x) => t + (x.i === excl ? 0 : x[key]), 0);
      let r = Math.random() * tot;
      for (const x of ps) { if (x.i === excl) continue; r -= x[key]; if (r <= 0) return x.i; }
      return ps[ps.length - 1].i;
    };
    return Array.from({ length: n }, () => lo + rand(hi - lo + 1)).sort((a, b) => a - b).map((m) => {
      const sc = pick('sc');
      return { s: sc, a: Math.random() < 0.78 ? pick('as', sc) : null, m };
    });
  }

  function simulateSeason(tr, fKey, xi, names) {
    const teams = [{ name: 'Your XI', me: true, attack: tr.attack, defense: tr.defense }];
    names.forEach((name, i) => {
      const base = 62 + (22 * i) / (names.length - 1) + (Math.random() * 4 - 2);
      teams.push({ name, attack: base + (Math.random() * 6 - 3), defense: base + (Math.random() * 6 - 3) });
    });
    teams.forEach((t) => Object.assign(t, blankRec()));

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
      const { gh, ga } = playMatch(H, A);
      tally(H, gh, ga); tally(A, ga, gh);
      if (H.me || A.me) {
        const home = !!H.me, mine = home ? gh : ga, theirs = home ? ga : gh;
        myGames.push({
          md: ri + 1, home, opp: (home ? A : H).name, gf: mine, ga: theirs,
          res: mine > theirs ? 'W' : mine === theirs ? 'D' : 'L', goals: goalEvents(mine, fKey, xi),
        });
      }
    }));
    const table = teams.slice().sort(sortTable).map(tableRow);
    const me = table.find((t) => t.me);
    me.position = table.indexOf(me) + 1;
    return { me, table, games: myGames };
  }

  // National League: 16 clubs (you + the best of the other regions), 4 groups of 4, then QF / SF / Final.
  function simulateNational(tr, fKey, xi, home) {
    const me = { name: 'Your XI', me: true, region: home, attack: tr.attack, defense: tr.defense };
    let others = [];
    for (let g = 1; g <= 9; g++) {
      if (g === home) continue;
      for (const name of clubsFor(g, 2)) {
        const base = 74 + Math.random() * 14;
        others.push({ name, region: g, attack: base + (Math.random() * 6 - 3), defense: base + (Math.random() * 6 - 3) });
      }
    }
    others = shuffle(others).slice(0, 15);
    const all = [me, ...others];
    all.forEach((t) => Object.assign(t, blankRec()));
    const groups = [0, 1, 2, 3].map((gi) => all.slice(gi * 4, gi * 4 + 4));
    const myGames = [];
    const addMine = (H, A, gh, ga, extra) => {
      const isHome = !!H.me, mine = isHome ? gh : ga, theirs = isHome ? ga : gh, opp = isHome ? A : H;
      myGames.push(Object.assign({
        md: myGames.length + 1, home: isHome, opp: opp.name, oppRegion: opp.region, gf: mine, ga: theirs,
        res: mine > theirs ? 'W' : mine === theirs ? 'D' : 'L',
      }, extra));
    };

    // Group stage: double round-robin inside each group.
    const sched = [[[0, 1], [2, 3]], [[2, 0], [1, 3]], [[0, 3], [1, 2]]];
    sched.concat(sched.map((r) => r.map(([a, b]) => [b, a]))).forEach((round, ri) => groups.forEach((gr) => round.forEach(([a, b]) => {
      const H = gr[a], A = gr[b];
      const { gh, ga } = playMatch(H, A);
      tally(H, gh, ga); tally(A, ga, gh);
      if (H.me || A.me) addMine(H, A, gh, ga, { stage: `Group · MD${ri + 1}`, short: `G${ri + 1}`, goals: goalEvents(H.me ? gh : ga, fKey, xi) });
    })));
    const tables = groups.map((gr) => gr.slice().sort((a, b) => sortTable(a, b) || Math.random() - 0.5));

    // Knockouts: single match, extra time, then penalties.
    const ko = [];
    const playKO = (H, A, stage, short, neutral) => {
      const m = playMatch(H, A, !neutral);
      let gh = m.gh, ga = m.ga, et = false, pens = null, etH = 0, etA = 0;
      if (gh === ga) {
        et = true; etH = poisson(m.lh / 3); etA = poisson(m.la / 3); gh += etH; ga += etA;
        if (gh === ga) {
          const pH = clamp(0.5 + ((H.attack + H.defense) - (A.attack + A.defense)) / 200, 0.35, 0.65);
          const win = 3 + rand(3), lose = Math.max(0, win - 1 - rand(2));
          pens = Math.random() < pH ? [win, lose] : [lose, win];
        }
      }
      const winner = pens ? (pens[0] > pens[1] ? H : A) : (gh > ga ? H : A);
      ko.push({ stage, home: H.name, away: A.name, hMe: !!H.me, aMe: !!A.me, hReg: H.region, aReg: A.region, gh, ga, et, pens, winner: winner.name });
      if (H.me || A.me) {
        const reg = H.me ? m.gh : m.ga, extra = H.me ? etH : etA;
        addMine(H, A, gh, ga, {
          stage, short, et, pens: pens ? (H.me ? pens : [pens[1], pens[0]]) : null, adv: !!winner.me,
          goals: goalEvents(reg, fKey, xi).concat(goalEvents(extra, fKey, xi, 91, 120)),
        });
      }
      return winner;
    };
    const [A, B, Cg, D] = tables;
    const qf = [[A[0], B[1]], [B[0], A[1]], [Cg[0], D[1]], [D[0], Cg[1]]].map(([h, a]) => playKO(h, a, 'Quarter-final', 'QF'));
    const sf = [[qf[0], qf[1]], [qf[2], qf[3]]].map((pair) => { const [h, a] = shuffle(pair.slice()); return playKO(h, a, 'Semi-final', 'SF'); });
    const champ = playKO(sf[0], sf[1], 'Final', 'F', true);

    let finish = 'Group stage';
    if (A.indexOf(me) <= 1) {
      const lastMine = ko.filter((k) => k.hMe || k.aMe).pop();
      if (champ.me) finish = 'Champion';
      else finish = { 'Quarter-final': 'Quarter-final', 'Semi-final': 'Semi-final', Final: 'Runner-up' }[lastMine.stage];
    }
    return { groups: tables.map((t) => t.map(tableRow)), ko, games: myGames, finish };
  }

  // ---------------- Stats ----------------
  const hasGoalData = (res) => !!(res && res.games && res.games.length && res.games[0].goals);
  const slotName = (i) => (C.xi[i] ? BY_ID.get(C.xi[i]).name : '?');
  const cellRes = (g) => (g.pens ? (g.adv ? 'W' : 'L') : g.res);
  const scoreText = (g) => `${g.gf}–${g.ga}${g.pens ? ` (pens ${g.pens[0]}–${g.pens[1]})` : g.et ? ' (aet)' : ''}`;
  function scorerText(g, withAssists = true) {
    return g.goals.map((e) => `${esc(slotName(e.s))} ${e.m}'${withAssists && e.a != null ? ` <span class="muted">(${esc(slotName(e.a))})</span>` : ''}`).join(', ');
  }

  // Games that count toward the pitch badges right now (live during playback, all comps after).
  function runGames() {
    if (!hasGoalData(C.result)) return null;
    const league = C.result.games;
    if (seasonTimer && livePhase === 'league') return league.slice(0, liveUpTo);
    if (!C.national) return league;
    return league.concat(seasonTimer && livePhase === 'national' ? C.national.games.slice(0, liveUpTo) : C.national.games);
  }

  function seasonPlayerStats(games) {
    const f = FORMATIONS[C.f];
    const st = f.map(() => ({ g: 0, a: 0, cs: 0, motm: 0 }));
    games.forEach((g) => {
      const score = {};
      for (const e of g.goals || []) {
        st[e.s].g++; score[e.s] = (score[e.s] || 0) + 2;
        if (e.a != null) { st[e.a].a++; score[e.a] = (score[e.a] || 0) + 1; }
      }
      if (g.ga === 0) f.forEach(([pos], i) => { if (POS[pos].line === 'GK' || POS[pos].line === 'DEF') st[i].cs++; });
      // Man of the match: biggest goal contribution; a clean-sheet keeper otherwise.
      let best = null, bv = 0;
      for (const k in score) if (score[k] > bv) { bv = score[k]; best = +k; }
      if (best == null && g.ga === 0) best = 0;
      if (best != null && cellRes(g) !== 'L') st[best].motm++;
    });
    return st;
  }

  // Performance rating (40–99), earned from output rather than base stats.
  function perfRatings(games) {
    const st = seasonPlayerStats(games);
    const n = Math.max(1, games.length);
    const pts = games.reduce((t, g) => t + (g.res === 'W' ? 3 : g.res === 'D' ? 1 : 0), 0);
    const team = (pts / n - 1.4) * 10;
    const gaPg = games.reduce((t, g) => t + g.ga, 0) / n;
    return FORMATIONS[C.f].map(([pos], i) => {
      const { g, a, cs, motm } = st[i];
      const G = g / n, A = a / n, CS = cs / n, M = motm / n;
      const line = POS[pos].line;
      let v;
      if (line === 'FWD') v = 50 + 45 * G + 25 * A + 30 * M;
      else if (line === 'MID') v = 52 + 55 * G + 45 * A + 30 * M;
      else if (line === 'DEF') v = 50 + 30 * CS + 45 * G + 30 * A + 30 * M;
      else v = 50 + 40 * CS - 6 * gaPg + 30 * M;
      return clamp(Math.round(v + team), 40, 99);
    });
  }
  const perfColor = (v) => (v >= 85 ? '#5ee08a' : v >= 75 ? '#f5c84c' : v >= 65 ? '#d6dbe3' : '#ef5b5b');

  function teamSeasonStats(games) {
    const rec = () => ({ w: 0, d: 0, l: 0, gf: 0, ga: 0 });
    const t = { home: rec(), away: rec(), cs: 0, fts: 0, bigWin: null, bigLoss: null, winRun: 0, unbeatenRun: 0 };
    let wr = 0, ur = 0;
    for (const g of games) {
      const r = g.home ? t.home : t.away;
      r[g.res.toLowerCase()]++; r.gf += g.gf; r.ga += g.ga;
      if (g.ga === 0) t.cs++;
      if (g.gf === 0) t.fts++;
      const margin = g.gf - g.ga;
      if (margin > 0 && (!t.bigWin || margin > t.bigWin.gf - t.bigWin.ga || (margin === t.bigWin.gf - t.bigWin.ga && g.gf > t.bigWin.gf))) t.bigWin = g;
      if (margin < 0 && (!t.bigLoss || margin < t.bigLoss.gf - t.bigLoss.ga)) t.bigLoss = g;
      wr = g.res === 'W' ? wr + 1 : 0; ur = g.res !== 'L' ? ur + 1 : 0;
      t.winRun = Math.max(t.winRun, wr); t.unbeatenRun = Math.max(t.unbeatenRun, ur);
    }
    return t;
  }

  // ---------------- Result panel ----------------
  let resultTab = 'squad', resultComp = 'league';

  function squadBody(games, label) {
    const st = seasonPlayerStats(games);
    const pr = perfRatings(games);
    const rows = FORMATIONS[C.f].map(([pos], i) => ({ i, pos, rtg: pr[i], ...st[i] }));
    const top = (k) => rows.reduce((b, r) => (r[k] > b[k] ? r : b), rows[0]);
    const award = (icon, lbl, r, v) => (r && r[v] > 0 ? `<div class="award"><span>${icon}</span><div><small>${lbl}</small><b>${esc(slotName(r.i))}</b></div><em>${r[v]}</em></div>` : '');
    const gk = rows.find((r) => r.pos === 'GK');
    rows.sort((a, b) => b.rtg - a.rtg || (b.g + b.a) - (a.g + a.a) || a.i - b.i);
    return `<div class="awards">
        ${award('👟', 'Golden Boot', top('g'), 'g')}${award('🎯', 'Top Assists', top('a'), 'a')}
        ${award('⭐', label, top('rtg'), 'rtg')}${award('🧤', 'Golden Glove', gk, 'cs')}
      </div>
      <div class="table-wrap"><table class="league squad">
      <tr><th class="team">Player</th><th title="Performance rating">RTG</th><th>G</th><th>A</th><th>G+A</th><th title="Clean sheets">CS</th><th title="Man of the match">MOTM</th></tr>
      ${rows.map((r) => `<tr><td class="team"><span class="ppos" style="color:${posColor(r.pos)}">${r.pos}</span>${esc(slotName(r.i))}</td><td><b style="color:${perfColor(r.rtg)}">${r.rtg}</b></td><td>${r.g}</td><td>${r.a}</td><td><b>${r.g + r.a}</b></td><td>${POS[r.pos].line === 'GK' || POS[r.pos].line === 'DEF' ? r.cs : '–'}</td><td>${r.motm}</td></tr>`).join('')}
      </table></div>`;
  }
  function matchesBody(games, labelFn) {
    return `<div class="matches">${games.map((g) => `<div class="m">
      <span class="muted">${labelFn(g)}</span><span class="muted">${g.home ? 'vs' : '@'}</span><span class="opp">${esc(g.opp)}</span><span class="${cellRes(g)}">${cellRes(g)} ${scoreText(g)}</span>
      ${g.goals && g.goals.length ? `<span class="scorers">${scorerText(g)}</span>` : ''}</div>`).join('')}</div>`;
  }
  const tabsHTML = (tabs) => `<div class="seg small result-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === resultTab ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const formStrip = (games) => `<div class="form-strip">${games.map((g) => `<i class="${cellRes(g)}" title="${esc(g.stage || 'MD' + g.md)} ${g.home ? 'vs' : '@'} ${esc(g.opp)} ${scoreText(g)}">${cellRes(g)}</i>`).join('')}</div>`;

  function renderResult() {
    const R = C.mode === 'regions';
    const showNat = R && C.national && resultComp === 'national';
    const compSwitch = R && C.national
      ? `<div class="seg comp-switch"><button data-comp="league" class="${showNat ? '' : 'on'}">🏠 ${REGION[C.home]} League</button><button data-comp="national" class="${showNat ? 'on' : ''}">🌍 National League</button></div>`
      : '';
    $('#ch-result-box').innerHTML = compSwitch + (showNat ? nationalHTML() : leagueHTML());
  }

  function leagueHTML() {
    const R = C.mode === 'regions';
    const { me, table, games } = C.result;
    let verdict;
    if (me.w === 38) verdict = '🏆 PERFECT 38–0! Absolute legends.';
    else if (me.l === 0) verdict = '🛡️ Unbeaten — The Invincibles!';
    else if (me.position === 1) verdict = '🏆 League Champions!';
    else if (me.position === 2) verdict = '🥈 Runners-up — so close!';
    else if (me.position <= 4) verdict = '⭐ Top-four finish';
    else if (me.position <= 17) verdict = 'Mid-table season';
    else verdict = '⬇️ Relegated…';
    let extra = '';
    if (R) {
      extra = me.position > 4 ? '<div class="sub">Missed out on the National League (top 4 qualify).</div>'
        : C.national ? `<div class="sub qual">🌍 National League: <b>${NAT_LABEL[C.national.finish]}</b></div>`
          : '<div class="sub qual">✅ Qualified for the National League!</div>';
    }
    if (!['squad', 'team', 'table', 'matches'].includes(resultTab)) resultTab = 'squad';
    let body;
    if (resultTab === 'table') {
      body = `<div class="table-wrap"><table class="league">
        <tr><th>#</th><th class="team">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
        ${table.map((t, i) => `<tr class="${t.me ? 'me' : ''}${i === 3 || i === 16 ? ' cut' : ''}"><td>${i + 1}</td><td class="team">${esc(t.name)}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}</td><td>${t.ga}</td><td>${sgn(t.gf - t.ga)}</td><td><b>${t.pts}</b></td></tr>`).join('')}
      </table></div>`;
    } else if (resultTab === 'team') {
      const t = teamSeasonStats(games);
      const cell = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
      const score = (g) => (g ? `${g.gf}–${g.ga} ${g.home ? 'vs' : '@'} ${esc(g.opp)}` : '—');
      const r = (x) => `${x.w}–${x.d}–${x.l}`;
      body = `<div class="kv-grid">
        ${cell('Played', me.p)}${cell('Points', me.pts)}${cell('Won', me.w)}${cell('Drawn', me.d)}${cell('Lost', me.l)}${cell('Win %', Math.round((me.w / me.p) * 100) + '%')}
        ${cell('Goals for', me.gf)}${cell('Goals against', me.ga)}${cell('Goal diff', sgn(me.gf - me.ga))}${cell('Goals / game', (me.gf / me.p).toFixed(2))}
        ${cell('Clean sheets', t.cs)}${cell('Failed to score', t.fts)}
        ${cell('Home', `${r(t.home)} <small>(${t.home.gf}–${t.home.ga})</small>`)}${cell('Away', `${r(t.away)} <small>(${t.away.gf}–${t.away.ga})</small>`)}
        ${cell('Longest win streak', t.winRun)}${cell('Longest unbeaten', t.unbeatenRun)}
      </div>
      <div class="kv wide"><span>Biggest win</span><b>${score(t.bigWin)}</b></div>
      <div class="kv wide"><span>Heaviest defeat</span><b>${score(t.bigLoss)}</b></div>`;
    } else if (resultTab === 'matches') {
      body = matchesBody(games, (g) => g.md);
    } else if (!hasGoalData(C.result)) {
      body = '<p class="muted small-text">Player stats are tracked for seasons played from now on.</p>';
    } else {
      body = squadBody(games, 'Player of the Season');
    }
    return `
      <div class="box-title">${R ? `${REGION[C.home]} League` : 'Season result'}</div>
      <div class="record">${me.w}–${me.d}–${me.l}</div>
      <div class="sub">W–D–L · ${me.pts} pts · ${ord(me.position)} place</div>
      <div class="sub">GF ${me.gf} · GA ${me.ga} · GD ${sgn(me.gf - me.ga)}</div>
      <div class="verdict">${verdict}</div>${extra}
      ${formStrip(games)}
      ${tabsHTML([['squad', 'Squad'], ['team', 'Team'], ['table', 'Table'], ['matches', 'Matches']])}
      <div class="tab-body">${body}</div>`;
  }

  function nationalHTML() {
    const N = C.national, games = N.games;
    const rec = games.reduce((r, g) => { r[g.res]++; r.gf += g.gf; r.ga += g.ga; return r; }, { W: 0, D: 0, L: 0, gf: 0, ga: 0 });
    const verdict = {
      Champion: '🏆 NATIONAL CHAMPIONS!', 'Runner-up': '🥈 Beaten in the Final', 'Semi-final': 'Knocked out in the Semi-finals',
      'Quarter-final': 'Knocked out in the Quarter-finals', 'Group stage': 'Eliminated in the group stage',
    }[N.finish];
    if (!['squad', 'groups', 'bracket', 'matches'].includes(resultTab)) resultTab = 'squad';
    const reg = (g) => (g ? `<span class="reg">${REGION[g].slice(0, 3)}</span>` : '');
    let body;
    if (resultTab === 'groups') {
      body = N.groups.map((t, gi) => `<div class="group"><div class="group-title">Group ${'ABCD'[gi]}</div><table class="league">
        <tr><th>#</th><th class="team">Club</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        ${t.map((r, i) => `<tr class="${r.me ? 'me' : ''}${i === 1 ? ' cut' : ''}"><td>${i + 1}</td><td class="team">${reg(r.region)}${esc(r.name)}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${sgn(r.gf - r.ga)}</td><td><b>${r.pts}</b></td></tr>`).join('')}
      </table></div>`).join('');
    } else if (resultTab === 'bracket') {
      body = ['Quarter-final', 'Semi-final', 'Final'].map((st) => `<div class="group-title">${st === 'Final' ? 'Final' : st + 's'}</div>
        ${N.ko.filter((k) => k.stage === st).map((k) => {
          const side = (name, regn, isMe) => `<span class="${k.winner === name ? 'win' : ''}${isMe ? ' meteam' : ''}">${reg(regn)}${esc(name)}</span>`;
          return `<div class="tie">${side(k.home, k.hReg, k.hMe)}<b>${k.gh}–${k.ga}</b>${side(k.away, k.aReg, k.aMe)}${k.pens ? `<small>pens ${k.pens[0]}–${k.pens[1]}</small>` : k.et ? '<small>aet</small>' : ''}</div>`;
        }).join('')}`).join('');
    } else if (resultTab === 'matches') {
      body = matchesBody(games, (g) => g.short);
    } else {
      body = squadBody(games, 'Player of the Tournament');
    }
    return `
      <div class="box-title">🌍 National League</div>
      <div class="record">${rec.W}–${rec.D}–${rec.L}</div>
      <div class="sub">W–D–L · GF ${rec.gf} · GA ${rec.ga} · GD ${sgn(rec.gf - rec.ga)}</div>
      <div class="verdict">${verdict}</div>
      ${formStrip(games)}
      ${tabsHTML([['squad', 'Squad'], ['groups', 'Groups'], ['bracket', 'Bracket'], ['matches', 'Matches']])}
      <div class="tab-body">${body}</div>`;
  }

  $('#ch-result-box').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    const c = e.target.closest('[data-comp]');
    if (t) resultTab = t.dataset.tab;
    else if (c) resultComp = c.dataset.comp;
    else return;
    renderResult();
  });

  // ================================================================
  // Boot
  // ================================================================
  const fromHash = decodeHash();
  if (fromHash) { B = fromHash; S.view = 'builder'; }
  if (!B || !Array.isArray(B.xi) || !FORMATIONS[B.f]) defaultBuilder();
  if (!Array.isArray(B.subs)) B.subs = Array(BENCH_SIZE).fill(null);
  for (const k in RUNS) if (!FORMATIONS[RUNS[k].f]) RUNS[k] = newRun(RUNS[k].mode);
  C = RUNS[S.view] || RUNS.challenge;
  if (NAT_LABEL[SR.bestText]) SR.bestText = NAT_LABEL[SR.bestText]; // older saves stored the raw stage name

  initControls();
  render();
})();
