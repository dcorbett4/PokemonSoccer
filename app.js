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
  // `color` follows the light/dark theme (CSS variable); `hex` is for canvas drawing.
  const LINES = {
    GK: { name: 'Goalkeeper', color: 'var(--c-gk)', hex: '#8A6200' },
    DEF: { name: 'Defense', color: 'var(--c-def)', hex: '#2C5D8F' },
    MID: { name: 'Midfield', color: 'var(--c-mid)', hex: '#2F7A4B' },
    FWD: { name: 'Attack', color: 'var(--c-fwd)', hex: '#B8401A' },
    SUB: { name: 'Bench', color: 'var(--muted)', hex: '#6B6A62' },
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
  // Game randomness goes through RNG so a run can be replayed exactly from a seed (friend challenges,
  // the Daily). Cosmetic randomness (confetti) keeps using Math.random directly.
  let RNG = Math.random;
  const rnd = () => RNG();
  function hash32(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    return (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
  }
  function mulberry32(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngFor = (...parts) => mulberry32(hash32(parts.join('|')));
  function withRng(r, fn) { const prev = RNG; RNG = r || prev; try { return fn(); } finally { RNG = prev; } }
  const newSeed = () => [...crypto.getRandomValues(new Uint32Array(2))].map((n) => n.toString(36)).join('').slice(0, 10);
  const rand = (n) => Math.floor(rnd() * n);
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
  const posHex = (pos) => LINES[lineOf(pos)].hex;

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
  const statCol = (v) => (v >= 110 ? 'var(--win)' : v >= 80 ? 'var(--ink)' : 'var(--faint)');
  // Six stat columns with a small bar under each (draft options, picker).
  const statBars = (p, hl) => `<span class="sbars">${STAT_KEYS.map(([k]) =>
    `<span class="sb${hl === k ? ' hl' : ''}"><b>${p.s[k]}</b><i><u style="width:${Math.min(100, Math.round(p.s[k] / 1.6))}%;background:${statCol(p.s[k])}"></u></i></span>`).join('')}</span>`;
  const statHead = (extra = '') => `<div class="opt-head" aria-hidden="true"><span></span><span>POKÉMON</span><span class="sbars"><span>HP</span><span>ATK</span><span>DEF</span><span>SPA</span><span>SPD</span><span>SPE</span></span>${extra}</div>`;
  const pkMeta = (p) => `#${String(p.id).padStart(3, '0')} · ${p.types.map(cap).join(' / ')}`;
  const statLine = (p) => `HP ${p.s.hp} · Atk ${p.s.atk} · Def ${p.s.def} · SpA ${p.s.spa} · SpD ${p.s.spd} · Spe ${p.s.spe}`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  // ================================================================
  // State
  // ================================================================
  const S = Object.assign({ view: 'builder', sprite: 'pixel', simMode: 'auto', simSpeed: 1 }, store.get('pxi.settings', {}));
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
    if (S.view === 'records') return { f: '4-3-3', xi: allTimeXI().xi, subs: [], bench: false };
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
    b.style.setProperty('--rc', perfHex(v)); // bright set: the badge always sits on the green pitch
  }

  function renderSquadSheet() {
    const el = $('#squad-sheet');
    const show = isRun() && (C.phase === 'draft' || C.phase === 'ready');
    el.hidden = !show;
    if (!show) return;
    const f = FORMATIONS[C.f];
    const n = C.xi.filter(Boolean).length;
    el.innerHTML = `<span class="label">Squad sheet</span><ol>${f.map(([pos], i) => {
      const id = C.xi[i];
      return `<li class="${id ? 'filled' : 'empty'}"><span>${pos}</span><span>${id ? esc(BY_ID.get(id).name) : '—'}</span></li>`;
    }).join('')}</ol><span class="ss-count">${n}<span> / 11 drafted</span></span>`;
  }

  function renderPitch() {
    const sq = currentSquad();
    const f = FORMATIONS[sq.f];
    const pick = isRun() && C.phase === 'draft' && C.pick ? BY_ID.get(C.pick) : null;
    playersEl.classList.toggle('locked', S.view !== 'builder');

    // Keyed update so players glide when the formation changes.
    while (playersEl.children.length < 11) {
      const d = document.createElement('div');
      d.className = 'player';
      d.dataset.slot = playersEl.children.length;
      playersEl.appendChild(d);
    }
    let popN = 0;
    let gaStats = null, perf = null;
    if (S.view === 'records') {
      const at = allTimeXI();
      gaStats = at.stats; perf = at.rtg;
    } else {
      const live = isRun() && (C.phase === 'result' || C.phase === 'national') ? runGames() : null;
      gaStats = live ? seasonPlayerStats(live) : null;
      perf = live && !seasonTimer ? perfRatings(live) : null;
    }
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
    $('#records-panel').hidden = S.view !== 'records';
    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === S.view));
    document.title = ({ challenge: '38–0 Challenge · ', regions: 'Region League · ', records: 'Records · ' }[S.view] || '') + 'Pokémon Starting XI';
    renderSpriteSegs();
    if (S.view === 'builder') { trackHistory(); renderBuilderPanel(); } else if (S.view === 'records') renderRecords(); else renderChallenge();
    renderPitch();
    renderSquadSheet();
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
    if (!el || e.button > 0 || S.view === 'records') return;
    if (isRun()) {
      if (el.classList.contains('placeable') && !autoDrafting) placePick(+el.dataset.slot);
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
    const val = (p) => p.s[sort];
    const rows = list.slice();
    if (sort !== 'dex') rows.sort((a, b) => val(b) - val(a) || a.id - b.id);
    const cur = getSlot(pickerSlot);
    const art = S.sprite === 'art' ? ' art' : '';
    $('#picker-grid').innerHTML = rows.length ? statHead('<span></span>') + rows.map((p) => {
      const at = findSlot(p.id);
      return `<button class="pk${art}${p.id === cur ? ' sel' : ''}" data-id="${p.id}" title="${statLine(p)}">
        ${imgTag(p.id, S.sprite)}
        <span class="pk-main"><span class="n">${esc(p.name)}</span><span class="no">${pkMeta(p)}</span></span>
        ${statBars(p, sort)}
        <span>${at >= 0 ? `<span class="tag">${slotPos(at)}</span>` : p.leg ? '<span class="leg">LEG</span>' : ''}</span></button>`;
    }).join('') : '<p class="muted">No Pokémon match that search.</p>';
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
    if (!id) return;
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
    const c = await buildImage();
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
  async function buildImage() {
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
    ctx.fillStyle = '#F2EFE7'; ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#15181C'; ctx.font = '800 64px "Barlow Condensed", sans-serif'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('My Pokémon ', PX, 92);
    const w1 = ctx.measureText('My Pokémon ').width;
    ctx.fillStyle = '#2F7A4B'; ctx.fillText('Starting XI', PX + w1, 92);
    ctx.fillStyle = '#6B6A62'; ctx.font = '600 26px "IBM Plex Sans", sans-serif';
    const res = isRun() && (C.phase === 'result' || C.phase === 'national') && C.result ? C.result.me : null;
    const mode = C.mode === 'regions' ? `${REGION[C.home]} League` : '38–0 Challenge';
    const nat = res && C.national ? ` · Victory Road: ${NAT_LABEL[C.national.finish]}` : '';
    const sub = isRun() ? `${mode} · ${sq.f}${res ? ` · ${res.w}–${res.d}–${res.l} · ${ord(res.position)}${nat}` : ''}` : `${sq.f} · ${REGION[B.gen]}${B.gen ? ' (Gen ' + B.gen + ')' : ' Gens'}`;
    ctx.fillText(sub, PX, 130);

    // Pitch
    ctx.save();
    roundRect(ctx, PX, PY, PW, PH, 24); ctx.clip();
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#2F6B46' : '#2C6642'; ctx.fillRect(PX, PY + (PH / 16) * i, PW, PH / 16 + 1); }
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
        ctx.fillStyle = '#15181C';
        ctx.beginPath(); ctx.arc(rx, ry, 22 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = perfHex(rtg); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = perfHex(rtg); ctx.font = `700 ${Math.round(19 * scale)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(rtg), rx, ry + 1);
        ctx.textBaseline = 'alphabetic';
      }
      const p = id ? BY_ID.get(id) : null;
      const name = p ? p.name.toUpperCase() : 'EMPTY';
      ctx.font = `700 ${Math.round(25 * scale)}px "Barlow Condensed", sans-serif`;
      const nw = ctx.measureText(name).width;
      const pw = Math.max(nw + 28 * scale, 140 * scale), ph = 56 * scale;
      ctx.fillStyle = '#F2EFE7';
      roundRect(ctx, cx - pw / 2, plateY, pw, ph, 4 * scale); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = p ? '#15181C' : '#6B6A62';
      ctx.fillText(name, cx, plateY + 25 * scale);
      ctx.font = `700 ${Math.round(18 * scale)}px "IBM Plex Mono", monospace`;
      const label = pos + (ga ? '  ' + ga : '');
      const lw = ctx.measureText(label).width, pw2 = ctx.measureText(pos).width;
      ctx.textAlign = 'left';
      ctx.fillStyle = posHex(pos);
      ctx.fillText(pos, cx - lw / 2, plateY + 47 * scale);
      if (ga) { ctx.fillStyle = '#15181C'; ctx.fillText('  ' + ga, cx - lw / 2 + pw2, plateY + 47 * scale); }
    }

    const allGames = res ? runGames() : null;
    const gaAll = allGames ? seasonPlayerStats(allGames) : null;
    const prAll = allGames ? perfRatings(allGames) : null;
    const gaTxt = (st) => (st && (st.g || st.a) ? [st.g ? st.g + 'G' : '', st.a ? st.a + 'A' : ''].filter(Boolean).join(' ') : '');
    f.forEach(([pos, x, y], i) => drawPlayer(PX + (PW * x) / 100, PY + (PH * y) / 100, sq.xi[i], pos, 1, gaAll ? gaTxt(gaAll[i]) : '', prAll ? prAll[i] : null));

    if (sq.bench) {
      const by = PY + PH + 20;
      ctx.fillStyle = '#ECE8DD'; roundRect(ctx, PX, by, PW, benchH - 20, 20); ctx.fill();
      ctx.fillStyle = '#6B6A62'; ctx.font = '800 18px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('SUBSTITUTES', PX + 20, by + 34);
      sq.subs.forEach((id, i) => drawPlayer(PX + (PW / 5) * (i + 0.5), by + 130, id, 'SUB', 0.82));
    }

    ctx.textAlign = 'right'; ctx.fillStyle = '#6B6A62'; ctx.font = '700 22px "IBM Plex Sans", sans-serif';
    ctx.fillText('Pokémon Starting XI', W - PX, H - 26);
    return c;
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
  // 'Quarter-final' only appears in saves from before Victory Road switched to a Final Four.
  const NAT_LABEL = { 'Group stage': 'Out on Victory Road', 'Quarter-final': 'Quarter-finalists', 'Semi-final': 'Final Four', 'Runner-up': 'Runners-up', Champion: 'Champions' };

  function newRun(mode) {
    return {
      mode, phase: 'setup', pool: 'all', home: 1, f: '4-3-3', xi: Array(11).fill(null),
      round: 0, roll: null, legUsed: 0, rerolls: 2, pick: null, result: null, national: null,
      seed: null, rerollN: 0, daily: null, dailyKey: null, vs: null,
    };
  }
  const viewOf = (mode) => (mode === 'regions' ? 'regions' : 'challenge');
  function resetRun() {
    const { mode, pool, f, home } = C;
    C = Object.assign(newRun(mode), { pool, f, home });
    RUNS[viewOf(mode)] = C;
  }
  // Start drafting a fresh run. Every new run is seeded so it can be shared as a challenge.
  function beginRun(opts = {}) {
    resetRun();
    Object.assign(C, { seed: newSeed() }, opts, { phase: 'draft' });
    rollRound(); startRoll();
  }

  function otherGen(home) { let g; do { g = 1 + rand(9); } while (g === home); return g; }

  function rollRound() {
    if (C.seed) { seededRoll(); return; }
    const taken = new Set(C.xi);
    for (let tries = 0; tries < 300; tries++) {
      const gen = C.mode === 'regions'
        ? (rnd() < HOME_ODDS ? C.home : otherGen(C.home))
        : 1 + rand(C.pool === 'retro' ? 4 : 9);
      const type = TYPES[rand(TYPES.length)];
      const opts = DEX.filter((p) => p.gen === gen && p.types.includes(type) && !taken.has(p.id));
      const usable = opts.filter((p) => !p.leg || C.legUsed < 3);
      if (usable.length >= 3) { C.roll = { gen, type, ids: opts.map((p) => p.id) }; C.pick = null; return; }
    }
  }

  // Seeded rolls depend only on (seed, round, reroll #), never on what you've drafted, so two players
  // on the same seed always see the same rolls. Already-drafted Pokémon just show as unavailable.
  function seededRoll() {
    const selectable = (ids) => ids.filter((id) => !C.xi.includes(id) && (!BY_ID.get(id).leg || C.legUsed < 3)).length;
    for (let skip = 0; skip < 50; skip++) {
      const r = rngFor(C.seed, 'roll', C.round, C.rerollN, skip);
      for (let tries = 0; tries < 300; tries++) {
        const gen = C.mode === 'regions'
          ? (r() < HOME_ODDS ? C.home : (() => { let g; do { g = 1 + Math.floor(r() * 9); } while (g === C.home); return g; })())
          : 1 + Math.floor(r() * (C.pool === 'retro' ? 4 : 9));
        const type = TYPES[Math.floor(r() * TYPES.length)];
        const ids = DEX.filter((p) => p.gen === gen && p.types.includes(type)).map((p) => p.id);
        if (ids.length < 3) continue;
        if (!selectable(ids)) break; // nothing you can take: deterministically skip to the next roll
        C.roll = { gen, type, ids }; C.pick = null;
        return;
      }
    }
  }

  function placePick(slot) {
    if (C.phase !== 'draft' || !C.pick || C.xi[slot]) return;
    const p = BY_ID.get(C.pick);
    C.xi[slot] = C.pick;
    if (p.leg) C.legUsed++;
    C.round++;
    C.rerollN = 0;
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
    return `<span class="r-region ${cls}">${REGION[gen]}</span><span class="r-sep ${cls}">/</span>`
      + `<span class="r-type ${cls}"><i style="background:${TYPE_COLORS[type]}"></i>${cap(type)}</span>${home ? '<span class="r-home">HOME</span>' : ''}`;
  }
  function startRoll() {
    clearTimeout(rollTimer);
    if (REDUCE) { rolling = false; render(); return; }
    rolling = true;
    render();
    const run = C;
    const maxGen = C.mode !== 'regions' && C.pool === 'retro' ? 4 : 9, dur = autoDrafting ? 320 : 1100, t0 = performance.now();
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
      rollTimer = setTimeout(tick, 45 + Math.pow(t / dur, 2) * (autoDrafting ? 50 : 190));
    };
    tick();
  }

  const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
  const sgn = (n) => (n > 0 ? '+' : '') + n;
  const qualifies = () => C.mode === 'regions' && C.result && C.result.me.position <= 4;

  function renderChallenge() {
    const R = C.mode === 'regions';
    $('#ch-mode-title').textContent = R ? 'Region League' : C.daily ? `Daily Challenge #${C.daily}` : '38–0 Challenge';
    $('#ch-kicker').textContent = R ? `Draft mode · ${REGION[C.home]} · ${C.f}` : `Draft mode · ${C.f}${C.pool === 'retro' ? ' · Gen 1–4' : ''}`;
    $('#ch-lede').textContent = R
      ? `Pick a home region — 75% of your draft rolls come from there. Fill all 11, play a 38-game regional league, and finish top 4 to reach Victory Road against the best clubs from every other region. Win your group to make the Final Four.`
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
    $('#ch-play').textContent = R ? `Play the ${REGION[C.home]} League` : 'Play the season';

    if (R) {
      $('#st-k1').textContent = 'Victory Road titles'; $('#st-best').textContent = SR.titles;
      $('#st-k2').textContent = 'Best finish'; $('#st-rec').textContent = SR.bestText || '–';
    } else {
      $('#st-k1').textContent = 'Best points'; $('#st-best').textContent = ST.best == null ? '–' : ST.best + ' pts';
      $('#st-k2').textContent = 'Best record'; $('#st-rec').textContent = ST.bestRec || '–';
    }
    $('#st-runs').textContent = R ? SR.runs : ST.runs;

    const canGoNational = qualifies() && C.phase === 'result' && !C.national;
    $('#ch-national').hidden = !canGoNational || !!seasonTimer;
    $('#ch-again').hidden = !!seasonTimer;
    $('#ch-hof').hidden = !!seasonTimer || !(C.national && C.national.finish === 'Champion');
    // Dailies are already shared by everyone, so they don't get a challenge link.
    $('#ch-challenge').hidden = !!seasonTimer || !(C.phase === 'result' || C.phase === 'national') || !C.seed || !!C.daily;
    $('#ch-challenge').textContent = C.vs ? 'Challenge someone else' : 'Challenge a friend';
    renderDaily();
    $('#ch-vs').hidden = !C.vs || C.phase === 'result' || C.phase === 'national';
    if (C.vs) $('#ch-vs').innerHTML = `Challenge from <b>${esc(C.vs.a.n)}</b>: beat ${resultLine(C.vs.a.r)}`;
    $('#ch-share').hidden = !!seasonTimer || !(C.phase === 'result' || C.phase === 'national') || !C.result;
    $('#ch-again').className = 'btn wide';
    $('#ch-again').textContent = canGoNational ? 'End run' : 'New run';

    if (C.phase === 'draft' && C.roll) {
      $('#ch-round').textContent = `Round ${C.round + 1}`;
      $('#ch-progress').innerHTML = Array.from({ length: 11 }, (_, k) => `<i class="${k < C.round ? 'done' : k === C.round ? 'now' : ''}"></i>`).join('');
      const eligible = C.roll.ids.filter((id) => !C.xi.includes(id)).length;
      $('#ch-leg').textContent = `${eligible} eligible · ${C.rerolls} reroll${C.rerolls === 1 ? '' : 's'} left · Legendaries ${C.legUsed} of 3`;
      $('#ch-reroll').textContent = `Reroll (${C.rerolls})`;
      $('#ch-reroll').disabled = C.rerolls <= 0 || rolling || autoDrafting;
      $('#ch-auto').disabled = autoDrafting;
      $('#ch-auto').textContent = autoDrafting ? 'Auto-drafting…' : 'Auto-draft the rest';
      const opts = $('#ch-options');
      opts.classList.toggle('veiled', rolling);
      if (rolling) {
        $('#ch-hint').textContent = 'Rolling…';
        opts.innerHTML = ''; opts.dataset.key = '';
        return;
      }
      $('#ch-roll').innerHTML = rollChips(C.roll.gen, C.roll.type);
      $('#ch-hint').textContent = C.pick
        ? `${BY_ID.get(C.pick).name} selected. Choose an open position on the pitch.`
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
      opts.innerHTML = statHead() + C.roll.ids.map((id, n) => {
        const p = BY_ID.get(id);
        const owned = C.xi.includes(id);
        const locked = owned || (p.leg && C.legUsed >= 3);
        const note = owned ? 'In your squad' : p.leg ? (locked ? 'Legendary · limit reached' : 'Legendary') : '';
        return `<button class="pk deal${art}${C.pick === id ? ' sel' : ''}" data-id="${id}" style="--i:${Math.min(n, 24)}" title="${statLine(p)}" ${locked ? 'disabled' : ''}>
          ${imgTag(id, S.sprite)}
          <span class="pk-main"><span class="n">${esc(p.name)}</span><span class="no">${note ? `<span class="leg">${note}</span> · ` : ''}${pkMeta(p)}</span></span>
          ${statBars(p)}</button>`;
      }).join('');
    }
    if ((C.phase === 'result' || C.phase === 'national') && C.result && !seasonTimer) renderResult();
  }

  $('#ch-home-grid').innerHTML = GENS.filter(([g]) => g).map(([g, n]) => `<button data-v="${g}"><b>${n}</b><small>Gen ${g}</small></button>`).join('');
  $('#ch-home-grid').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.home = +b.dataset.v; render(); });
  $('#ch-pool-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.pool = b.dataset.v; render(); });
  $('#ch-formation-seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; C.f = b.dataset.v; render(); });
  $('#ch-start').addEventListener('click', () => beginRun());
  $('#ch-random').addEventListener('click', () => { beginRun(); autoDraft(); });
  $('#ch-auto').addEventListener('click', autoDraft);

  // The auto-drafter's "manager": score every (Pokémon, open spot) pair by positional fit. 30% of the
  // time it takes the best pair; otherwise it samples, leaning toward good fits. Tuned so auto teams
  // average ~78 OVR (random placement ~64, always-best ~83), leaving room for a sharp manual draft.
  function managerPick(choices) {
    const f = FORMATIONS[C.f];
    const pairs = [];
    C.xi.forEach((v, slot) => {
      if (v) return;
      for (const id of choices) pairs.push({ id, slot, r: rating(BY_ID.get(id), f[slot][0]) });
    });
    pairs.sort((a, b) => b.r - a.r);
    if (Math.random() < 0.3) return pairs[0];
    const top = pairs[0].r, T = 8;
    const w = pairs.map((p) => Math.exp((p.r - top) / T));
    let x = Math.random() * w.reduce((s, v) => s + v, 0);
    for (let i = 0; i < pairs.length; i++) { x -= w[i]; if (x <= 0) return pairs[i]; }
    return pairs[0];
  }

  // Auto-draft: let the manager fill each roll. Rolls still come from the run's seed, so Dailies and
  // challenges stay fair.
  let autoDrafting = false;
  async function autoDraft() {
    if (C.phase !== 'draft' || autoDrafting) return;
    autoDrafting = true;
    render();
    const run = C, wait = (ms) => new Promise((r) => setTimeout(r, REDUCE ? 0 : ms));
    try {
      while (C === run && C.phase === 'draft' && isRun()) {
        if (rolling || !C.roll) { await wait(50); continue; }
        const choices = C.roll.ids.filter((id) => !C.xi.includes(id) && (!BY_ID.get(id).leg || C.legUsed < 3));
        if (!choices.length) break;
        const { id, slot } = managerPick(choices);
        C.pick = id;
        render();
        await wait(180);
        if (C !== run || C.phase !== 'draft') break;
        placePick(slot);
      }
    } finally {
      autoDrafting = false;
      render();
    }
  }

  $('#ch-options').addEventListener('click', (e) => {
    if (autoDrafting) return;
    const b = e.target.closest('.pk'); if (!b || b.disabled) return;
    C.pick = +b.dataset.id; render();
  });
  $('#ch-reroll').addEventListener('click', () => { if (C.rerolls > 0 && !rolling) { C.rerolls--; C.rerollN++; rollRound(); startRoll(); } });
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
    const meClub = { name: 'Your XI', me: true, region: R ? C.home : null, f: C.f, xi: C.xi.slice() };
    // Seeded runs build identical AI clubs for everyone on that seed (so they ignore your picks).
    const ai = withRng(C.seed && rngFor(C.seed, 'clubs'), () => {
      const names = R ? clubsFor(C.home, 19) : shuffle(CLUBS.slice());
      return makeClubs(names.map((name, i) => ({ name, region: R ? C.home : null, tier: i / (names.length - 1) })), C.seed ? new Map() : countUses([meClub]));
    });
    C.result = simulateLeague([meClub, ...ai], C.seed);
    C.national = null;
    if (!C.runId) C.runId = Date.now();
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
      res: C.result,
      label: (g, i) => `Matchday ${i + 1} / ${n}`,
      short: (g) => `MD${g.md}`,
      sub: (w, d) => `${w * 3 + d} pts`,
      streak: (w, d, l) => (l === 0 && d === 0 ? 'Perfect' : l === 0 ? 'Unbeaten' : ''),
      delay: (i, l) => (n - i <= 5 ? (l === 0 ? 420 : 220) : 85),
      onFinish: () => {
        const me = C.result.me;
        if (me.position === 1 || me.l === 0) confetti(me.w === 38 ? 320 : 180);
        else if (R && me.position <= 4) confetti(90);
        if (R && me.position <= 4) toast('Top 4 — you qualified for Victory Road!');
        else if (!R && newBest) toast(`New best: ${me.pts} pts!`);
        if (C.daily && C.dailyKey) saveDaily();
        recordSeason();
      },
    });
  });

  $('#ch-national').addEventListener('click', () => {
    // Victory Road clubs avoid (but don't ban) anyone already used in this run's league.
    const leagueClubs = C.result.clubs || [{ name: 'Your XI', me: true, region: C.home, f: C.f, xi: C.xi.slice() }];
    C.national = simulateNational(leagueClubs[0], countUses(C.seed ? leagueClubs.slice(1) : leagueClubs), C.seed);
    C.phase = 'national';
    resultComp = 'national';
    if (C.national.finish === 'Champion') SR.titles++;
    const newBest = recordRegionFinish();
    playGames(C.national.games, {
      phase: 'national',
      res: C.national,
      // Final Four ties are offered live automatically.
      autoWatch: (g) => g.short && !g.short.startsWith('G'),
      label: (g) => g.stage,
      short: (g) => g.short,
      sub: (w, d, l, gf, ga) => `GF ${gf} · GA ${ga}`,
      streak: (w, d, l) => (l === 0 ? 'Unbeaten' : ''),
      // Group games tick along; knockout ties get a dramatic pause.
      delay: (i) => (C.national.games[i] && !C.national.games[i].short.startsWith('G') ? 1100 : 380),
      onFinish: () => {
        const fin = C.national.finish;
        if (fin === 'Champion') { confetti(360); showHallOfFame(); } else if (newBest) toast(`New best finish: ${NAT_LABEL[fin]}`);
        recordSeason();
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
      <div class="sim-ctl">
        <div class="seg small" id="lv-mode"><button data-m="auto">Auto</button><button data-m="manual">Manual</button></div>
        <div class="seg small" id="lv-speed">${SIM_SPEEDS.map(([v, l]) => `<button data-s="${v}">${l}</button>`).join('')}</div>
        <button class="btn btn-gold wide" id="lv-next" hidden>Next match ▶</button>
      </div>
      <div class="lv-actions">${cfg.res && cfg.res.clubs ? '<button class="btn" id="lv-watch">Watch next match</button>' : ''}<button class="btn" id="lv-skip">Skip to the end</button></div>`;
    const cells = $$('.form-strip i', box);
    let i = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
    const finish = () => {
      clearTimeout(seasonTimer); seasonTimer = null; skipPlayback = null; manualNext = null;
      render();
      cfg.onFinish();
      saveAll();
    };
    skipPlayback = finish;

    // Auto plays on a timer (scaled by speed); manual waits for "Next match".
    const nextBtn = $('#lv-next', box);
    const syncCtl = () => {
      $$('#lv-mode button', box).forEach((b) => b.classList.toggle('on', b.dataset.m === S.simMode));
      $$('#lv-speed button', box).forEach((b) => b.classList.toggle('on', +b.dataset.s === S.simSpeed));
      $('#lv-speed', box).hidden = S.simMode !== 'auto';
      nextBtn.hidden = S.simMode !== 'manual' || i >= games.length;
      if (games[i]) nextBtn.textContent = `Next: ${cfg.short(games[i])} ${games[i].home ? 'vs' : '@'} ${games[i].opp} ▶`;
    };
    const schedule = (ms) => {
      clearTimeout(seasonTimer);
      seasonTimer = 1; // stays truthy while paused in manual mode
      if (S.simMode === 'auto') seasonTimer = setTimeout(step, Math.min(3000, ms / S.simSpeed));
      syncCtl();
    };
    manualNext = () => { if (S.simMode === 'manual' && i < games.length && $('#live').hidden) step(); };
    nextBtn.addEventListener('click', () => manualNext && manualNext());
    $('#lv-mode', box).addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b || b.dataset.m === S.simMode) return;
      S.simMode = b.dataset.m; store.set('pxi.settings', S);
      if (i < games.length && $('#live').hidden) schedule(S.simMode === 'auto' ? 150 : 0);
      else syncCtl();
    });
    $('#lv-speed', box).addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      S.simSpeed = +b.dataset.s; store.set('pxi.settings', S);
      syncCtl();
    });

    let watchNext = false;
    const watchBtnEl = $('#lv-watch', box);
    if (watchBtnEl) watchBtnEl.addEventListener('click', () => {
      watchNext = !watchNext;
      watchBtnEl.textContent = watchNext ? 'Watching next match' : 'Watch next match';
      watchBtnEl.classList.toggle('on', watchNext);
    });
    // Before revealing a game, optionally pause and watch it live.
    const step = () => {
      const g = games[i];
      const mi = cfg.res && cfg.res.clubs ? matchIndex(cfg.res, g) : -1;
      if (mi >= 0 && !REDUCE && (watchNext || (cfg.autoWatch && cfg.autoWatch(g)))) {
        watchNext = false;
        if (watchBtnEl) { watchBtnEl.textContent = 'Watch next match'; watchBtnEl.classList.remove('on'); }
        openLive(cfg.res, mi, { fromPlayback: true, onClose: () => { if (skipPlayback === finish) reveal(); } });
        return;
      }
      reveal();
    };
    const reveal = () => {
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
        + (g.goals && g.goals.length ? `<div class="scorers">${scorerText(g, false)}</div>` : '');
      liveUpTo = i + 1;
      renderPitch();
      t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
      $('#lv-streak', box).textContent = cfg.streak(w, d, l);
      i++;
      if (i >= games.length) { syncCtl(); seasonTimer = setTimeout(finish, 600); return; }
      schedule(cfg.delay(i, l));
    };
    $('#lv-skip', box).addEventListener('click', finish);
    if (REDUCE) finish(); else schedule(400);
  }
  // Season playback speeds: multipliers on each competition's base pacing ("Fast" = the original pace).
  const SIM_SPEEDS = [[0.15, 'Slow'], [0.4, 'Normal'], [1, 'Fast'], [4, 'Turbo']];
  let manualNext = null;
  document.addEventListener('keydown', (e) => {
    if (!manualNext || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') && $$('.modal').every((m) => m.hidden)) { e.preventDefault(); manualNext(); }
  });

  // ---------------- Match simulation ----------------
  function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }

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
      let r = rnd() * tot;
      for (const x of ps) { if (x.i === excl) continue; r -= x[key]; if (r <= 0) return x.i; }
      return ps[ps.length - 1].i;
    };
    return Array.from({ length: n }, () => lo + rand(hi - lo + 1)).sort((a, b) => a - b).map((m) => {
      const sc = pick('sc');
      return { s: sc, a: rnd() < 0.78 ? pick('as', sc) : null, m };
    });
  }

  // AI clubs get real squads. Slot by slot, each club signs the Pokémon whose fit for that position is
  // closest to its quality target. Repeats across clubs and away-from-home signings are discouraged with
  // score penalties (not banned) — small regions can't fill 19 squads on their own.
  const FKEYS = Object.keys(FORMATIONS);
  const REPEAT_PENALTY = 12, AWAY_PENALTY = 12;
  const AI_POOL = DEX.filter((p) => !p.leg);
  function makeClubs(specs, uses) {
    const clubs = specs.map((sp) => ({ name: sp.name, region: sp.region || null, f: FKEYS[rand(FKEYS.length)], xi: Array(11).fill(null), tier: sp.tier }));
    for (let slot = 0; slot < 11; slot++) {
      for (const c of shuffle(clubs.slice())) {
        const pos = FORMATIONS[c.f][slot][0];
        const target = 60 + c.tier * 28 + (rnd() * 8 - 4);
        let best = null, bd = Infinity;
        for (const p of AI_POOL) {
          if (c.xi.includes(p.id)) continue;
          const d = Math.abs(rating(p, pos) - target) + rnd() * 3
            + REPEAT_PENALTY * (uses.get(p.id) || 0) + (c.region && p.gen !== c.region ? AWAY_PENALTY : 0);
          if (d < bd) { bd = d; best = p; }
        }
        c.xi[slot] = best.id;
        uses.set(best.id, (uses.get(best.id) || 0) + 1);
      }
    }
    clubs.forEach((c) => delete c.tier);
    return clubs;
  }
  const countUses = (clubs) => clubs.reduce((m, c) => { c.xi.forEach((id) => id && m.set(id, (m.get(id) || 0) + 1)); return m; }, new Map());
  const strengthOf = (c) => { const t = teamRatings(c.f, c.xi); return { attack: t.attack, defense: t.defense }; };

  // A club's season from its own point of view (works for any club in a result).
  function teamGames(res, ci) {
    return res.matches.map((m, mi) => [m, mi]).filter(([m]) => m.h === ci || m.a === ci).map(([m, mi]) => {
      const home = m.h === ci, o = home ? m.a : m.h;
      const gf = home ? m.gh : m.ga, ga = home ? m.ga : m.gh;
      return {
        md: m.md, mi, stage: m.stage, short: m.short, home, oppIdx: o, opp: res.clubs[o].name,
        oppRegion: res.national ? res.clubs[o].region : undefined,
        gf, ga, res: gf > ga ? 'W' : gf === ga ? 'D' : 'L', goals: home ? m.eh : m.ea,
        et: m.et, pens: m.pens ? (home ? m.pens : [m.pens[1], m.pens[0]]) : null,
        adv: m.winner != null ? m.winner === ci : undefined,
      };
    });
  }

  function simulateLeague(clubs, seed) {
    const str = clubs.map(strengthOf), rec = clubs.map(blankRec);
    // Double round-robin via the circle method.
    const n = clubs.length, idx = clubs.map((_, i) => i), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const games = [];
      for (let i = 0; i < n / 2; i++) {
        const a = idx[i], b = idx[n - 1 - i];
        games.push(r % 2 ? [b, a] : [a, b]);
      }
      rounds.push(games);
      idx.splice(1, 0, idx.pop());
    }
    const matches = [];
    // Each match gets its own seeded dice, so the same fixture plays out comparably for everyone on a seed.
    rounds.concat(rounds.map((g) => g.map(([a, b]) => [b, a]))).forEach((games, ri) => games.forEach(([h, a]) => withRng(seed && rngFor(seed, 'lg', ri, h, a), () => {
      const { gh, ga } = playMatch(str[h], str[a]);
      tally(rec[h], gh, ga); tally(rec[a], ga, gh);
      matches.push({ md: ri + 1, h, a, gh, ga, eh: goalEvents(gh, clubs[h].f, clubs[h].xi), ea: goalEvents(ga, clubs[a].f, clubs[a].xi) });
    })));
    const table = rec.map((r, ci) => Object.assign({ ci, name: clubs[ci].name, me: ci === 0 }, r)).sort(sortTable);
    const me = table.find((t) => t.me);
    me.position = table.indexOf(me) + 1;
    const res = { clubs, matches, table, me };
    res.games = teamGames(res, 0);
    return res;
  }

  // Victory Road: 16 clubs (you + the best of the other regions) in 4 groups of 4. Group winners make the
  // Final Four: semi-finals, then a neutral-ground final.
  function simulateNational(meClub, uses, seed) {
    const R = (...k) => seed && rngFor(seed, 'vr', ...k);
    const clubs = [meClub, ...withRng(R('clubs'), () => {
      const specs = [];
      for (let g = 1; g <= 9; g++) {
        if (g !== meClub.region) clubsFor(g, 2).forEach((name) => specs.push({ name, region: g, tier: 0.6 + rnd() * 0.4 }));
      }
      return makeClubs(shuffle(specs).slice(0, 15), uses);
    })];
    const str = clubs.map(strengthOf), rec = clubs.map(blankRec);
    const groups = [0, 1, 2, 3].map((gi) => [0, 1, 2, 3].map((k) => gi * 4 + k));
    const matches = [];
    const goals = (ci, n, lo, hi) => goalEvents(n, clubs[ci].f, clubs[ci].xi, lo, hi);

    // Group stage: double round-robin inside each group.
    const sched = [[[0, 1], [2, 3]], [[2, 0], [1, 3]], [[0, 3], [1, 2]]];
    sched.concat(sched.map((r) => r.map(([a, b]) => [b, a]))).forEach((round, ri) => groups.forEach((gr) => round.forEach(([x, y]) => withRng(R('g', ri, gr[x], gr[y]), () => {
      const h = gr[x], a = gr[y];
      const { gh, ga } = playMatch(str[h], str[a]);
      tally(rec[h], gh, ga); tally(rec[a], ga, gh);
      matches.push({ md: ri + 1, stage: `Victory Road · MD${ri + 1}`, short: `G${ri + 1}`, h, a, gh, ga, eh: goals(h, gh), ea: goals(a, ga) });
    }))));
    const tables = withRng(R('ties'), () => groups.map((gr) => gr.slice().sort((x, y) => sortTable(rec[x], rec[y]) || rnd() - 0.5)));

    // Knockouts: single match, extra time, then penalties.
    const playKO = (h, a, stage, short, neutral) => withRng(R('ko', stage, h, a), () => {
      const m = playMatch(str[h], str[a], !neutral);
      let gh = m.gh, ga = m.ga, et = false, pens = null, etH = 0, etA = 0;
      if (gh === ga) {
        et = true; etH = poisson(m.lh / 3); etA = poisson(m.la / 3); gh += etH; ga += etA;
        if (gh === ga) {
          const pH = clamp(0.5 + ((str[h].attack + str[h].defense) - (str[a].attack + str[a].defense)) / 200, 0.35, 0.65);
          const win = 3 + rand(3), lose = Math.max(0, win - 1 - rand(2));
          pens = rnd() < pH ? [win, lose] : [lose, win];
        }
      }
      const winner = pens ? (pens[0] > pens[1] ? h : a) : (gh > ga ? h : a);
      matches.push({
        md: 0, stage, short, h, a, gh, ga, et, pens, winner,
        eh: goals(h, m.gh).concat(goals(h, etH, 91, 120)), ea: goals(a, m.ga).concat(goals(a, etA, 91, 120)),
      });
      return winner;
    });
    const [A, B, Cg, D] = tables;
    const sf = [[A[0], B[0]], [Cg[0], D[0]]].map((pair, i) => { const [h, a] = withRng(R('sf', i), () => shuffle(pair.slice())); return playKO(h, a, 'Semi-final', 'SF'); });
    const champ = playKO(sf[0], sf[1], 'Final', 'F', true);

    let finish = 'Group stage';
    if (A[0] === 0) {
      const last = matches.filter((m) => m.winner != null && (m.h === 0 || m.a === 0)).pop();
      finish = champ === 0 ? 'Champion' : { 'Quarter-final': 'Quarter-final', 'Semi-final': 'Semi-final', Final: 'Runner-up' }[last.stage];
    }
    const res = {
      national: true, clubs, matches, finish, champion: champ,
      groups: tables.map((t) => t.map((ci) => Object.assign({ ci, name: clubs[ci].name, region: clubs[ci].region, me: ci === 0 }, rec[ci]))),
    };
    res.games = teamGames(res, 0);
    return res;
  }

  // ---------------- Stats ----------------
  const hasGoalData = (res) => !!(res && res.games && res.games.length && res.games[0].goals);
  const slotName = (i, xi = C.xi) => (xi[i] ? BY_ID.get(xi[i]).name : '?');
  const cellRes = (g) => (g.pens ? (g.adv ? 'W' : 'L') : g.res);
  const scoreText = (g) => `${g.gf}–${g.ga}${g.pens ? ` (pens ${g.pens[0]}–${g.pens[1]})` : g.et ? ' (aet)' : ''}`;
  function scorerText(g, withAssists = true, xi = C.xi) {
    return g.goals.map((e) => `${esc(slotName(e.s, xi))} ${e.m}'${withAssists && e.a != null ? ` <span class="muted">(${esc(slotName(e.a, xi))})</span>` : ''}`).join(', ');
  }

  // Games that count toward the pitch badges right now (live during playback, all comps after).
  function runGames() {
    if (!hasGoalData(C.result)) return null;
    const league = C.result.games;
    if (seasonTimer && livePhase === 'league') return league.slice(0, liveUpTo);
    if (!C.national) return league;
    return league.concat(seasonTimer && livePhase === 'national' ? C.national.games.slice(0, liveUpTo) : C.national.games);
  }

  function seasonPlayerStats(games, fKey = C.f) {
    const f = FORMATIONS[fKey];
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
  function perfRatings(games, fKey = C.f) {
    const st = seasonPlayerStats(games, fKey);
    const n = Math.max(1, games.length);
    const pts = games.reduce((t, g) => t + (g.res === 'W' ? 3 : g.res === 'D' ? 1 : 0), 0);
    const team = (pts / n - 1.4) * 10;
    const gaPg = games.reduce((t, g) => t + g.ga, 0) / n;
    return FORMATIONS[fKey].map(([pos], i) => {
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
  const perfColor = (v) => (v >= 85 ? 'var(--r-great)' : v >= 75 ? 'var(--r-good)' : v >= 65 ? 'var(--r-ok)' : 'var(--r-bad)');
  const perfHex = (v) => (v >= 85 ? '#7CF0A0' : v >= 75 ? '#FFD45E' : v >= 65 ? '#E6E1D5' : '#FF8A5C'); // on-pitch badges + canvas

  // Every player in a competition with their season numbers (cached per result object).
  const playersCache = new WeakMap();
  function compPlayers(res) {
    if (playersCache.has(res)) return playersCache.get(res);
    const out = [];
    res.clubs.forEach((c, ci) => {
      const games = teamGames(res, ci);
      const st = seasonPlayerStats(games, c.f), pr = perfRatings(games, c.f);
      c.xi.forEach((id, slot) => out.push(Object.assign({ ci, slot, id, pos: FORMATIONS[c.f][slot][0], club: c.name, me: ci === 0, rtg: pr[slot] }, st[slot])));
    });
    playersCache.set(res, out);
    return out;
  }
  function compAwards(res) {
    const ps = compPlayers(res);
    const best = (arr, k, tb) => arr.reduce((b, p) => (!b || p[k] > b[k] || (p[k] === b[k] && tb(p) > tb(b)) ? p : b), null);
    const line = (L, n) => ps.filter((p) => POS[p.pos].line === L).sort((a, b) => b.rtg - a.rtg || (b.g + b.a) - (a.g + a.a)).slice(0, n);
    return {
      boot: best(ps, 'g', (p) => p.a),
      assists: best(ps, 'a', (p) => p.g),
      glove: best(ps.filter((p) => p.pos === 'GK'), 'cs', (p) => p.rtg),
      pots: best(ps, 'rtg', (p) => p.g + p.a),
      tots: [...line('GK', 1), ...line('DEF', 4), ...line('MID', 3), ...line('FWD', 3)],
      scorers: ps.slice().sort((a, b) => b.g - a.g || b.a - a.a).slice(0, 10),
      assisters: ps.slice().sort((a, b) => b.a - a.a || b.g - a.g).slice(0, 5),
    };
  }

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
    const award = (icon, lbl, r, v) => (r && r[v] > 0 ? `<div class="award">${imgTag(C.xi[r.i], 'pixel')}<div><small>${lbl}</small><b>${esc(slotName(r.i))}</b></div><em>${r[v]}</em></div>` : '');
    const gk = rows.find((r) => r.pos === 'GK');
    rows.sort((a, b) => b.rtg - a.rtg || (b.g + b.a) - (a.g + a.a) || a.i - b.i);
    return `<div class="awards">
        ${award('', 'Golden Boot', top('g'), 'g')}${award('', 'Top Assists', top('a'), 'a')}
        ${award('', label, top('rtg'), 'rtg')}${award('', 'Golden Glove', gk, 'cs')}
      </div>
      <div class="table-wrap"><table class="league squad">
      <tr><th class="team">Player</th><th title="Performance rating">RTG</th><th>G</th><th>A</th><th>G+A</th><th title="Clean sheets">CS</th><th title="Man of the match">MOTM</th></tr>
      ${rows.map((r) => `<tr><td class="team"><span class="ppos" style="color:${posColor(r.pos)}">${r.pos}</span>${esc(slotName(r.i))}</td><td><b style="color:${perfColor(r.rtg)}">${r.rtg}</b></td><td>${r.g}</td><td>${r.a}</td><td><b>${r.g + r.a}</b></td><td>${POS[r.pos].line === 'GK' || POS[r.pos].line === 'DEF' ? r.cs : '–'}</td><td>${r.motm}</td></tr>`).join('')}
      </table></div>`;
  }
  function matchesBody(games, labelFn, xi = C.xi, src = null, ci = 0) {
    const res = src === 'national' ? C.national : src ? C.result : null;
    const canWatch = res && res.clubs;
    return `<div class="matches${canWatch ? ' watchable' : ''}">${games.map((g) => `<div class="m">
      <span class="muted">${labelFn(g)}</span><span class="muted">${g.home ? 'vs' : '@'}</span><span class="opp">${esc(g.opp)}</span><span class="${cellRes(g)}">${cellRes(g)} ${scoreText(g)}</span>${canWatch ? watchBtn(src, matchIndex(res, g, ci)) : ''}
      ${g.goals && g.goals.length ? `<span class="scorers">${scorerText(g, true, xi)}</span>` : ''}</div>`).join('')}</div>`;
  }
  const pkName = (id) => esc(BY_ID.get(id).name);
  const clubAttr = (res, ci) => (res.clubs ? ` data-club="${ci}" data-src="${res.national ? 'national' : 'league'}"` : '');

  // League-wide awards, Team of the Season and scoring charts.
  function awardsBody(res) {
    if (!res.clubs) return '<p class="muted small-text">League-wide awards are tracked for seasons played from now on.</p>';
    const A = compAwards(res);
    const card = (icon, lbl, p, v) => (p && p[v] > 0 ? `<button class="award${p.me ? ' mine' : ''}"${clubAttr(res, p.ci)}>${imgTag(p.id, 'pixel')}<div><small>${lbl}</small><b>${pkName(p.id)}</b><i>${esc(p.club)}</i></div><em>${p[v]}</em></button>` : '');
    const row = (p, cells) => `<tr class="clickable${p.me ? ' me' : ''}"${clubAttr(res, p.ci)}>${cells}</tr>`;
    return `<div class="awards">
        ${card('', 'Golden Boot', A.boot, 'g')}${card('', 'Top Assists', A.assists, 'a')}
        ${card('', res.national ? 'Player of the Tournament' : 'Player of the Season', A.pots, 'rtg')}${card('', 'Golden Glove', A.glove, 'cs')}
      </div>
      <div class="group-title">${res.national ? 'Team of the Tournament' : 'Team of the Season'}</div>
      <div class="table-wrap"><table class="league squad">
        ${A.tots.map((p) => row(p, `<td class="team"><span class="ppos" style="color:${posColor(p.pos)}">${p.pos}</span>${pkName(p.id)}</td><td class="team muted club-cell">${esc(p.club)}</td><td><b style="color:${perfColor(p.rtg)}">${p.rtg}</b></td>`)).join('')}
      </table></div>
      <div class="group-title">Top scorers</div>
      <div class="table-wrap"><table class="league squad">
        <tr><th>#</th><th class="team">Player</th><th class="team">Club</th><th>G</th><th>A</th></tr>
        ${A.scorers.map((p, i) => row(p, `<td>${i + 1}</td><td class="team">${pkName(p.id)}</td><td class="team muted club-cell">${esc(p.club)}</td><td><b>${p.g}</b></td><td>${p.a}</td>`)).join('')}
      </table></div>
      <div class="group-title">Top assists</div>
      <div class="table-wrap"><table class="league squad">
        ${A.assisters.map((p, i) => row(p, `<td>${i + 1}</td><td class="team">${pkName(p.id)}</td><td class="team muted club-cell">${esc(p.club)}</td><td><b>${p.a}</b></td><td>${p.g}G</td>`)).join('')}
      </table></div>`;
  }
  const tabsHTML = (tabs) => `<div class="result-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === resultTab ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const formStrip = (games) => `<div class="form-strip">${games.map((g) => `<i class="${cellRes(g)}" title="${esc(g.stage || 'MD' + g.md)} ${g.home ? 'vs' : '@'} ${esc(g.opp)} ${scoreText(g)}">${cellRes(g)}</i>`).join('')}</div>`;

  function renderResult() {
    const R = C.mode === 'regions';
    const showNat = R && C.national && resultComp === 'national';
    const compSwitch = R && C.national
      ? `<div class="seg comp-switch"><button data-comp="league" class="${showNat ? '' : 'on'}">${REGION[C.home]} League</button><button data-comp="national" class="${showNat ? 'on' : ''}">Victory Road</button></div>`
      : '';
    const vs = C.vs && C.result ? vsCard(C.vs, mySide(), true) + '<button class="btn btn-gold wide" data-act="reply">Send your result back</button>' : '';
    $('#ch-result-box').innerHTML = vs + compSwitch + (showNat ? nationalHTML() : leagueHTML());
  }

  function leagueHTML() {
    const R = C.mode === 'regions';
    const { me, table, games } = C.result;
    let verdict;
    if (me.w === 38) verdict = 'A perfect 38–0';
    else if (me.l === 0) verdict = 'The Invincibles';
    else if (me.position === 1) verdict = 'League Champions';
    else if (me.position === 2) verdict = 'Runners-up';
    else if (me.position <= 4) verdict = 'Top-four finish';
    else if (me.position <= 17) verdict = 'Mid-table season';
    else verdict = '⬇️ Relegated…';
    let extra = '';
    if (R) {
      extra = me.position > 4 ? '<div class="sub">Missed out on Victory Road (top 4 qualify).</div>'
        : C.national ? `<div class="sub qual">Victory Road: <b>${NAT_LABEL[C.national.finish]}</b></div>`
          : '<div class="sub qual">Qualified for Victory Road</div>';
    }
    if (!['squad', 'team', 'table', 'awards', 'matches'].includes(resultTab)) resultTab = 'squad';
    let body;
    if (resultTab === 'table') {
      body = `<div class="table-wrap"><table class="league">
        <tr><th>#</th><th class="team">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
        ${table.map((t, i) => `<tr class="${t.me ? 'me' : ''}${i === 3 || i === 16 ? ' cut' : ''}${C.result.clubs ? ' clickable' : ''}"${clubAttr(C.result, t.ci)}><td>${i + 1}</td><td class="team">${esc(t.name)}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}</td><td>${t.ga}</td><td>${sgn(t.gf - t.ga)}</td><td><b>${t.pts}</b></td></tr>`).join('')}
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
    } else if (resultTab === 'awards') {
      body = awardsBody(C.result);
    } else if (resultTab === 'matches') {
      body = matchesBody(games, (g) => g.md, C.xi, 'league');
    } else if (!hasGoalData(C.result)) {
      body = '<p class="muted small-text">Player stats are tracked for seasons played from now on.</p>';
    } else {
      body = squadBody(games, 'Player of the Season');
    }
    return `
      <div class="label">${R ? `${REGION[C.home]} League` : 'Season complete'}</div>
      <div class="record">${me.w}–${me.d}–${me.l}</div>
      <div class="sub">W–D–L · ${me.pts} pts · ${ord(me.position)} place</div>
      <div class="sub">GF ${me.gf} · GA ${me.ga} · GD ${sgn(me.gf - me.ga)}</div>
      <div class="verdict">${verdict}</div>${extra}
      ${formStrip(games)}
      ${tabsHTML([['squad', 'Squad'], ['team', 'Team'], ['table', 'Table'], ['awards', 'Awards'], ['matches', 'Games']])}
      <div class="tab-body">${body}</div>`;
  }

  function nationalHTML() {
    const N = C.national, games = N.games;
    const rec = games.reduce((r, g) => { r[g.res]++; r.gf += g.gf; r.ga += g.ga; return r; }, { W: 0, D: 0, L: 0, gf: 0, ga: 0 });
    const verdict = {
      Champion: 'Victory Road Champions', 'Runner-up': 'Beaten in the Final', 'Semi-final': 'Knocked out in the Final Four',
      'Quarter-final': 'Knocked out in the Quarter-finals', 'Group stage': "Didn't make the Final Four",
    }[N.finish];
    if (!['squad', 'groups', 'bracket', 'awards', 'matches'].includes(resultTab)) resultTab = 'squad';
    const reg = (g) => (g ? `<span class="reg">${REGION[g].slice(0, 3)}</span>` : '');
    let body;
    if (resultTab === 'groups') {
      // Older saves had quarter-finals (top 2 advanced); now only group winners reach the Final Four.
      const advance = (N.clubs ? N.matches.some((m) => m.stage === 'Quarter-final') : N.ko.some((k) => k.stage === 'Quarter-final')) ? 2 : 1;
      body = N.groups.map((t, gi) => `<div class="group"><div class="group-title">Group ${'ABCD'[gi]}</div><table class="league">
        <tr><th>#</th><th class="team">Club</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        ${t.map((r, i) => `<tr class="${r.me ? 'me' : ''}${i === advance - 1 ? ' cut' : ''}${N.clubs ? ' clickable' : ''}"${clubAttr(N, r.ci)}><td>${i + 1}</td><td class="team">${reg(r.region)}${esc(r.name)}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${sgn(r.gf - r.ga)}</td><td><b>${r.pts}</b></td></tr>`).join('')}
      </table></div>`).join('');
    } else if (resultTab === 'bracket') {
      // Older saves stored a flat knockout list; newer ones keep every match with club indices.
      const kos = N.clubs ? N.matches.filter((m) => m.winner != null).map((m) => ({
        stage: m.stage, h: m.h, a: m.a, home: N.clubs[m.h].name, away: N.clubs[m.a].name, hMe: m.h === 0, aMe: m.a === 0,
        hReg: N.clubs[m.h].region, aReg: N.clubs[m.a].region, gh: m.gh, ga: m.ga, et: m.et, pens: m.pens, winner: N.clubs[m.winner].name,
      })) : N.ko;
      body = ['Quarter-final', 'Semi-final', 'Final'].filter((st) => kos.some((k) => k.stage === st)).map((st) => `<div class="group-title">${st === 'Final' ? 'Final' : st + 's'}</div>
        ${kos.filter((k) => k.stage === st).map((k) => {
          const side = (name, regn, isMe, ci) => `<span class="${k.winner === name ? 'win' : ''}${isMe ? ' meteam' : ''}${ci != null ? ' clickable' : ''}"${ci != null ? clubAttr(N, ci) : ''}>${reg(regn)}${esc(name)}</span>`;
          return `<div class="tie">${side(k.home, k.hReg, k.hMe, k.h)}<b>${k.gh}–${k.ga}</b>${side(k.away, k.aReg, k.aMe, k.a)}${k.pens ? `<small>pens ${k.pens[0]}–${k.pens[1]}</small>` : k.et ? '<small>aet</small>' : ''}</div>`;
        }).join('')}`).join('');
    } else if (resultTab === 'awards') {
      body = awardsBody(N);
    } else if (resultTab === 'matches') {
      body = matchesBody(games, (g) => g.short, C.xi, 'national');
    } else {
      body = squadBody(games, 'Player of the Tournament');
    }
    return `
      <div class="label">Victory Road</div>
      <div class="record">${rec.W}–${rec.D}–${rec.L}</div>
      <div class="sub">W–D–L · GF ${rec.gf} · GA ${rec.ga} · GD ${sgn(rec.gf - rec.ga)}</div>
      <div class="verdict">${verdict}</div>
      ${formStrip(games)}
      ${tabsHTML([['squad', 'Squad'], ['groups', 'Groups'], ['bracket', 'Final 4'], ['awards', 'Awards'], ['matches', 'Games']])}
      <div class="tab-body">${body}</div>`;
  }

  $('#ch-result-box').addEventListener('click', (e) => {
    if (e.target.closest('[data-act="reply"]')) { sendReply(); return; }
    const k = e.target.closest('[data-club]');
    if (k) { openClub(k.dataset.src, +k.dataset.club); return; }
    const t = e.target.closest('[data-tab]');
    const c = e.target.closest('[data-comp]');
    if (t) resultTab = t.dataset.tab;
    else if (c) resultComp = c.dataset.comp;
    else return;
    renderResult();
  });

  // ---------------- Club pages ----------------
  function openClub(src, ci) {
    const res = src === 'national' ? C.national : C.result;
    if (!res || !res.clubs || !res.clubs[ci]) return;
    const club = res.clubs[ci], games = teamGames(res, ci);
    const st = seasonPlayerStats(games, club.f), pr = perfRatings(games, club.f);
    const rec = games.reduce((r, g) => { r[g.res]++; r.gf += g.gf; r.ga += g.ga; r.cs += g.ga === 0 ? 1 : 0; return r; }, { W: 0, D: 0, L: 0, gf: 0, ga: 0, cs: 0 });
    let standing;
    if (res.national) {
      const gi = res.groups.findIndex((t) => t.some((r) => r.ci === ci));
      const gpos = res.groups[gi].findIndex((r) => r.ci === ci) + 1;
      const last = res.matches.filter((m) => m.winner != null && (m.h === ci || m.a === ci)).pop();
      const stage = res.champion === ci ? 'Champions' : last ? (last.stage === 'Final' ? 'Runners-up' : last.stage === 'Semi-final' ? 'Final Four' : `Out in the ${last.stage}s`) : 'Out on Victory Road';
      standing = `Group ${'ABCD'[gi]} · ${ord(gpos)} · ${stage}`;
    } else {
      const row = res.table.find((t) => t.ci === ci);
      standing = `${ord(res.table.indexOf(row) + 1)} place · ${row.pts} pts`;
    }
    $('#club-title').innerHTML = `${club.region ? `<span class="reg">${REGION[club.region].slice(0, 3)}</span>` : ''}${esc(club.name)}`;
    $('#club-body').innerHTML = `
      <div class="club-meta"><span>${standing}</span><span>${club.f}</span><span>${rec.W}–${rec.D}–${rec.L}</span><span>GF ${rec.gf} · GA ${rec.ga} · GD ${sgn(rec.gf - rec.ga)}</span><span>${rec.cs} clean sheet${rec.cs === 1 ? '' : 's'}</span></div>
      ${formStrip(games)}
      <div class="group-title">Squad</div>
      <div class="club-squad">${club.xi.map((id, i) => {
        const pos = FORMATIONS[club.f][i][0], p = BY_ID.get(id);
        return `<div class="cs-row" title="${statLine(p)}"><span class="ppos" style="color:${posColor(pos)}">${pos}</span>${imgTag(id, S.sprite, 'cs-img')}
          <span class="cs-name">${esc(p.name)}</span><span class="cs-ga">${st[i].g}G ${st[i].a}A${POS[pos].line === 'GK' || POS[pos].line === 'DEF' ? ` · ${st[i].cs}CS` : ''}</span>
          <b style="color:${perfColor(pr[i])}">${pr[i]}</b></div>`;
      }).join('')}</div>
      <div class="group-title">Results</div>
      ${matchesBody(games, (g) => (res.national ? g.short : g.md), club.xi, src, ci)}`;
    $('#club-modal').hidden = false;
  }
  const closeClub = () => { $('#club-modal').hidden = true; };
  $('#club-close').addEventListener('click', closeClub);
  $('#club-modal').addEventListener('click', (e) => { if (e.target.id === 'club-modal') closeClub(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#club-modal').hidden) closeClub(); });

  // ---------------- Season history ----------------
  let HIST = store.get('pxi.history', []);
  if (!Array.isArray(HIST)) HIST = [];
  const saveHist = () => store.set('pxi.history', HIST);

  // Save (or update) the current run's season: record, squad numbers and awards.
  function recordSeason() {
    const res = C.result;
    if (!res || !res.clubs) return;
    if (!C.runId) C.runId = Date.now();
    const N = C.national;
    const all = res.games.concat(N ? N.games : []);
    const st = seasonPlayerStats(all), pr = perfRatings(all);
    const ts = teamSeasonStats(res.games);
    const pick = (p, v) => (p && p[v] > 0 ? { id: p.id, club: p.club, me: p.me, v: p[v] } : null);
    const awd = (r) => { const A = compAwards(r); return { boot: pick(A.boot, 'g'), assists: pick(A.assists, 'a'), glove: pick(A.glove, 'cs'), pots: pick(A.pots, 'rtg') }; };
    const me = res.me;
    const natRec = N ? N.games.reduce((r, g) => { r[g.res.toLowerCase()]++; r.gf += g.gf; r.ga += g.ga; return r; }, { w: 0, d: 0, l: 0, gf: 0, ga: 0 }) : null;
    const entry = {
      id: C.runId, date: Date.now(), mode: C.mode, home: C.mode === 'regions' ? C.home : null, f: C.f,
      league: { w: me.w, d: me.d, l: me.l, gf: me.gf, ga: me.ga, pts: me.pts, pos: me.position, unbeaten: ts.unbeatenRun, winRun: ts.winRun, champion: res.table[0].name },
      nat: N ? Object.assign({ finish: N.finish, champion: N.clubs[N.champion].name }, natRec) : null,
      squad: FORMATIONS[C.f].map(([pos], i) => Object.assign({ id: C.xi[i], pos, rtg: pr[i] }, st[i])),
      awards: awd(res), natAwards: N ? awd(N) : null,
      daily: C.daily || null,
      vs: C.vs ? { n: C.vs.a.n, res: compareRes(runSummary(), C.vs.a.r) } : null,
    };
    HIST = HIST.filter((e) => e.id !== entry.id);
    HIST.unshift(entry);
    if (HIST.length > 300) HIST.length = 300;
    saveHist();
  }

  const modeLabel = (e) => (e.mode === 'regions' ? `${REGION[e.home]} League` : e.daily ? `Daily #${e.daily}` : '38–0 Challenge');
  const dateLabel = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  // Career totals for every Pokémon that has played for you.
  function careers() {
    const m = new Map();
    for (const e of HIST) {
      for (const p of e.squad) {
        if (!p.id) continue;
        const c = m.get(p.id) || { id: p.id, seasons: 0, g: 0, a: 0, cs: 0, motm: 0, rtgSum: 0, lines: {}, awards: 0 };
        c.seasons++; c.g += p.g; c.a += p.a; c.cs += p.cs; c.motm += p.motm; c.rtgSum += p.rtg;
        const L = POS[p.pos] ? POS[p.pos].line : 'MID';
        c.lines[L] = (c.lines[L] || 0) + 1;
        m.set(p.id, c);
      }
      for (const set of [e.awards, e.natAwards]) {
        if (!set) continue;
        for (const k in set) if (set[k] && set[k].me && m.has(set[k].id)) m.get(set[k].id).awards++;
      }
    }
    for (const c of m.values()) {
      c.avg = Math.round(c.rtgSum / c.seasons);
      c.line = Object.entries(c.lines).sort((a, b) => b[1] - a[1])[0][0];
    }
    return [...m.values()];
  }

  // All-Time XI (4-3-3): best average rating per line, from your history.
  function allTimeXI() {
    const cs = careers();
    const byLine = (L, n) => cs.filter((c) => c.line === L).sort((a, b) => b.avg - a.avg || b.seasons - a.seasons).slice(0, n);
    const picks = [...pad(byLine('GK', 1), 1), ...pad(byLine('DEF', 4), 4), ...pad(byLine('MID', 3), 3), ...pad(byLine('FWD', 3), 3)];
    return { xi: picks.map((c) => (c ? c.id : null)), stats: picks.map((c) => c && { g: c.g, a: c.a }), rtg: picks.map((c) => (c ? c.avg : null)) };
  }
  function pad(arr, n) { while (arr.length < n) arr.push(null); return arr; }

  let careerSort = 'g';
  function renderRecords() {
    const body = $('#hist-body');
    if (!HIST.length) {
      body.innerHTML = '<div class="card-box"><div class="box-title">No seasons yet</div><p class="muted small-text">Finish a 38–0 Challenge or Region League season and it will show up here with its awards, records and your players\' career stats.</p></div>';
      return;
    }
    const n = (f) => HIST.filter(f).length;
    const tile = (k, v) => `<div class="stat"><div class="stat-k">${k}</div><div class="stat-v">${v}</div></div>`;
    const myAward = (k) => HIST.reduce((t, e) => t + [e.awards, e.natAwards].filter((s) => s && s[k] && s[k].me).length, 0);
    const cabinet = `<div class="cabinet">
      ${tile('Seasons', HIST.length)}${tile('League titles', n((e) => e.league.pos === 1))}${tile('Victory Road titles', n((e) => e.nat && e.nat.finish === 'Champion'))}
      ${tile('Invincibles', n((e) => e.league.l === 0))}${tile('Perfect 38–0', n((e) => e.league.w === 38))}${tile('Golden Boots', myAward('boot'))}
    </div>`;

    const maxBy = (arr, f) => arr.reduce((b, x) => (b == null || f(x) > f(b) ? x : b), null);
    const where = (e) => `${modeLabel(e)} · ${dateLabel(e.date)}`;
    const recRow = (k, v, e) => `<div class="kv wide"><span>${k}</span><b>${v} <small>${where(e)}</small></b></div>`;
    const players = HIST.flatMap((e) => e.squad.filter((p) => p.id).map((p) => ({ e, p })));
    const best = {
      pts: maxBy(HIST, (e) => e.league.pts), gf: maxBy(HIST, (e) => e.league.gf), ga: maxBy(HIST, (e) => -e.league.ga),
      gd: maxBy(HIST, (e) => e.league.gf - e.league.ga), unb: maxBy(HIST, (e) => e.league.unbeaten),
      g: maxBy(players, (x) => x.p.g), a: maxBy(players, (x) => x.p.a), r: maxBy(players, (x) => x.p.rtg),
    };
    const records = `
      ${recRow('Most points', best.pts.league.pts, best.pts)}
      ${recRow('Most goals scored', best.gf.league.gf, best.gf)}
      ${recRow('Fewest conceded', best.ga.league.ga, best.ga)}
      ${recRow('Best goal difference', sgn(best.gd.league.gf - best.gd.league.ga), best.gd)}
      ${recRow('Longest unbeaten run', best.unb.league.unbeaten + ' games', best.unb)}
      ${recRow('Most goals by a player', `${pkName(best.g.p.id)} · ${best.g.p.g}`, best.g.e)}
      ${recRow('Most assists by a player', `${pkName(best.a.p.id)} · ${best.a.p.a}`, best.a.e)}
      ${recRow('Highest player rating', `${pkName(best.r.p.id)} · ${best.r.p.rtg}`, best.r.e)}`;

    const cs = careers();
    const sorters = { g: (c) => c.g * 1000 + c.a, a: (c) => c.a * 1000 + c.g, avg: (c) => c.avg * 100 + c.seasons, seasons: (c) => c.seasons * 1000 + c.g };
    cs.sort((x, y) => sorters[careerSort](y) - sorters[careerSort](x));
    const careerTable = `<div class="seg small" id="career-seg">${[['g', 'Goals'], ['a', 'Assists'], ['avg', 'Rating'], ['seasons', 'Seasons']].map(([k, l]) => `<button data-sort="${k}" class="${k === careerSort ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="table-wrap"><table class="league squad">
        <tr><th>#</th><th class="team">Pokémon</th><th title="Seasons">S</th><th>G</th><th>A</th><th title="Average rating">RTG</th><th title="Awards won">AWD</th></tr>
        ${cs.slice(0, 15).map((c, i) => `<tr><td>${i + 1}</td><td class="team"><span class="ppos" style="color:${LINES[c.line].color}">${c.line}</span>${pkName(c.id)}</td><td>${c.seasons}</td><td>${c.g}</td><td>${c.a}</td><td><b style="color:${perfColor(c.avg)}">${c.avg}</b></td><td>${c.awards || ''}</td></tr>`).join('')}
      </table></div>`;

    const awardLine = (icon, lbl, a, suffix) => (a ? `<div class="kv wide${a.me ? ' mine' : ''}"><span>${lbl}</span><b>${pkName(a.id)} <small>${esc(a.club)} · ${a.v}${suffix}</small></b></div>` : '');
    const seasons = HIST.map((e) => {
      const L = e.league;
      const natTxt = (e.nat ? ` · VR: ${NAT_LABEL[e.nat.finish]}` : '')
        + (e.vs ? ` · ${e.vs.res > 0 ? 'beat' : e.vs.res < 0 ? 'lost to' : 'tied'} ${esc(e.vs.n)}` : '');
      const trophy = L.pos === 1 ? 'Champions · ' : '';
      return `<details class="season"><summary><span class="s-main">${trophy}${modeLabel(e)} <span class="muted">· ${e.f}</span></span>
          <span class="s-rec">${L.w}–${L.d}–${L.l} · ${ord(L.pos)}${natTxt}</span><span class="s-date muted">${dateLabel(e.date)}</span></summary>
        <div class="season-body">
          <div class="kv-grid">
            <div class="kv"><span>Points</span><b>${L.pts}</b></div><div class="kv"><span>GF / GA</span><b>${L.gf} / ${L.ga}</b></div>
            <div class="kv"><span>Champions</span><b>${esc(L.champion)}</b></div><div class="kv"><span>Unbeaten run</span><b>${L.unbeaten}</b></div>
            ${e.nat ? `<div class="kv"><span>Victory Road</span><b>${e.nat.w}–${e.nat.d}–${e.nat.l}</b></div><div class="kv"><span>VR winners</span><b>${esc(e.nat.champion)}</b></div>` : ''}
          </div>
          <div class="group-title">League awards</div>
          ${awardLine('', 'Golden Boot', e.awards.boot, 'G')}${awardLine('', 'Top Assists', e.awards.assists, 'A')}
          ${awardLine('', 'Player of the Season', e.awards.pots, ' RTG')}${awardLine('', 'Golden Glove', e.awards.glove, ' CS')}
          ${e.natAwards ? `<div class="group-title">Victory Road awards</div>
            ${awardLine('', 'Golden Boot', e.natAwards.boot, 'G')}${awardLine('', 'Player of the Tournament', e.natAwards.pots, ' RTG')}` : ''}
          <div class="group-title">Your squad</div>
          <div class="table-wrap"><table class="league squad">
            <tr><th class="team">Player</th><th>RTG</th><th>G</th><th>A</th><th>CS</th></tr>
            ${e.squad.slice().sort((a, b) => b.rtg - a.rtg).map((p) => `<tr><td class="team"><span class="ppos" style="color:${posColor(p.pos)}">${p.pos}</span>${p.id ? pkName(p.id) : '?'}</td><td><b style="color:${perfColor(p.rtg)}">${p.rtg}</b></td><td>${p.g}</td><td>${p.a}</td><td>${p.cs}</td></tr>`).join('')}
          </table></div>
        </div></details>`;
    }).join('');

    body.innerHTML = `${cabinet}
      <div class="label-row"><span class="label">All-time records</span></div><div class="records">${records}</div>
      <div class="label-row"><span class="label">Pokémon careers</span></div>${careerTable}
      <div class="label-row"><span class="label">Seasons</span></div><div class="seasons">${seasons}</div>`;
  }
  $('#hist-body').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sort]');
    if (!b) return;
    careerSort = b.dataset.sort; renderRecords();
  });
  $('#hist-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'pokemon-starting-xi', version: 1, history: HIST, stats: ST, regionStats: SR }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pokemon-starting-xi-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('History exported');
  });
  $('#hist-import').addEventListener('click', () => $('#hist-file').click());
  $('#hist-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : data.history;
      const valid = (x) => x && typeof x.id === 'number' && x.league && Array.isArray(x.squad);
      if (!Array.isArray(list) || !list.every(valid)) throw new Error('bad file');
      const byId = new Map(HIST.map((x) => [x.id, x]));
      list.forEach((x) => byId.set(x.id, x));
      HIST = [...byId.values()].sort((a, b) => b.date - a.date).slice(0, 300);
      saveHist(); render();
      toast(`Imported ${list.length} season${list.length === 1 ? '' : 's'}`);
    } catch {
      toast("That file doesn't look like a Starting XI history export");
    }
  });
  $('#hist-clear').addEventListener('click', () => {
    if (!HIST.length || !confirm(`Delete all ${HIST.length} saved seasons? This can't be undone (export first if you want a backup).`)) return;
    HIST = []; saveHist(); render();
  });

  // ---------------- Share ----------------
  function shareText() {
    if (C.daily) return dailyShareText();
    const me = C.result.me, R = C.mode === 'regions';
    let s = `⚽ My Pokémon Starting XI went ${me.w}–${me.d}–${me.l} (${me.pts} pts, ${ord(me.position)}) in ${R ? `the ${REGION[C.home]} League` : 'the 38–0 Challenge'}`;
    if (C.national) s += C.national.finish === 'Champion' ? ' and conquered Victory Road 🏆' : `, then reached Victory Road (${NAT_LABEL[C.national.finish]})`;
    s += '!';
    const all = C.result.games.concat(C.national ? C.national.games : []);
    if (hasGoalData(C.result)) {
      const st = seasonPlayerStats(all);
      const top = st.reduce((b, x, i) => (x.g > st[b].g ? i : b), 0);
      if (st[top].g) s += ` Top scorer: ${slotName(top)} (${st[top].g}).`;
    }
    return s + ' Can you beat it?';
  }
  async function shareResult() {
    const url = location.origin + location.pathname;
    const text = shareText();
    let blob = null;
    const champ = C.national && C.national.finish === 'Champion';
    try { blob = await new Promise((r) => (champ ? hallOfFameCanvas() : buildImage()).then((c) => c.toBlob(r, 'image/png'))); } catch { /* image is optional */ }
    const file = blob ? new File([blob], 'pokemon-starting-xi.png', { type: 'image/png' }) : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Pokémon Starting XI', text: `${text} ${url}` });
        return;
      }
      if (navigator.share) { await navigator.share({ title: 'Pokémon Starting XI', text, url }); return; }
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user closed the share sheet
    }
    // No share sheet: copy the text and save the image instead.
    let copied = false;
    try { await navigator.clipboard.writeText(`${text} ${url}`); copied = true; } catch { /* ignore */ }
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'pokemon-starting-xi.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    toast(copied ? 'Result copied — image saved too' : 'Image saved');
  }
  $('#ch-share').addEventListener('click', shareResult);

  // ---------------- Hall of Fame (Victory Road champions) ----------------
  // A 16×15 pixel trophy, drawn with nearest-neighbour scaling.
  const TROPHY = [
    '..kkkkkkkkkkkk..', 'kkkllyyyyyyyddkk', 'kyklyyyyyyyyydyk', 'kykllyyyyyyyddyk', 'kkklyyyyyyyyydkk',
    '..klyyyyyyyyydk.', '...klyyyyyyydk..', '....kklyyyddkk..', '......kyydk.....', '......kyydk.....',
    '.....kkyydkk....', '....kyyyyyydk...', '...kbbbbbbbbbk..', '...kbbbbbbbbbk..', '...kkkkkkkkkkk..',
  ];
  const TROPHY_COLORS = { k: '#3a2410', y: '#f5c84c', l: '#fff3b0', d: '#c8901e', b: '#7a4a24' };
  function drawTrophy(ctx, cx, bottom, px) {
    const w = TROPHY[0].length * px, top = bottom - TROPHY.length * px;
    TROPHY.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = TROPHY_COLORS[ch];
      ctx.fillRect(Math.round(cx - w / 2 + c * px), Math.round(top + r * px), px, px);
    }));
  }

  async function hallOfFameCanvas() {
    const W = 1200, H = 900, top = 130, bot = 770;
    try { await document.fonts.load('700 48px "Pixelify Sans"'); } catch { /* falls back to monospace */ }
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const font = (px) => `700 ${px}px "Pixelify Sans", ui-monospace, monospace`;
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);

    // Stage: hot radial glow with light rays, a bright horizon band and confetti.
    const sx = 30, sw = W - 60, sh = bot - top, cx = W / 2, cy = top + sh * 0.45;
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, top, sw, sh); ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, sw * 0.7);
    g.addColorStop(0, '#ffe08a'); g.addColorStop(0.25, '#ff9a3c'); g.addColorStop(0.6, '#ee4a24'); g.addColorStop(1, '#a8161a');
    ctx.fillStyle = g; ctx.fillRect(sx, top, sw, sh);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.1;
      ctx.fillStyle = i % 2 ? 'rgba(255,236,170,.20)' : 'rgba(255,200,120,.10)';
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.07) * 1400, cy + Math.sin(a - 0.07) * 1400);
      ctx.lineTo(cx + Math.cos(a + 0.07) * 1400, cy + Math.sin(a + 0.07) * 1400);
      ctx.closePath(); ctx.fill();
    }
    const band = ctx.createLinearGradient(0, cy + 60, 0, cy + 200);
    band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,235,235,.55)'); band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band; ctx.fillRect(sx, cy + 60, sw, 140);
    const cols = ['#b48cff', '#fff4c2', '#ffd24a', '#ff8fd0', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      ctx.save();
      ctx.translate(sx + Math.random() * sw, top + Math.random() * sh);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = 0.55 + Math.random() * 0.45;
      const sz = 6 + Math.random() * 12;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }

    // The squad: best performers in front, flanking the trophy.
    const all = C.result.games.concat(C.national.games);
    const pr = hasGoalData(C.result) ? perfRatings(all) : C.xi.map(() => 0);
    const order = C.xi.map((id, i) => ({ id, r: pr[i] })).filter((x) => x.id).sort((a, b) => b.r - a.r);
    const front = order.slice(0, 4), back = order.slice(4);
    const imgs = new Map(await Promise.all(order.map(async ({ id }) => [id, (await loadImg(spriteUrl(id, 'pixel'))) || (await loadImg(spriteUrl(id, 'art')))])));
    ctx.imageSmoothingEnabled = false;
    const drawMon = (id, x, baseline, size) => {
      const im = imgs.get(id);
      if (!im) return;
      ctx.save(); ctx.shadowColor = 'rgba(60,0,0,.45)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 6;
      ctx.drawImage(im, x - size / 2, baseline - size * 0.9, size, size);
      ctx.restore();
    };
    back.forEach((m, i) => drawMon(m.id, sx + 90 + (i * (sw - 180)) / Math.max(1, back.length - 1), cy + 150, 230));
    const fx = [cx - 400, cx - 215, cx + 215, cx + 400];
    front.forEach((m, i) => drawMon(m.id, fx[i], bot - 20, 280));
    drawTrophy(ctx, cx, bot - 40, 13);
    ctx.restore();

    // Banner and footer, in a chunky pixel font.
    const text = (str, y, px) => {
      ctx.font = font(px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3a3a3a'; ctx.fillText(str, W / 2 + 4, y + 4);
      ctx.fillStyle = '#f4f4f4'; ctx.fillText(str, W / 2, y);
    };
    text('Victory Road Champion! Congratulations!', top / 2 + 4, 50);
    // Footer: region · date won · formation. The date comes from the saved season so it never changes on reopen.
    const saved = HIST.find((e) => e.id === C.runId);
    const won = new Date(saved ? saved.date : Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', '');
    text(`${REGION[C.home]}  ·  ${won}  ·  ${C.f}`.toUpperCase(), bot + (H - bot) / 2, 46);
    return c;
  }

  async function showHallOfFame() {
    const box = $('#hof');
    box.hidden = false;
    box.classList.remove('show');
    $('#hof-img').removeAttribute('src');
    const c = await hallOfFameCanvas();
    $('#hof-img').src = c.toDataURL('image/png');
    void box.offsetWidth;
    box.classList.add('show');
    confetti(260);
  }
  $('#ch-hof').addEventListener('click', showHallOfFame);
  $('#hof-close').addEventListener('click', () => { $('#hof').hidden = true; });
  $('#hof-share').addEventListener('click', shareResult);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#hof').hidden) $('#hof').hidden = true; });

  // ---------------- Daily Challenge ----------------
  const DAILY_EPOCH = Date.UTC(2026, 9, 11); // Daily #1
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function dailyInfo(d = new Date()) {
    const key = dayKey(d);
    const no = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - DAILY_EPOCH) / 864e5) + 1;
    const seed = `daily-${key}`;
    const f = FKEYS[Math.floor(rngFor(seed, 'formation')() * FKEYS.length)];
    return { key, no, seed, f };
  }
  let DAILY = store.get('pxi.daily', {});
  const saveDailyStore = () => {
    const keys = Object.keys(DAILY).sort();
    keys.slice(0, Math.max(0, keys.length - 60)).forEach((k) => delete DAILY[k]);
    store.set('pxi.daily', DAILY);
  };
  const resultLine = (r) => `${r.w}–${r.d}–${r.l} · ${r.pts} pts · ${ord(r.pos)}${r.vr ? ` · VR: ${NAT_LABEL[r.vr].replace('🏆 ', '')}` : ''}`;

  function dailyShareText() {
    const me = C.result.me, g = C.result.games;
    const rows = [];
    for (let i = 0; i < g.length; i += 10) rows.push(g.slice(i, i + 10).map((x) => ({ W: '🟩', D: '🟨', L: '🟥' })[x.res]).join(''));
    const st = hasGoalData(C.result) ? seasonPlayerStats(g) : null;
    const top = st ? st.reduce((b, x, i) => (x.g > st[b].g ? i : b), 0) : -1;
    return [
      `Pokémon Starting XI · Daily #${C.daily} (${C.f})`,
      `⚽ ${me.w}–${me.d}–${me.l} · ${me.pts} pts · ${ord(me.position)}${me.position === 1 ? ' 🏆' : ''}`,
      ...rows,
      top >= 0 && st[top].g ? `👟 ${slotName(top)} ${st[top].g}` : '',
    ].filter(Boolean).join('\n');
  }
  function saveDaily() {
    DAILY[C.dailyKey] = { no: C.daily, started: true, done: { line: resultLine(runSummary()), text: dailyShareText() } };
    saveDailyStore();
  }

  function renderDaily() {
    const box = $('#daily-box');
    box.hidden = C.mode !== 'classic' || C.phase !== 'setup';
    if (box.hidden) return;
    const d = dailyInfo(), entry = DAILY[d.key];
    const mins = Math.ceil((new Date(new Date().setHours(24, 0, 0, 0)) - new Date()) / 60000);
    $('#daily-title').textContent = `Daily Challenge #${d.no}`;
    $('#daily-next').textContent = `Next in ${Math.floor(mins / 60)}h ${mins % 60}m`;
    if (entry && entry.done) {
      $('#daily-desc').innerHTML = `Today's result: <b>${esc(entry.done.line)}</b>`;
    } else if (entry && entry.started) {
      $('#daily-desc').textContent = "You've used today's attempt. Come back tomorrow!";
    } else {
      $('#daily-desc').innerHTML = `Same rolls for everyone today. Formation: <b>${d.f}</b>. One attempt, so make it count.`;
    }
    $('#daily-play').hidden = !!entry;
    $('#daily-share').hidden = !(entry && entry.done);
  }
  $('#daily-play').addEventListener('click', () => {
    const d = dailyInfo();
    if (DAILY[d.key]) return;
    DAILY[d.key] = { no: d.no, started: true };
    saveDailyStore();
    beginRun({ seed: d.seed, f: d.f, pool: 'all', daily: d.no, dailyKey: d.key });
  });
  $('#daily-share').addEventListener('click', async () => {
    const entry = DAILY[dailyInfo().key];
    if (!entry || !entry.done) return;
    await shareOrCopy({ title: 'Pokémon Starting XI', text: `${entry.done.text}\n${location.origin + location.pathname}` });
  });

  // Native share sheet when available, clipboard otherwise.
  async function shareOrCopy(data) {
    try {
      if (navigator.share) { await navigator.share(data); return true; }
    } catch (err) {
      if (err && err.name === 'AbortError') return false;
    }
    try { await navigator.clipboard.writeText(data.url ? `${data.text} ${data.url}` : data.text); toast('Copied to clipboard'); return true; } catch {
      prompt('Copy this:', data.url ? `${data.text} ${data.url}` : data.text);
      return true;
    }
  }

  // ---------------- Friend challenges ----------------
  // A challenge link carries the seed, setup and the sender's squad + result. The friend drafts from the
  // same seeded rolls and plays the same seeded league; a reply link carries both sides back.
  const runSummary = () => {
    const m = C.result.me;
    return { w: m.w, d: m.d, l: m.l, pts: m.pts, pos: m.position, gf: m.gf, ga: m.ga, vr: C.national ? C.national.finish : null };
  };
  const myName = () => (S.name || '').trim() || 'A friend';
  const mySide = () => ({ n: myName(), x: C.xi.slice(), r: runSummary() });
  const challengeBase = () => ({ v: 1, m: C.mode, s: C.seed, f: C.f, h: C.home, p: C.pool, d: C.daily || null });

  const b64e = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (str) => JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/')))));
  const challengeUrl = (o) => `${location.origin}${location.pathname}#c=${b64e(o)}`;

  // Everything from a link is untrusted: rebuild it field by field.
  function cleanSide(x) {
    if (!x || !Array.isArray(x.x) || x.x.length !== 11 || !x.x.every((id) => BY_ID.has(+id))) return null;
    const r = x.r || {};
    const num = (v) => (Number.isFinite(+v) ? clamp(Math.round(+v), 0, 999) : 0);
    return {
      n: String(x.n || 'A friend').replace(/[\u0000-\u001f]/g, '').slice(0, 16) || 'A friend',
      x: x.x.map(Number),
      r: { w: num(r.w), d: num(r.d), l: num(r.l), pts: num(r.pts), pos: num(r.pos), gf: num(r.gf), ga: num(r.ga), vr: NAT_STAGES.includes(r.vr) ? r.vr : null },
    };
  }
  function parseChallenge(str) {
    try {
      const o = b64d(str);
      if (!o || o.v !== 1 || typeof o.s !== 'string' || o.s.length > 40 || !FORMATIONS[o.f]) return null;
      const a = cleanSide(o.a);
      if (!a) return null;
      return {
        v: 1, m: o.m === 'regions' ? 'regions' : 'classic', s: o.s, f: o.f, h: clamp(Math.round(+o.h) || 1, 1, 9),
        p: o.p === 'retro' ? 'retro' : 'all', d: Number.isFinite(+o.d) && +o.d > 0 ? Math.round(+o.d) : null,
        a, b: o.b ? cleanSide(o.b) : null,
      };
    } catch { return null; }
  }

  const VR_RANK = { 'Group stage': 1, 'Quarter-final': 2, 'Semi-final': 3, 'Runner-up': 4, Champion: 5 };
  function compareRes(a, b) {
    const k = (r) => [VR_RANK[r.vr] || 0, r.pts, r.gf - r.ga, r.gf];
    const x = k(a), y = k(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
    return 0;
  }

  // Two-leg derby between the challenger (A) and the responder (B). Seeded, so both see the same result.
  function headToHead(ch, xiA, xiB) {
    const A = { f: ch.f, xi: xiA }, B = { f: ch.f, xi: xiB };
    const sa = strengthOf(A), sb = strengthOf(B);
    const leg = (H, Aw, sh, saw, k) => withRng(rngFor(ch.s, 'h2h', k), () => {
      const m = playMatch(sh, saw);
      return { gh: m.gh, ga: m.ga, eh: goalEvents(m.gh, H.f, H.xi), ea: goalEvents(m.ga, Aw.f, Aw.xi) };
    });
    const l1 = leg(A, B, sa, sb, 1), l2 = leg(B, A, sb, sa, 2);
    const aggA = l1.gh + l2.ga, aggB = l1.ga + l2.gh;
    let pens = null, winner = aggA > aggB ? 'A' : aggB > aggA ? 'B' : null;
    if (!winner) {
      const r = rngFor(ch.s, 'h2h', 'pens');
      const pA = clamp(0.5 + ((sa.attack + sa.defense) - (sb.attack + sb.defense)) / 200, 0.35, 0.65);
      const win = 3 + Math.floor(r() * 3), lose = Math.max(0, win - 1 - Math.floor(r() * 2));
      winner = r() < pA ? 'A' : 'B';
      pens = winner === 'A' ? [win, lose] : [lose, win];
    }
    return { l1, l2, aggA, aggB, pens, winner };
  }

  // Side-by-side card. `meIsB` = the viewer is the responder (the friend who accepted).
  function vsCard(ch, other, meIsB) {
    const me = meIsB ? other : ch.a, them = meIsB ? ch.a : other;
    const h = headToHead(ch, ch.a.x, other.x);
    const cmp = compareRes(me.r, them.r);
    const nm = esc(them.n);
    const vrRow = ch.m === 'regions' ? `<tr><td>Victory Road</td><td>${me.r.vr ? NAT_LABEL[me.r.vr] : '—'}</td><td>${them.r.vr ? NAT_LABEL[them.r.vr] : '—'}</td></tr>` : '';
    const verdict = cmp > 0 ? 'You win the challenge' : cmp < 0 ? `${nm} wins the challenge` : 'Dead heat';
    const youA = !meIsB;
    const name = (isA) => (isA === youA ? 'You' : nm);
    const leg = (l, homeIsA) => `${name(homeIsA)} <b>${l.gh}–${l.ga}</b> ${name(!homeIsA)}`;
    const meAgg = youA ? h.aggA : h.aggB, themAgg = youA ? h.aggB : h.aggA;
    const derbyWin = (h.winner === 'A') === youA;
    const pensTxt = h.pens ? ` · pens ${youA ? h.pens[0] : h.pens[1]}–${youA ? h.pens[1] : h.pens[0]}` : '';
    const squad = (x) => FORMATIONS[ch.f].map(([pos], i) => `<span><i style="color:${posColor(pos)}">${pos}</i>${pkName(x[i])}</span>`).join('');
    return `<div class="vs-card">
      <div class="vs-head">Challenge vs ${nm}${ch.d ? ` <span class="muted">· Daily #${ch.d}</span>` : ''}</div>
      <table class="vs-table">
        <tr><th></th><th>You</th><th>${nm}</th></tr>
        <tr><td>Record</td><td>${me.r.w}–${me.r.d}–${me.r.l}</td><td>${them.r.w}–${them.r.d}–${them.r.l}</td></tr>
        <tr><td>Points</td><td><b>${me.r.pts}</b></td><td><b>${them.r.pts}</b></td></tr>
        <tr><td>Finish</td><td>${ord(me.r.pos)}</td><td>${ord(them.r.pos)}</td></tr>
        <tr><td>Goal diff</td><td>${sgn(me.r.gf - me.r.ga)}</td><td>${sgn(them.r.gf - them.r.ga)}</td></tr>
        ${vrRow}
      </table>
      <div class="vs-verdict ${cmp > 0 ? 'win' : cmp < 0 ? 'lose' : ''}">${verdict}</div>
      <div class="vs-h2h"><div class="group-title">Head-to-head derby</div>
        <div>Leg 1: ${leg(h.l1, true)}</div><div>Leg 2: ${leg(h.l2, false)}</div>
        <div class="vs-agg">Aggregate: You ${meAgg}–${themAgg} ${nm}${pensTxt} · ${derbyWin ? 'You win the derby' : `${nm} wins the derby`}</div>
      </div>
      <details class="vs-squads"><summary>Compare squads</summary>
        <div class="vs-cols"><div><div class="group-title">You</div>${squad(me.x)}</div><div><div class="group-title">${nm}</div>${squad(them.x)}</div></div>
      </details>
    </div>`;
  }

  function openVs(html) { $('#vs-body').innerHTML = html; $('#vs-modal').hidden = false; }
  const closeVs = () => { $('#vs-modal').hidden = true; };
  $('#vs-close').addEventListener('click', closeVs);
  $('#vs-modal').addEventListener('click', (e) => { if (e.target.id === 'vs-modal') closeVs(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#vs-modal').hidden) closeVs(); });

  // Sender: build a challenge from the finished run.
  $('#ch-challenge').addEventListener('click', () => {
    openVs(`<h2>Challenge a friend</h2>
      <p class="muted small-text">They'll draft from <b>your exact rolls</b> with the same formation${C.mode === 'regions' ? ' and home region' : ''}, then play <b>the same league</b>. Your squad stays hidden until they finish. Then you'll compare results and play a two-leg derby.</p>
      <label class="vs-label">Your name <input id="vs-name" maxlength="16" placeholder="e.g. Dylan" value="${esc(S.name || '')}" /></label>
      <div class="vs-actions"><button id="vs-send" class="btn btn-gold">Share challenge</button><button id="vs-copy" class="btn">Copy link</button></div>`);
    const link = () => {
      S.name = $('#vs-name').value.trim().slice(0, 16);
      store.set('pxi.settings', S);
      return challengeUrl(Object.assign(challengeBase(), { a: mySide() }));
    };
    const blurb = () => `⚔️ ${myName()} challenges you on Pokémon Starting XI: beat ${resultLine(runSummary())} with the same draft!`;
    $('#vs-send').addEventListener('click', async () => { const url = link(); if (await shareOrCopy({ title: 'Pokémon Starting XI challenge', text: blurb(), url })) closeVs(); });
    $('#vs-copy').addEventListener('click', async () => {
      const url = link();
      try { await navigator.clipboard.writeText(url); toast('Challenge link copied!'); closeVs(); } catch { prompt('Copy this link:', url); }
    });
  });

  // Responder: send both results back to the challenger.
  async function sendReply() {
    if (!S.name) {
      const n = prompt('Your name (shown to your friend):', '');
      if (n === null) return;
      S.name = n.trim().slice(0, 16); store.set('pxi.settings', S);
    }
    const url = challengeUrl(Object.assign(challengeBase(), { m: C.vs.m, s: C.vs.s, f: C.vs.f, h: C.vs.h, p: C.vs.p, d: C.vs.d, a: C.vs.a, b: mySide() }));
    const cmp = compareRes(runSummary(), C.vs.a.r);
    await shareOrCopy({ title: 'Challenge answered', text: `⚔️ I answered your challenge: ${resultLine(runSummary())} vs your ${resultLine(C.vs.a.r)}. ${cmp > 0 ? 'I win 😎' : cmp < 0 ? 'You win this time…' : 'Dead heat!'} See the derby:`, url });
  }

  // Opening a link: either an invite (accept to draft) or a reply (see the comparison).
  function handleChallengeLink() {
    const m = location.hash.match(/#c=([\w-]+)/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname);
    const ch = parseChallenge(m[1]);
    if (!ch) { toast("That challenge link looks broken"); return false; }
    if (ch.b) {
      openVs(vsCard(ch, ch.b, false) + '<p class="muted small-text">Your friend answered your challenge. Same rolls, same league: here\'s how it went.</p>');
      return true;
    }
    const where = ch.m === 'regions' ? `${REGION[ch.h]} Region League` : ch.d ? `Daily #${ch.d}` : `38–0 Challenge${ch.p === 'retro' ? ' (Gen 1–4)' : ''}`;
    openVs(`<h2>${esc(ch.a.n)} challenges you</h2>
      <div class="vs-invite"><div><span class="muted">Mode</span><b>${where}</b></div><div><span class="muted">Formation</span><b>${ch.f}</b></div>
      <div><span class="muted">Score to beat</span><b>${resultLine(ch.a.r)}</b></div></div>
      <p class="muted small-text">You'll draft from the <b>same rolls</b> and play the <b>same league</b>. Their squad is revealed when you finish, plus a two-leg derby between your XIs.</p>
      <div class="vs-actions"><button id="vs-accept" class="btn btn-gold">Accept challenge</button><button id="vs-later" class="btn">Not now</button></div>`);
    $('#vs-later').addEventListener('click', closeVs);
    $('#vs-accept').addEventListener('click', () => {
      const view = ch.m === 'regions' ? 'regions' : 'challenge';
      const run = RUNS[view];
      if ((run.phase === 'draft' || run.phase === 'ready') && !confirm('This replaces your current run in that mode. Continue?')) return;
      if (skipPlayback) skipPlayback();
      S.view = view; C = run;
      closeVs();
      beginRun({ seed: ch.s, f: ch.f, home: ch.h, pool: ch.p, vs: ch });
    });
    return true;
  }

  // ================================================================
  // Live match viewer — a choreographed replay of an already-simulated match.
  // The real goals happen at their real minutes with the real scorer/assister; everything between
  // (possession, passes, near-misses) is seeded filler, so a replay always looks the same and never
  // changes the result.
  // ================================================================
  const LV = { raf: 0, open: false };
  const MS_PER_MIN = 650;   // real ms per game minute at 1×
  const HOLD = { goal: 2600, ht: 1800, et: 1500, pen: 950 };
  const TEAM_COLORS = { me: '#F4F1EA', them: '#F07A4E', home: '#9EC5FF', away: '#F07A4E' };

  // Find a game's raw match index (older saves don't store it on the game).
  function matchIndex(res, g, ci = 0) {
    if (g.mi != null) return g.mi;
    return res.matches.findIndex((m) => m.md === g.md && m.stage === g.stage && (m.h === ci || m.a === ci) && (m.h === g.oppIdx || m.a === g.oppIdx));
  }
  const watchBtn = (src, mi) => (mi >= 0 ? `<button class="watch-btn" data-watch="${src}:${mi}" title="Watch this match">▶</button>` : '<span></span>');

  // ---- Script: everything that will happen, decided up front ----
  function buildScript(res, mi) {
    const m = res.matches[mi];
    const clubs = [res.clubs[m.h], res.clubs[m.a]];
    const r = rngFor('live', C.seed || '', mi, clubs[0].name, clubs[1].name);
    const end = m.et ? 120 : 90;
    const str = clubs.map(strengthOf);
    const pHome = clamp(0.5 + ((str[0].attack + str[0].defense) - (str[1].attack + str[1].defense)) / 160, 0.32, 0.68);
    const events = [];
    const goalsBy = [m.eh || [], m.ea || []];
    goalsBy.forEach((list, team) => list.forEach((e) => events.push({ t: e.m - 0.2, min: e.m, team, kind: 'goal', s: e.s, a: e.a })));
    // Cosmetic chances, kept clear of the real goals.
    const busy = events.map((e) => e.t);
    const free = (t) => busy.every((b) => Math.abs(b - t) > 2.5);
    [0, 1].forEach((team) => {
      const share = team === 0 ? pHome : 1 - pHome;
      const n = 1 + Math.floor(r() * 3) + Math.round(share * 3);
      for (let k = 0, tries = 0; k < n && tries < 60; tries++) {
        const t = 3 + r() * (end - 6);
        if (!free(t)) continue;
        busy.push(t); k++;
        const roll = r();
        // Shooters: forwards mostly, midfielders sometimes.
        const f = FORMATIONS[clubs[team].f];
        const want = r() < 0.7 ? 'FWD' : 'MID';
        const pool = f.map((_, i) => i).filter((i) => POS[f[i][0]].line === want);
        events.push({ t, team, kind: roll < 0.5 ? 'saved' : roll < 0.85 ? 'wide' : 'blocked', s: pool.length ? pool[Math.floor(r() * pool.length)] : 10, a: null });
      }
    });
    events.sort((x, y) => x.t - y.t);
    // Space events out a little, but never past the final whistle (every real goal must happen).
    for (let i = 1; i < events.length; i++) if (events[i].t <= events[i - 1].t + 0.4) events[i].t = events[i - 1].t + 0.45;
    for (let i = events.length - 1; i >= 0; i--) {
      const cap = i === events.length - 1 ? end - 0.3 : events[i + 1].t - 0.45;
      if (events[i].t > cap) events[i].t = cap;
    }
    // Penalty shoot-out kicks, ordered so the tallies land on the real score.
    let kicks = null;
    if (m.pens) {
      const n = Math.max(5, m.pens[0], m.pens[1]);
      const seq = [0, 1].map((team) => {
        const hits = Array(n).fill(false);
        const idx = [...Array(n).keys()];
        for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
        idx.slice(0, m.pens[team]).forEach((k) => { hits[k] = true; });
        return hits;
      });
      kicks = [];
      for (let k = 0; k < n; k++) for (const team of [0, 1]) kicks.push({ team, hit: seq[team][k], taker: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0][k % 11] });
    }
    return { m, clubs, r, end, pHome, events, kicks, stage: m.stage || `Matchday ${m.md}` };
  }

  // ---- Pitch geometry: x = along the pitch (0 = home goal), y = across (0..1) ----
  function anchorsFor(club, team) {
    return FORMATIONS[club.f].map(([, fx, fy]) => {
      const d = clamp((88 - fy) / 73, 0, 1);
      const x = 0.045 + d * 0.4;
      return team === 0 ? { x, y: fx / 100 } : { x: 1 - x, y: 1 - fx / 100 };
    });
  }

  function openLive(res, mi, opts = {}) {
    if (!res || !res.clubs || !res.matches[mi]) return;
    const S0 = buildScript(res, mi);
    const box = $('#live');
    box.hidden = false;
    LV.open = true;
    LV.opts = opts;
    LV.res = res; LV.mi = mi;
    $('#live-stage').textContent = S0.stage;
    $('#live-hname').textContent = S0.clubs[0].name;
    $('#live-aname').textContent = S0.clubs[1].name;
    const col = (team) => {
      const c = S0.clubs[team], o = S0.clubs[1 - team];
      return c.me ? TEAM_COLORS.me : o.me ? TEAM_COLORS.them : team === 0 ? TEAM_COLORS.home : TEAM_COLORS.away;
    };
    LV.colors = [col(0), col(1)];
    $$('#live .lb-dot').forEach((d, i) => { d.style.background = LV.colors[i]; });
    // Timeline: goal markers along the match length, plus a goals summary in the side column.
    const endMin = S0.end, mk = (team) => (team === 0 ? S0.m.eh : S0.m.ea) || [];
    $('#live-marks').innerHTML = [0, 1].map((team) => mk(team).map((e) => `<i title="${esc(BY_ID.get(S0.clubs[team].xi[e.s]).name)} ${e.m}'" style="left:${(Math.min(e.m, endMin) / endMin) * 100}%;background:${team === 0 ? 'var(--ink)' : 'var(--accent)'}"></i>`).join('')).join('');
    $('#live-ticks').innerHTML = S0.m.et ? "<span>0'</span><span>60'</span><span>120'</span>" : "<span>0'</span><span>45'</span><span>90'</span>";
    $('#live-fill').style.width = '0%';
    $('#live-goals').innerHTML = '';
    $('#live-play').classList.remove('paused');
    $('#live-feed').innerHTML = '';
    LV.imgs = new Map();
    S0.clubs.forEach((c) => c.xi.forEach((id) => {
      if (LV.imgs.has(id)) return;
      LV.imgs.set(id, null);
      loadImg(spriteUrl(id, 'pixel')).then((im) => LV.imgs.set(id, im));
    }));
    LV.S = S0;
    resetMatch();
    sizeCanvas();
    showPrematch();
    cancelAnimationFrame(LV.raf);
    LV.last = performance.now();
    LV.raf = requestAnimationFrame(frame);
  }

  function closeLive() {
    if (!LV.open) return;
    LV.open = false;
    cancelAnimationFrame(LV.raf);
    $('#live').hidden = true;
    const cb = LV.opts && LV.opts.onClose;
    LV.opts = null;
    if (cb) cb();
  }

  function renderLiveGoals() {
    const g = LV.goals || [[], []];
    $('#live-goals').innerHTML = [0, 1].map((team) => `<div><span class="label">${esc(LV.S.clubs[team].name)}</span>${g[team].length ? g[team].map((x) => `<div><b>${esc(x)}</b></div>`).join('') : '<div class="muted">—</div>'}</div>`).join('');
  }

  function resetMatch() {
    const S0 = LV.S;
    LV.st = {
      t: 0, score: [0, 0], hold: 0, holdKind: null, banner: null, playing: false, done: false,
      carrier: { team: 0, slot: 10 }, action: null, queue: [], ev: 0, htDone: false, etDone: false,
      kick: 0, pens: [0, 0], celebrate: null, ball: { x: 0.5, y: 0.5, h: 0 }, flash: 0,
    };
    LV.anchors = [anchorsFor(S0.clubs[0], 0), anchorsFor(S0.clubs[1], 1)];
    LV.pos = LV.anchors.map((a) => a.map((p) => ({ x: p.x, y: p.y })));
    LV.phase = S0.clubs.map((c) => c.xi.map(() => Math.random() * 6.28));
    LV.agility = S0.clubs.map((c) => c.xi.map((id) => clamp(0.75 + BY_ID.get(id).s.spe / 220, 0.8, 1.45)));
    LV.clock = 0;
    LV.counter = null;
    LV.shiftMul = S0.clubs.map((c) => c.xi.map(() => 0.75 + Math.random() * 0.45));
    LV.react = S0.clubs.map((c) => c.xi.map(() => 0.7 + Math.random() * 0.6));
    LV.floorOff = S0.clubs.map((c) => c.xi.map(() => Math.random() * 0.06));
    LV.wander = S0.clubs.map((c) => c.xi.map(() => ({ x: 0, y: 0, next: Math.random() * 2000 })));
    $('#live-score').textContent = '0 – 0';
    $('#live-clock').textContent = "0'";
    $('#live-overlay').hidden = true;
    $('#live-feed').innerHTML = '';
    LV.goals = [[], []];
    renderLiveGoals();
    if ($('#live-fill')) $('#live-fill').style.width = '0%';
    kickoffShape(0);
  }

  function kickoffShape(team) {
    LV.pos = LV.anchors.map((a) => a.map((p) => ({ x: p.x, y: p.y })));
    LV.st.ball = { x: 0.5, y: 0.5, h: 0 };
    LV.st.carrier = { team, slot: 10 };
    LV.st.action = null;
    LV.st.queue = [];
  }

  const nameOf = (team, slot) => BY_ID.get(LV.S.clubs[team].xi[slot]).name;
  function feed(html, cls = '') {
    const el = document.createElement('div');
    el.className = 'lf ' + cls;
    el.innerHTML = html;
    const f = $('#live-feed');
    f.prepend(el);
    while (f.children.length > 7) f.lastChild.remove();
  }
  const minLabel = (t) => `${Math.min(Math.max(1, Math.ceil(t)), LV.S.end)}'`;

  // ---- Choosing what happens next ----
  function slotLine(team, slot) { return POS[FORMATIONS[LV.S.clubs[team].f][slot][0]].line; }
  function depthOf(team, slot) { const a = LV.anchors[team][slot]; return team === 0 ? a.x : 1 - a.x; }
  function pickReceiver(team, from, avoid = []) {
    const r = LV.S.r, n = LV.S.clubs[team].xi.length;
    const cands = [];
    for (let i = 0; i < n; i++) {
      if (i === from || avoid.includes(i)) continue;
      if (slotLine(team, i) === 'GK' && slotLine(team, from) !== 'DEF') continue;
      const a = LV.pos[team][i], b = LV.pos[team][from];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const fwd = depthOf(team, i) - depthOf(team, from);
      cands.push([i, Math.exp(-dist * 3.5) * (1 + 1.4 * Math.max(0, fwd))]);
    }
    let tot = cands.reduce((s, c) => s + c[1], 0), x = r() * tot;
    for (const [i, w] of cands) { x -= w; if (x <= 0) return i; }
    return cands.length ? cands[cands.length - 1][0] : from;
  }
  function nearestOpponent(team, pt) {
    const o = 1 - team;
    let best = 0, bd = Infinity;
    LV.pos[o].forEach((p, i) => { const d = Math.hypot(p.x - pt.x, p.y - pt.y); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  function nextAction() {
    const st = LV.st, S0 = LV.S, r = S0.r;
    if (st.queue.length) return st.queue.shift();
    const ev = S0.events[st.ev];
    const boundary = !st.htDone ? 45 : (S0.m.et && !st.etDone ? 90 : S0.end);
    const LEAD = 2.4;
    if (ev && ev.t - st.t <= LEAD && ev.t <= boundary + 0.01) return scriptEvent(ev);
    // Free play: pass, dribble or lose the ball.
    const c = st.carrier;
    const share = c.team === 0 ? S0.pHome : 1 - S0.pHome;
    let dur = 0.35 + r() * 0.5;
    const cap = Math.min(boundary, ev ? ev.t - LEAD : Infinity) - st.t;
    if (cap <= 0.05) return { type: 'idle', t0: st.t, t1: st.t + 0.05 };
    dur = Math.min(dur, Math.max(0.12, cap));
    const roll = r();
    if (roll < 0.17 * (1 - share) / 0.5) {
      const thief = nearestOpponent(c.team, st.ball);
      return { type: 'pass', team: 1 - c.team, from: c, to: { team: 1 - c.team, slot: thief }, t0: st.t, t1: st.t + Math.min(dur, 0.3), steal: true };
    }
    if (roll < 0.42) return { type: 'dribble', team: c.team, slot: c.slot, t0: st.t, t1: st.t + dur };
    return { type: 'pass', team: c.team, from: c, to: { team: c.team, slot: pickReceiver(c.team, c.slot) }, t0: st.t, t1: st.t + dur };
  }

  // Build-up that lands a shot exactly on the event minute.
  function scriptEvent(ev) {
    const st = LV.st, r = LV.S.r;
    st.ev++;
    const seq = [];
    let c = { ...st.carrier };
    if (c.team !== ev.team) {
      const thief = nearestOpponent(c.team, st.ball);
      seq.push({ type: 'pass', from: c, to: { team: ev.team, slot: thief }, steal: true });
      c = { team: ev.team, slot: thief };
    }
    const route = [];
    const mids = FORMATIONS[LV.S.clubs[ev.team].f].map((_, i) => i).filter((i) => slotLine(ev.team, i) === 'MID' && i !== ev.s && i !== ev.a);
    if (mids.length && r() < 0.7) route.push(mids[Math.floor(r() * mids.length)]);
    if (ev.a != null && ev.a !== ev.s) route.push(ev.a);
    route.push(ev.s);
    for (const slot of route) {
      if (slot === c.slot) continue;
      seq.push({ type: 'pass', from: c, to: { team: ev.team, slot } });
      c = { team: ev.team, slot };
    }
    seq.push({ type: 'shot', team: ev.team, slot: ev.s, ev });
    // Fit the sequence into the time left before the event minute.
    const avail = Math.max(0.25, ev.t - st.t);
    const shotDur = Math.min(0.25, avail * 0.3);
    const per = (avail - shotDur) / Math.max(1, seq.length - 1);
    let t = st.t;
    seq.forEach((a, i) => {
      const d = a.type === 'shot' ? shotDur : Math.max(0.08, per);
      a.t0 = t; a.t1 = t + d; t += d;
      if (a.type !== 'shot') a.team = a.to.team;
    });
    seq[seq.length - 1].t1 = Math.max(seq[seq.length - 1].t0 + 0.08, ev.t);
    st.queue = seq.slice(1);
    return seq[0];
  }

  // ---- Applying finished actions ----
  function finishAction(a) {
    const st = LV.st;
    if (a.type === 'pass') st.carrier = { ...a.to };
    if (a.steal) LV.counter = { team: a.to.team, t: LV.clock };
    if (a.type !== 'shot') return;
    const ev = a.ev, team = ev.team, opp = 1 - team;
    const who = esc(nameOf(team, ev.s)), club = esc(LV.S.clubs[team].name);
    if (ev.kind === 'goal') {
      st.score[team]++;
      $('#live-score').textContent = `${st.score[0]} – ${st.score[1]}`;
      (LV.goals = LV.goals || [[], []])[team].push(`${nameOf(team, ev.s)} ${ev.min}'`);
      renderLiveGoals();
      feed(`<b>${ev.min}'</b>GOAL! ${who} scores for ${club}${ev.a != null ? ` <span class="muted">(assist ${esc(nameOf(team, ev.a))})</span>` : ''} · ${st.score[0]}–${st.score[1]}`, 'goal');
      startHold('goal', HOLD.goal, { text: 'GOAL!', sub: nameOf(team, ev.s), team });
      st.celebrate = { team, slot: ev.s };
      st.afterHold = () => kickoffShape(opp);
      buzz(30);
    } else if (ev.kind === 'saved') {
      feed(`<b>${minLabel(ev.t)}</b> ${who} shoots… saved by ${esc(nameOf(opp, 0))}!`);
      st.carrier = { team: opp, slot: 0 };
    } else if (ev.kind === 'wide') {
      feed(`<b>${minLabel(ev.t)}</b> ${who} fires wide.`);
      st.carrier = { team: opp, slot: 0 };
      st.ball = { x: LV.pos[opp][0].x, y: LV.pos[opp][0].y, h: 0 };
    } else {
      const def = nearestOpponent(team, st.ball);
      feed(`<b>${minLabel(ev.t)}</b> ${who}'s shot is blocked by ${esc(nameOf(opp, def))}.`);
      st.carrier = { team: opp, slot: def };
    }
  }

  function startHold(kind, ms, banner) {
    const st = LV.st;
    st.hold = ms; st.holdKind = kind; st.banner = banner || null;
    if (kind === 'goal') st.flash = 1;
  }

  // ---- Per-frame update ----
  function update(dtReal) {
    const st = LV.st, S0 = LV.S;
    if (!st.playing || st.done) return;
    const speed = LV.speed || 1;
    if (st.hold > 0) {
      st.hold -= dtReal * speed;
      if (st.hold <= 0) {
        st.hold = 0; st.banner = null; st.celebrate = null;
        const fn = st.afterHold; st.afterHold = null;
        if (fn) fn();
      }
      return;
    }
    if (st.phaseShootout) { stepShootout(); return; }
    const dtMin = (dtReal * speed) / MS_PER_MIN;
    let remaining = dtMin;
    let guard = 0;
    while (remaining > 0 && guard++ < 20 && st.hold <= 0 && !st.done) {
      if (!st.action) st.action = beginAction(nextAction());
      const a = st.action;
      const step = Math.min(remaining, Math.max(0, a.t1 - st.t));
      st.t += step; remaining -= step;
      if (st.t >= a.t1 - 1e-6) {
        st.t = Math.max(st.t, a.t1);
        st.action = null;
        finishAction(a);
        checkBoundaries();
      }
    }
    if (!st.done) $('#live-clock').textContent = st.t >= S0.end ? (S0.m.pens ? 'Pens' : S0.m.et ? 'AET' : 'FT') : minLabel(st.t);
    $('#live-fill').style.width = `${Math.min(100, (st.t / S0.end) * 100)}%`;
  }

  function beginAction(a) {
    const st = LV.st;
    a.p0 = { x: st.ball.x, y: st.ball.y };
    if (a.type === 'shot') {
      const team = a.ev.team, gx = team === 0 ? 1.012 : -0.012;
      const r = LV.S.r;
      if (a.ev.kind === 'goal') a.p1 = { x: gx, y: 0.46 + r() * 0.08 };
      else if (a.ev.kind === 'wide') a.p1 = { x: team === 0 ? 1.03 : -0.03, y: r() < 0.5 ? 0.36 : 0.64 };
      else a.p1 = null; // saved/blocked: ends at the defender, resolved live
    }
    return a;
  }

  function checkBoundaries() {
    const st = LV.st, S0 = LV.S;
    if (!st.htDone && st.t >= 45 && st.hold <= 0) {
      st.htDone = true;
      feed(`<b>HT</b> Half-time · ${st.score[0]}–${st.score[1]}`, 'break');
      startHold('ht', HOLD.ht, { text: 'HALF-TIME', sub: `${st.score[0]} – ${st.score[1]}` });
      st.afterHold = () => kickoffShape(1);
      return;
    }
    if (S0.m.et && !st.etDone && st.t >= 90 && st.hold <= 0) {
      st.etDone = true;
      feed(`<b>90'</b> Level at ${st.score[0]}–${st.score[1]}. Extra time!`, 'break');
      startHold('et', HOLD.et, { text: 'EXTRA TIME', sub: `${st.score[0]} – ${st.score[1]}` });
      st.afterHold = () => kickoffShape(0);
      return;
    }
    if (st.t >= S0.end && st.hold <= 0) {
      if (S0.kicks && !st.phaseShootout && st.kick === 0) {
        feed(`<b>${S0.end}'</b> Still level. Penalties!`, 'break');
        st.phaseShootout = true;
        startHold('et', HOLD.et, { text: 'PENALTIES', sub: '' });
        return;
      }
      endMatch();
    }
  }

  function stepShootout() {
    const st = LV.st, S0 = LV.S;
    if (st.kick >= S0.kicks.length) { st.phaseShootout = false; endMatch(); return; }
    const k = S0.kicks[st.kick++];
    if (k.hit) st.pens[k.team]++;
    const team = k.team;
    st.ball = { x: team === 0 ? 0.885 : 0.115, y: 0.5, h: 0 };
    st.shootout = { team, hit: k.hit, t0: performance.now() };
    feed(`<b>PEN</b>${esc(nameOf(team, k.taker))} ${k.hit ? 'scores' : 'is denied'} · pens ${st.pens[0]}–${st.pens[1]}`, k.hit ? '' : 'miss');
    $('#live-score').textContent = `${st.score[0]} – ${st.score[1]} (${st.pens[0]}–${st.pens[1]})`;
    startHold('pen', HOLD.pen, { text: k.hit ? 'SCORED' : 'SAVED', sub: `${st.pens[0]} – ${st.pens[1]}`, small: true });
  }

  function endMatch() {
    const st = LV.st, S0 = LV.S;
    st.done = true; st.playing = false;
    const m = S0.m;
    const fin = m.pens ? `Penalties ${m.pens[0]}–${m.pens[1]}` : m.et ? 'After extra time' : 'Full-time';
    feed(`<b>FT</b> ${fin} · ${esc(S0.clubs[0].name)} ${m.gh}–${m.ga} ${esc(S0.clubs[1].name)}`, 'break');
    $('#live-score').textContent = `${m.gh} – ${m.ga}${m.pens ? ` (${m.pens[0]}–${m.pens[1]})` : ''}`;
    $('#live-clock').textContent = m.pens ? 'Pens' : m.et ? 'AET' : 'FT';
    showFulltime();
  }

  // ---- Overlays ----
  function showPrematch() {
    const S0 = LV.S, ov = $('#live-overlay');
    const list = (team) => S0.clubs[team].xi.map((id, i) => `<span><i style="color:${posColor(FORMATIONS[S0.clubs[team].f][i][0])}">${FORMATIONS[S0.clubs[team].f][i][0]}</i>${pkName(id)}</span>`).join('');
    ov.innerHTML = `<div class="lo-card">
      <div class="lo-stage">${esc(S0.stage)}</div>
      <div class="lo-vs"><b>${esc(S0.clubs[0].name)}</b><span>vs</span><b>${esc(S0.clubs[1].name)}</b></div>
      <div class="lo-lineups"><div><div class="group-title">${S0.clubs[0].f}</div>${list(0)}</div><div><div class="group-title">${S0.clubs[1].f}</div>${list(1)}</div></div>
      <div class="lo-actions"><button class="btn btn-gold" data-live="kickoff">▶ Kick off</button>${LV.opts.fromPlayback ? '<button class="btn" data-live="skip">Just show the score</button>' : ''}</div>
    </div>`;
    ov.hidden = false;
  }
  function showFulltime() {
    const S0 = LV.S, m = S0.m, ov = $('#live-overlay');
    const scorers = (team) => {
      const by = new Map();
      (team === 0 ? m.eh : m.ea).forEach((e) => { const n = nameOf(team, e.s); by.set(n, (by.get(n) || []).concat(e.m + "'")); });
      return [...by].map(([n, mins]) => `<div>${esc(n)} <span class="muted">${mins.join(', ')}</span></div>`).join('') || '<div class="muted">—</div>';
    };
    // Man of the match: biggest goal contribution, else the winning (or home) keeper.
    const score = new Map();
    [[m.eh, 0], [m.ea, 1]].forEach(([list, team]) => list.forEach((e) => {
      const k = team + ':' + e.s; score.set(k, (score.get(k) || 0) + 2);
      if (e.a != null) { const ka = team + ':' + e.a; score.set(ka, (score.get(ka) || 0) + 1); }
    }));
    let motm = [...score].sort((x, y) => y[1] - x[1])[0];
    const winTeam = m.winner != null ? (m.winner === m.h ? 0 : 1) : m.gh >= m.ga ? 0 : 1;
    const [mt, ms] = motm ? motm[0].split(':').map(Number) : [winTeam, 0];
    const fin = m.pens ? `Penalties ${m.pens[0]}–${m.pens[1]}` : m.et ? 'After extra time' : 'Full-time';
    ov.innerHTML = `<div class="lo-card">
      <div class="lo-stage">${fin}</div>
      <div class="lo-score"><b>${esc(S0.clubs[0].name)}</b><span>${m.gh} – ${m.ga}</span><b>${esc(S0.clubs[1].name)}</b></div>
      <div class="lo-lineups"><div>${scorers(0)}</div><div>${scorers(1)}</div></div>
      <div class="lo-motm">Man of the Match: <b>${esc(nameOf(mt, ms))}</b> <span class="muted">${esc(S0.clubs[mt].name)}</span></div>
      <div class="lo-actions"><button class="btn" data-live="replay">↻ Replay</button><button class="btn btn-gold" data-live="close">${LV.opts.fromPlayback ? 'Continue season' : 'Close'}</button></div>
    </div>`;
    ov.hidden = false;
  }

  // ---- Rendering ----
  function sizeCanvas() {
    const cv = $('#live-canvas'), wrap = $('#live-wrap');
    const land = innerWidth >= 700;
    LV.land = land;
    let w = wrap.clientWidth;
    let h = land ? w / 1.6 : w * 1.45;
    const maxH = innerHeight - (land ? 250 : 290);
    if (h > maxH) { h = Math.max(240, maxH); w = land ? h * 1.6 : h / 1.45; }
    const dpr = devicePixelRatio || 1;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    LV.W = cv.width; LV.H = cv.height; LV.dpr = dpr;
    const m = Math.min(LV.W, LV.H) * 0.045;
    LV.m = m;
    LV.short = land ? LV.H - 2 * m : LV.W - 2 * m;
    LV.pitchCache = null;
  }
  // Normalised pitch coords → canvas pixels.
  function P(x, y) {
    const m = LV.m;
    return LV.land
      ? [m + x * (LV.W - 2 * m), m + y * (LV.H - 2 * m)]
      : [m + y * (LV.W - 2 * m), m + (1 - x) * (LV.H - 2 * m)];
  }
  function drawPitch(ctx) {
    if (LV.pitchCache) { ctx.drawImage(LV.pitchCache, 0, 0); return; }
    const c = document.createElement('canvas');
    c.width = LV.W; c.height = LV.H;
    const g = c.getContext('2d');
    g.fillStyle = '#2C6642'; g.fillRect(0, 0, LV.W, LV.H);
    const rect = (x0, y0, x1, y1, fill) => {
      const [ax, ay] = P(x0, y0), [bx, by] = P(x1, y1);
      const x = Math.min(ax, bx), y = Math.min(ay, by), w = Math.abs(bx - ax), h = Math.abs(by - ay);
      if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); } else g.strokeRect(x, y, w, h);
    };
    for (let i = 0; i < 14; i++) rect(i / 14, 0, (i + 1) / 14, 1, i % 2 ? '#2F6B46' : '#2C6642');
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1.5, LV.dpr * 1.6);
    rect(0, 0, 1, 1);
    rect(0.5, 0, 0.5, 1);
    for (const side of [0, 1]) {
      const s = (x) => (side ? 1 - x : x);
      rect(s(0), 0.205, s(0.157), 0.795);
      rect(s(0), 0.365, s(0.052), 0.635);
      rect(s(-0.018), 0.446, s(0), 0.554, 'rgba(255,255,255,.18)');
      rect(s(-0.018), 0.446, s(0), 0.554);
      const [px, py] = P(s(0.105), 0.5);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(px, py, LV.dpr * 2, 0, 7); g.fill();
    }
    const [cx, cy] = P(0.5, 0.5);
    g.beginPath(); g.arc(cx, cy, LV.short * 0.135, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, LV.dpr * 2.2, 0, 7); g.fill();
    LV.pitchCache = c;
    ctx.drawImage(c, 0, 0);
  }

  // Where everyone wants to be this frame. Players stay anchored to their formation like a disciplined
  // team, with layered movement on top: personal drift, a shape that widens in possession and squeezes
  // without it, overlapping full-backs, timed striker runs and midfielders dropping to collect.
  function targets() {
    const st = LV.st, b = st.ball, tc = LV.clock;
    const live = st.playing && !st.done && st.hold <= 0;
    return [0, 1].map((team) => {
      const poss = st.carrier.team === team;
      const prog = team === 0 ? b.x : 1 - b.x; // how far the ball is toward this team's attacking goal
      const shift = (prog - 0.45) * 0.7 + (poss ? 0.09 : -0.03);
      const dir = team === 0 ? 1 : -1;
      const f = FORMATIONS[LV.S.clubs[team].f];
      return LV.anchors[team].map((a, i) => {
        // Every few seconds each player picks a new spot near their position and jogs to it.
        const wd = LV.wander[team][i];
        if (tc >= wd.next) {
          const rad = { GK: 0.015, DEF: 0.055, MID: 0.085, FWD: 0.1 }[POS[f[i][0]].line];
          wd.x = (Math.random() * 2 - 1) * rad;
          wd.y = (Math.random() * 2 - 1) * rad * 1.4;
          wd.next = tc + 1000 + Math.random() * 2000;
        }
        const pos = f[i][0], line = POS[pos].line, ph = LV.phase[team][i];
        let x, y;
        if (line === 'GK') {
          x = team === 0 ? 0.03 + clamp(b.x - 0.3, 0, 0.4) * 0.1 : 0.97 - clamp(0.7 - b.x, 0, 0.4) * 0.1;
          y = 0.5 + (b.y - 0.5) * 0.35 + Math.sin(tc * 0.0011 + ph) * 0.012 + wd.y;
          return { x: x + wd.x * 0.5, y };
        }
        x = a.x + dir * shift * LV.shiftMul[team][i]; // everyone pushes up/drops by a slightly different amount
        if (line === 'DEF' && poss) x += dir * 0.025 * Math.max(0, Math.sin(tc * (0.0006 + (ph % 1) * 0.0005) + ph * 7)); // step out
        // Shape breathes: wider with the ball, narrower and more compact without it.
        y = 0.5 + (a.y - 0.5) * (poss ? 1.1 : 0.86);
        if (!poss) x -= dir * (line === 'FWD' ? 0.04 : line === 'MID' ? 0.015 : 0);
        y += (b.y - y) * (poss ? 0.14 : 0.28);
        // Personal drift: two layered slow waves, bigger for attackers than defenders.
        const amp = line === 'FWD' ? 0.045 : line === 'MID' ? 0.038 : 0.024;
        x += (Math.sin(tc * 0.00071 + ph) * 0.6 + Math.sin(tc * 0.0017 + ph * 2.3) * 0.4) * amp + wd.x;
        y += (Math.cos(tc * 0.00063 + ph * 1.7) * 0.6 + Math.sin(tc * 0.0021 + ph) * 0.4) * amp * 1.3 + wd.y;
        if (live && poss && prog > 0.45) {
          const push = (prog - 0.45) * 2;
          if (/^(LB|RB|LWB|RWB)$/.test(pos)) x += dir * 0.08 * push; // overlap
          if (/^(LW|RW|LM|RM)$/.test(pos)) y += Math.sign(a.y - 0.5) * 0.03 * push; // hug the line
          if (line === 'FWD') {
            const run = Math.max(0, Math.sin(tc * 0.0012 + ph * 3)); // a run in behind every few seconds
            x += dir * 0.1 * run * run;
            if (pos === 'ST') y += Math.sin(ph * 5) * 0.08 * run; // on the diagonal
          }
          if (pos === 'CAM' || pos === 'CM') {
            const late = Math.max(0, Math.sin(tc * 0.0008 + ph * 4)); // late runs into the box
            x += dir * 0.07 * late * late * late;
          }
        }
        if (live && poss && prog < 0.35 && (pos === 'CDM' || pos === 'CM')) {
          x -= dir * 0.04; // drop deep to collect from the back line
          y += (b.y - y) * 0.2;
        }
        // Moments where the shape breaks, then reforms once play moves on.
        const depthTo = (d) => (team === 0 ? d : 1 - d);
        if (live && poss && prog > 0.66) {
          // Final third: forwards crash the box, midfielders arrive at its edge.
          if (line === 'FWD') { x += (depthTo(0.87) - x) * 0.45; y += (0.5 + (a.y - 0.5) * 0.5 - y) * 0.35; }
          else if (/^(CAM|CM|LM|RM)$/.test(pos)) x += (depthTo(0.74) - x) * 0.28;
        }
        if (live && !poss && prog < 0.34) {
          // Pinned back: defenders collapse into the box, midfield drops in front of them.
          if (line === 'DEF') { x += (depthTo(0.13) - x) * 0.35; y += (0.5 + (a.y - 0.5) * 0.65 - y) * 0.3; }
          else if (line === 'MID') x += (depthTo(0.25) - x) * 0.3;
        }
        if (live && LV.counter && LV.counter.team === team) {
          // Just won the ball: sprint forward on the counter for a few seconds.
          const k = 1 - (tc - LV.counter.t) / 3000;
          if (k > 0) x += dir * (line === 'FWD' ? 0.13 : line === 'MID' ? 0.06 : 0) * k;
        }
        if (/^(LW|RW|LM|RM)$/.test(pos)) {
          const cut = Math.max(0, Math.sin(tc * 0.0007 + ph * 2)); // wide players drift inside now and then
          y += (0.5 - y) * 0.35 * cut * cut;
        }
        // Soft floor (different per player) instead of a hard limit, so a team pinned back compresses
        // toward its goal without flattening into one straight line.
        let dpt = team === 0 ? x : 1 - x;
        const floor = (line === 'DEF' ? 0.08 : line === 'MID' ? 0.19 : 0.3) + LV.floorOff[team][i];
        if (dpt < floor) dpt = floor - (floor - dpt) * 0.2;
        dpt = Math.min(dpt, 0.95);
        return { x: team === 0 ? dpt : 1 - dpt, y };
      });
    });
  }

  function frame(now) {
    if (!LV.open) return;
    const dt = clamp(now - LV.last, 0, 64); // frame timestamps can land just before LV.last
    LV.last = Math.max(LV.last, now);
    update(dt);
    const st = LV.st, a = st.action;
    // Movement runs on match time, so it speeds up with the playback speed (and idles during breaks).
    const live = st.playing && !st.done && st.hold <= 0;
    LV.clock += dt * (live ? (LV.speed || 1) : 0.5);
    // Positions ease toward their targets; the carrier, presser, supporters and receiver get extra intent.
    const T = targets();
    if (live) {
      const c = st.carrier, cp = LV.pos[c.team][c.slot];
      if (a && a.type === 'dribble') {
        const p = (st.t - a.t0) / Math.max(1e-6, a.t1 - a.t0);
        T[c.team][c.slot].x += (c.team === 0 ? 1 : -1) * 0.05 * p;
      }
      // Marking: defenders stay goal-side of the nearest attacker in their area (midfielders loosely), so
      // the back line bends and staggers with the attackers instead of sliding as one straight line.
      const att = c.team, dfd = 1 - c.team;
      LV.pos[dfd].forEach((p, i) => {
        const line = slotLine(dfd, i);
        if (line === 'GK' || line === 'FWD') return;
        const t = T[dfd][i];
        let best = null, bd = Infinity;
        LV.pos[att].forEach((q, j) => {
          if (slotLine(att, j) === 'GK') return;
          const d = Math.hypot(q.x - t.x, q.y - t.y);
          if (d < bd) { bd = d; best = q; }
        });
        if (!best || bd > 0.25) return;
        const pull = line === 'DEF' ? 0.45 : 0.25;
        t.x += (best.x + (dfd === 0 ? -0.035 : 0.035) - t.x) * pull;
        t.y += (best.y - t.y) * pull;
      });
      // Finding space: attackers off the ball drift away from whoever is closest to them.
      LV.pos[att].forEach((p, i) => {
        if (i === c.slot || slotLine(att, i) === 'GK') return;
        let near = null, nd = Infinity;
        LV.pos[dfd].forEach((q) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < nd) { nd = d; near = q; } });
        if (!near || nd >= 0.12) return;
        const push = ((0.12 - nd) / 0.12) * 0.6, t = T[att][i];
        t.x += (p.x - near.x) * push; t.y += (p.y - near.y) * push;
      });
      // The nearest opponent presses the ball; the next nearest closes the space behind.
      const opp = 1 - c.team;
      LV.pos[opp]
        .map((p, i) => ({ i, d: Math.hypot(p.x - st.ball.x, p.y - st.ball.y) }))
        .filter((o) => slotLine(opp, o.i) !== 'GK')
        .sort((m, n) => m.d - n.d).slice(0, 2)
        .forEach(({ i }, rank) => {
          const tp = T[opp][i], pull = rank === 0 ? 0.6 : 0.3;
          tp.x += (st.ball.x - tp.x) * pull; tp.y += (st.ball.y - tp.y) * pull;
        });
      // The two nearest outfield teammates drift toward the carrier to offer a pass (without crowding).
      LV.pos[c.team]
        .map((p, i) => ({ i, d: Math.hypot(p.x - cp.x, p.y - cp.y) }))
        .filter((o) => o.i !== c.slot && slotLine(c.team, o.i) !== 'GK')
        .sort((m, n) => m.d - n.d).slice(0, 2)
        .forEach(({ i, d }) => {
          if (d < 0.08) return;
          const t = T[c.team][i];
          t.x += (cp.x - t.x) * 0.22; t.y += (cp.y - t.y) * 0.22;
        });
      // The receiver steps toward an incoming pass.
      if (a && a.type === 'pass') {
        const t = T[a.to.team][a.to.slot];
        t.x += (a.p0.x - t.x) * 0.12; t.y += (a.p0.y - t.y) * 0.12;
      }
    }
    const k = Math.min(1, dt * 0.0055 * Math.sqrt(LV.speed || 1));
    [0, 1].forEach((team) => LV.pos[team].forEach((p, i) => {
      const t = T[team][i];
      const ki = Math.min(1, k * LV.agility[team][i] * LV.react[team][i]); // quicker Pokémon get there faster
      p.x += (clamp(t.x, 0.015, 0.985) - p.x) * ki;
      p.y += (clamp(t.y, 0.03, 0.97) - p.y) * ki;
    }));
    // Ball.
    if (st.shootout) {
      const p = clamp((now - st.shootout.t0) / 450, 0, 1);
      const team = st.shootout.team, gx = team === 0 ? 1.01 : -0.01;
      const sx = team === 0 ? 0.895 : 0.105;
      st.ball = { x: sx + (gx - sx) * p, y: 0.5 + (st.shootout.hit ? 0.03 : -0.04) * p, h: 0 };
      if (p >= 1 && st.hold <= 0) st.shootout = null;
    } else if (a && st.hold <= 0) {
      const p = clamp((st.t - a.t0) / Math.max(1e-6, a.t1 - a.t0), 0, 1);
      if (a.type === 'pass') {
        const to = LV.pos[a.to.team][a.to.slot];
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const dist = Math.hypot(to.x - a.p0.x, to.y - a.p0.y);
        st.ball = { x: a.p0.x + (to.x - a.p0.x) * e, y: a.p0.y + (to.y - a.p0.y) * e, h: dist > 0.22 ? Math.sin(p * Math.PI) * dist * 0.5 : 0 };
      } else if (a.type === 'shot') {
        const opp = 1 - a.ev.team;
        const end = a.p1 || (a.ev.kind === 'saved' ? LV.pos[opp][0] : LV.pos[opp][nearestOpponent(a.ev.team, st.ball)]);
        st.ball = { x: a.p0.x + (end.x - a.p0.x) * p, y: a.p0.y + (end.y - a.p0.y) * p, h: Math.sin(p * Math.PI) * 0.04 };
      } else {
        const c = LV.pos[st.carrier.team][st.carrier.slot];
        const lead = st.carrier.team === 0 ? 0.012 : -0.012;
        st.ball = { x: c.x + lead, y: c.y + 0.01, h: 0 };
      }
    }
    draw(now);
    LV.raf = requestAnimationFrame(frame);
  }

  function draw(now) {
    const cv = $('#live-canvas'), ctx = cv.getContext('2d'), st = LV.st;
    drawPitch(ctx);
    const S = LV.short * (LV.land ? 0.12 : 0.15);
    const items = [];
    [0, 1].forEach((team) => LV.pos[team].forEach((p, i) => items.push({ team, i, p })));
    items.sort((x, y) => P(x.p.x, x.p.y)[1] - P(y.p.x, y.p.y)[1]);
    ctx.imageSmoothingEnabled = false;
    for (const it of items) {
      const [x, y] = P(it.p.x, it.p.y);
      const cel = st.celebrate && st.celebrate.team === it.team && st.celebrate.slot === it.i;
      const jump = cel ? Math.abs(Math.sin(now * 0.012)) * S * 0.35 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(x, y + S * 0.08, S * 0.3, S * 0.1, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = LV.colors[it.team]; ctx.lineWidth = Math.max(2, S * 0.06);
      ctx.beginPath(); ctx.ellipse(x, y + S * 0.08, S * 0.32, S * 0.12, 0, 0, 7); ctx.stroke();
      const im = LV.imgs.get(LV.S.clubs[it.team].xi[it.i]);
      if (im) ctx.drawImage(im, x - S / 2, y - S * 0.88 - jump, S, S);
      else { ctx.fillStyle = LV.colors[it.team]; ctx.beginPath(); ctx.arc(x, y - S * 0.3, S * 0.18, 0, 7); ctx.fill(); }
      const carrier = st.carrier.team === it.team && st.carrier.slot === it.i && st.playing && !st.done;
      if (carrier || cel) {
        const label = nameOf(it.team, it.i);
        ctx.font = `700 ${Math.round(11 * LV.dpr)}px Inter, sans-serif`;
        const tw = ctx.measureText(label).width + 10 * LV.dpr;
        const ly = y - S * 0.95 - jump - 9 * LV.dpr;
        ctx.fillStyle = 'rgba(12,14,18,.85)';
        roundRect(ctx, x - tw / 2, ly - 8 * LV.dpr, tw, 16 * LV.dpr, 5 * LV.dpr); ctx.fill();
        ctx.fillStyle = LV.colors[it.team]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x, ly);
      }
    }
    // Ball (with a lofted shadow for long passes).
    const b = st.ball, [bx, by] = P(b.x, b.y), br = Math.max(3, S * 0.09);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(bx, by + br * 0.6, br, br * 0.45, 0, 0, 7); ctx.fill();
    const lift = b.h * LV.short;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b1f26'; ctx.lineWidth = Math.max(1, br * 0.25);
    ctx.beginPath(); ctx.arc(bx, by - lift, br * (1 + b.h * 2), 0, 7); ctx.fill(); ctx.stroke();
    // Goal flash + banner.
    if (st.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${st.flash * 0.45})`; ctx.fillRect(0, 0, LV.W, LV.H);
      st.flash = Math.max(0, st.flash - 0.04);
    }
    if (st.banner) {
      const big = st.banner.small ? 0.07 : 0.11;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(LV.short * big)}px "Pixelify Sans", Inter, sans-serif`;
      const cy = LV.H * 0.42;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillText(st.banner.text, LV.W / 2 + 3 * LV.dpr, cy + 3 * LV.dpr);
      ctx.fillStyle = st.banner.team != null ? LV.colors[st.banner.team] : '#fff';
      ctx.fillText(st.banner.text, LV.W / 2, cy);
      if (st.banner.sub) {
        ctx.font = `700 ${Math.round(LV.short * 0.05)}px Inter, sans-serif`;
        ctx.fillStyle = '#fff'; ctx.fillText(st.banner.sub, LV.W / 2, cy + LV.short * 0.09);
      }
    }
  }

  // ---- Controls ----
  $('#live-overlay').addEventListener('click', (e) => {
    const b = e.target.closest('[data-live]');
    if (!b) return;
    const act = b.dataset.live;
    if (act === 'kickoff') {
      $('#live-overlay').hidden = true;
      LV.st.playing = true;
      feed(`<b>KO</b> ${esc(LV.S.clubs[0].name)} vs ${esc(LV.S.clubs[1].name)}. We're under way!`, 'break');
    } else if (act === 'skip' || act === 'close') closeLive();
    else if (act === 'replay') { resetMatch(); LV.st.playing = true; feed(`<b>KO</b> Replay: ${esc(LV.S.clubs[0].name)} vs ${esc(LV.S.clubs[1].name)}`, 'break'); }
  });
  $('#live-close').addEventListener('click', closeLive);
  $('#live-play').addEventListener('click', () => {
    const st = LV.st;
    if (st.done || !$('#live-overlay').hidden) return;
    st.playing = !st.playing;
    $('#live-play').classList.toggle('paused', !st.playing);
    $('#live-play').setAttribute('aria-label', st.playing ? 'Pause' : 'Play');
  });
  $('#live-speed').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    LV.speed = +b.dataset.s;
    $$('#live-speed button').forEach((x) => x.classList.toggle('on', x === b));
  });
  $('#live-skip').addEventListener('click', () => {
    const st = LV.st;
    if (st.done) return;
    $('#live-overlay').hidden = true;
    st.score = [LV.S.m.gh, LV.S.m.ga];
    st.t = LV.S.end; st.hold = 0; st.banner = null; st.celebrate = null; st.action = null; st.queue = [];
    st.phaseShootout = false; st.shootout = null;
    endMatch();
  });
  window.addEventListener('resize', () => { if (LV.open) sizeCanvas(); });
  document.addEventListener('keydown', (e) => {
    if (!LV.open) return;
    if (e.key === 'Escape') closeLive();
    else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('#live-play').click(); }
  });
  // ▶ buttons anywhere (Games tabs, club pages).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-watch]');
    if (!b) return;
    e.stopPropagation();
    const [src, mi] = b.dataset.watch.split(':');
    openLive(src === 'national' ? C.national : C.result, +mi, {});
  }, true);

  // ---------------- Light / dark theme ----------------
  // No saved choice = follow the system setting. The toggle flips to the opposite of what's showing.
  const sysDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = () => (S.theme ? S.theme === 'dark' : sysDark());
  function applyTheme() {
    if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme;
    $('#theme-toggle').setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  }
  $('#theme-toggle').addEventListener('click', () => {
    S.theme = isDark() ? 'light' : 'dark';
    store.set('pxi.settings', S);
    applyTheme();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!S.theme) applyTheme(); });
  applyTheme();

  // ---------------- Help ----------------
  function openHelp(tab) {
    if (tab) showHelpTab(tab);
    $('#help-modal').hidden = false;
    S.seenHelp = true;
    store.set('pxi.settings', S);
  }
  function showHelpTab(tab) {
    $$('#help-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.help === tab));
    $$('#help-body section').forEach((sec) => { sec.hidden = sec.dataset.help !== tab; });
    $('#help-body').scrollTop = 0;
  }
  const closeHelp = () => { $('#help-modal').hidden = true; };
  // Open on the tab for whatever mode you're in.
  $('#help-open').addEventListener('click', () => openHelp({ builder: 'builder', challenge: 'challenge', regions: 'regions', records: 'records' }[S.view] || 'basics'));
  $('#help-close').addEventListener('click', closeHelp);
  $('#help-modal').addEventListener('click', (e) => { if (e.target.id === 'help-modal') closeHelp(); });
  $('#help-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-help]'); if (b) showHelpTab(b.dataset.help); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#help-modal').hidden) closeHelp();
    else if (e.key === '?' && !e.target.closest('input, textarea, select') && $('#picker').hidden) openHelp();
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
  const fromChallenge = handleChallengeLink();
  if (!S.seenHelp && !fromHash && !fromChallenge) openHelp('basics'); // first visit
})();
