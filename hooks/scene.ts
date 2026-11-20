// An 8-bit ocean on a 320x200 pixel grid, scaled up with crisp edges.
// Everything moves in whole-pixel steps, like an old console game.
// Creatures keep to the edges, top and seabed, so the chat column in the
// middle stays calm behind the glass.

type Pal = Record<string, string>

const W = 320
const H = 200
const SEABED = 188

// One rect per horizontal run of a color, so a sprite stays small.
const sprite = (rows: readonly string[], pal: Pal): string => {
  let out = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x] ?? '.'
      let end = x + 1
      while (end < row.length && row[end] === c) end++
      const fill = pal[c]
      if (fill !== undefined) {
        out += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`
      }
      x = end
    }
  })
  return out
}

const at = (x: number, y: number, inner: string, extra = '') =>
  `<g transform="translate(${x},${y})"${extra}>${inner}</g>`

const flip = (width: number, inner: string) =>
  `<g transform="translate(${width},0) scale(-1,1)">${inner}</g>`

// Moving parts: an outer group pins the resting place, an inner one moves.
// With motion off the inner group has no transform and rests there.
const mover = (x: number, y: number, cls: string, style: string, inner: string) =>
  at(x, y, `<g class="${cls}" style="${style}">${inner}</g>`)

// ---- sprites ---------------------------------------------------------------

const FISH = ['o...oooo..', 'oo.oooooo.', '.ooooooeoo', 'oo.bbbbbb.', 'o...bbbb..']
const FISH_TEAL: Pal = { o: '#4fd6c8', b: '#a8f0e6', e: '#06202e' }
const FISH_GOLD: Pal = { o: '#ffb347', b: '#ffe08a', e: '#06202e' }
const FISH_PINK: Pal = { o: '#ff7f8a', b: '#ffc2c7', e: '#06202e' }

const CRAB_BODY = [
  'C.C........C.C',
  'CCC..w..w..CCC',
  '.C...k..k...C.',
  '.CC..C..C..CC.',
  '..CCCCCCCCCC..',
  '...CCCCCCCC...',
  '...dddddddd...',
]
const CRAB_LEGS_A = ['..l.l....l.l..', '.l..l....l..l.']
const CRAB_LEGS_B = ['...l.l..l.l...', '...l.l..l.l...']
const CRAB: Pal = { C: '#f0835a', d: '#b9573a', k: '#120a08', w: '#fff4e6', l: '#d86a45' }

const JELLY_BELL = ['..jjjjj..', '.jhhjjjj.', 'jhjjjjjjj', 'jjjjjjjjj', 'j.jj.jj.j']
const JELLY_TAILS_A = ['.t..t..t.', '.t..t..t.', '..t..t..t', '.t..t..t.', 't..t..t..', '.t..t..t.']
const JELLY_TAILS_B = ['.t..t..t.', 't..t..t..', '.t..t..t.', '..t..t..t', '.t..t..t.', '..t..t..t']
const JELLY: Pal = { j: '#c79bff', h: '#efe0ff', t: '#9c7ae6' }

const TURTLE_BODY = [
  '.....SSSSS......',
  '...SSsSSSsSS....',
  '..SSSSSsSSSSS...',
  'hhSSsSSSSSsSSS.t',
  'hkSSSSSsSSSSSStt',
  'hhhBBBBBBBBBBB..',
]
const TURTLE_FLIPS_A = ['..ff.......ff...', '.ff.........ff..']
const TURTLE_FLIPS_B = ['...ff.....ff....', '...ff.....ff....']
const TURTLE: Pal = { S: '#3f9d6a', s: '#2b7a50', h: '#8fd18a', k: '#06202e', B: '#c9b77a', f: '#7cc47a', t: '#7cc47a' }

const STAR = ['...s...', '..sss..', 'sssssss', '.sspss.', '..sss..', '.ss.ss.', '.s...s.']
const STAR_PAL: Pal = { s: '#ff9a6b', p: '#ffd1b3' }

const ROCK = ['..rrrr...', '.rRRrrr..', 'rRrrrrrrr', 'rrrrrrrrr']
const ROCK_PAL: Pal = { r: '#1d3446', R: '#2f4f66' }

const CORAL = ['.c...c...', '.c.c.c.c.', '.ccc.ccc.', '..c...c..', '..cc.cc..', '...ccc...', '....c....', '....c....']
const CORAL_PAL: Pal = { c: '#ff6f7d' }

const BUBBLE = ['.b.', 'b.b', '.b.']
const BUBBLE_PAL: Pal = { b: '#bfefff' }

// ---- the water ------------------------------------------------------------

// Banded water, darker with depth, dithered at each edge the 8-bit way.
const BANDS: [number, string][] = [
  [0, '#1f7aa3'],
  [10, '#17648a'],
  [28, '#125273'],
  [52, '#0e425f'],
  [82, '#0b354d'],
  [114, '#092a3e'],
  [146, '#072132'],
  [172, '#061a28'],
]

const row = (y: number, color: string, dash: string, offset: number) =>
  `<line x1="0" x2="${W}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${color}" stroke-dasharray="${dash}" stroke-dashoffset="${offset}"/>`

const water = (): string => {
  let out = ''
  BANDS.forEach(([y, color], i) => {
    const end = BANDS[i + 1]?.[0] ?? H
    out += `<rect x="0" y="${y}" width="${W}" height="${end - y}" fill="${color}"/>`
  })
  // The next band's color creeps up into this one: 25%, 25%, 50%, 50%.
  BANDS.slice(1).forEach(([y, color]) => {
    out += row(y - 4, color, '1 3', 0)
    out += row(y - 3, color, '1 3', 2)
    out += row(y - 2, color, '1 1', 0)
    out += row(y - 1, color, '1 1', 1)
  })
  return out
}

// The surface seen from below: two rows of crests rolling past.
const surface = (): string =>
  `<line class="wl" x1="-16" x2="${W + 16}" y1="8.5" y2="8.5" stroke="#5cc3e6" stroke-dasharray="5 3 2 6"/>` +
  `<line class="wr" x1="-16" x2="${W + 16}" y1="6.5" y2="6.5" stroke="#8fe0f5" stroke-dasharray="3 9 2 2"/>` +
  `<line class="wl" x1="-16" x2="${W + 16}" y1="10.5" y2="10.5" stroke="#1f7aa3" stroke-dasharray="4 4" style="animation-duration:11s"/>`

const SPARKLES: [number, number, number, number][] = [
  [22, 3, 7, 0],
  [61, 2, 9, -3],
  [104, 4, 8, -6],
  [173, 2, 10, -2],
  [228, 3, 7, -5],
  [281, 4, 9, -1],
  [306, 2, 8, -4],
]
const sparkles = () =>
  SPARKLES.map(
    ([x, y, d, delay]) =>
      `<rect class="tw" x="${x}" y="${y}" width="1" height="1" fill="#ffffff" style="animation-duration:${d}s;animation-delay:${delay}s"/>`,
  ).join('')

// Sunlight in stair steps, fading as it goes down.
const RAYS: [number, number, number][] = [
  [26, 10, 0],
  [66, 6, -4],
  [212, 12, -7],
  [254, 7, -2],
]
const rays = (): string =>
  RAYS.map(([x0, w, delay]) => {
    const steps = 14
    let rects = ''
    for (let k = 0; k < steps; k++) {
      const op = (1 - k / steps).toFixed(2)
      rects += `<rect x="${x0 + 4 * k}" y="${10 + 8 * k}" width="${w}" height="8" opacity="${op}"/>`
    }
    return `<g class="ray" fill="#bfefff" opacity="0.08" style="animation-delay:${delay}s">${rects}</g>`
  }).join('')

// ---- the seabed -----------------------------------------------------------

const sand = (): string => {
  let out = `<rect x="0" y="${SEABED}" width="${W}" height="${H - SEABED}" fill="#4a3d2c"/>`
  out += `<rect x="0" y="${SEABED}" width="${W}" height="1" fill="#6b5a40"/>`
  // Bumps along the top of the sand.
  const BUMPS: [number, number][] = [
    [0, 14], [30, 9], [58, 18], [104, 7], [150, 12], [196, 8], [232, 16], [276, 10], [300, 20],
  ]
  for (const [x, w] of BUMPS) {
    out += `<rect x="${x}" y="${SEABED - 2}" width="${w}" height="2" fill="#4a3d2c"/>`
    out += `<rect x="${x + 1}" y="${SEABED - 2}" width="${w - 2}" height="1" fill="#6b5a40"/>`
  }
  out += row(SEABED + 4, '#5c4c36', '1 5', 0)
  out += row(SEABED + 7, '#3c3124', '1 7', 3)
  out += row(SEABED + 9, '#5c4c36', '1 6', 2)
  return out
}

// Seaweed in two frames, swaying left then right.
const weedFrame = (h: number, sway: number[]): string => {
  let out = ''
  for (let i = 0; i < h / 2; i++) {
    const dx = sway[i % sway.length] ?? 0
    const color = i % 2 === 0 ? '#2f8f5b' : '#3fae6f'
    out += `<rect x="${dx}" y="${-2 * (i + 1)}" width="2" height="2" fill="${color}"/>`
  }
  return out
}
const SWAY = [0, 0, 1, 1, 0, 0, -1, -1]
const SWAY_B = SWAY.map(d => -d)
const weed = (x: number, h: number, delay: number) =>
  at(
    x,
    SEABED,
    `<g class="fa" style="animation-duration:2.4s;animation-delay:${delay}s">${weedFrame(h, SWAY)}</g>` +
      `<g class="fb" style="animation-duration:2.4s;animation-delay:${delay}s">${weedFrame(h, SWAY_B)}</g>`,
  )

// ---- creatures ------------------------------------------------------------

const fish = (pal: Pal) => sprite(FISH, pal)

const crab = () =>
  sprite(CRAB_BODY, CRAB) +
  at(0, 7, `<g class="fa" style="animation-duration:0.8s">${sprite(CRAB_LEGS_A, CRAB)}</g>`) +
  at(0, 7, `<g class="fb" style="animation-duration:0.8s">${sprite(CRAB_LEGS_B, CRAB)}</g>`)

const jelly = (delay: number) =>
  `<g opacity="0.16" fill="#d2b2ff"><rect x="1" y="-2" width="7" height="1"/><rect x="-1" y="-1" width="11" height="1"/><rect x="-2" y="0" width="13" height="5"/><rect x="-1" y="5" width="11" height="1"/></g>` +
  sprite(JELLY_BELL, JELLY) +
  at(0, 5, `<g class="fa" style="animation-duration:1.2s;animation-delay:${delay}s">${sprite(JELLY_TAILS_A, JELLY)}</g>`) +
  at(0, 5, `<g class="fb" style="animation-duration:1.2s;animation-delay:${delay}s">${sprite(JELLY_TAILS_B, JELLY)}</g>`)

const turtle = () =>
  sprite(TURTLE_BODY, TURTLE) +
  at(0, 6, `<g class="fa" style="animation-duration:1.6s">${sprite(TURTLE_FLIPS_A, TURTLE)}</g>`) +
  at(0, 6, `<g class="fb" style="animation-duration:1.6s">${sprite(TURTLE_FLIPS_B, TURTLE)}</g>`)

// Bubbles rise from the seaweed, the crab and the coral.
const BUBBLES: [number, number, number, number][] = [
  [10, 178, 16, 0],
  [12, 182, 21, -9],
  [70, 176, 18, -4],
  [74, 180, 23, -14],
  [276, 174, 19, -6],
  [306, 178, 17, -2],
  [309, 182, 24, -12],
]
const bubbles = () =>
  BUBBLES.map(([x, y, d, delay], i) =>
    mover(
      x,
      y,
      'rise',
      `animation-duration:${d}s;animation-delay:${delay}s`,
      i % 3 === 2 ? '<rect width="1" height="1" fill="#bfefff"/>' : sprite(BUBBLE, BUBBLE_PAL),
    ),
  ).join('')

// Specks of marine snow drifting down.
const SNOW: [number, number, number, number][] = [
  [14, 40, 14, 0], [48, 92, 17, -5], [36, 140, 15, -9], [84, 30, 19, -3],
  [238, 50, 16, -7], [262, 120, 18, -2], [296, 34, 15, -11], [312, 96, 20, -6],
  [140, 22, 22, -4], [182, 60, 21, -13], [120, 150, 19, -8], [200, 138, 17, -1],
]
const snow = () =>
  SNOW.map(([x, y, d, delay]) =>
    mover(x, y, 'snow', `animation-duration:${d}s;animation-delay:${delay}s`, '<rect width="1" height="1" fill="#d6f4ff" opacity="0.5"/>'),
  ).join('')

const STYLE = `
svg{shape-rendering:crispEdges}
.wl{animation:wl 6s steps(16) infinite}
.wr{animation:wr 9s steps(16) infinite}
@keyframes wl{to{stroke-dashoffset:-16}}
@keyframes wr{to{stroke-dashoffset:16}}
.tw{opacity:0;animation:tw 8s step-end infinite}
@keyframes tw{0%{opacity:0}46%{opacity:0.85}54%{opacity:0}}
.ray{animation:ray 12s steps(4) infinite alternate}
@keyframes ray{from{opacity:0.05}to{opacity:0.11}}
.fa{animation:fa 1s step-end infinite}
.fb{opacity:0;animation:fb 1s step-end infinite}
@keyframes fa{0%{opacity:1}50%{opacity:0}}
@keyframes fb{0%{opacity:0}50%{opacity:1}}
.swimA{animation:swimA 48s steps(380) infinite}
@keyframes swimA{from{transform:translateX(-60px)}to{transform:translateX(320px)}}
.swimB{animation:swimB 44s steps(380) infinite}
@keyframes swimB{from{transform:translateX(70px)}to{transform:translateX(-310px)}}
.swimC{animation:swimC 64s steps(370) infinite}
@keyframes swimC{from{transform:translateX(-280px)}to{transform:translateX(90px)}}
.turtle{animation:turtle 150s steps(370) infinite}
@keyframes turtle{from{transform:translateX(90px)}to{transform:translateX(-280px)}}
.walk{animation:walk 18s steps(18) infinite}
@keyframes walk{0%,12%{transform:translateX(0)}37%,50%{transform:translateX(-18px)}62%{transform:translateX(0)}87%,100%{transform:translateX(18px)}}
.bob{animation:bob 9s steps(10) infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.rise{animation:rise 18s steps(170) infinite}
@keyframes rise{0%{transform:translateY(0);opacity:0.85}88%{opacity:0.85}100%{transform:translateY(-170px);opacity:0}}
.snow{animation:snow 16s steps(30) infinite}
@keyframes snow{0%{transform:translateY(0);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateY(30px);opacity:0}}
`

export const buildScene = (): string =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">`,
    `<style>${STYLE}</style>`,
    water(),
    rays(),
    surface(),
    sparkles(),
    snow(),
    // Far side: a turtle crossing slowly, mid-depth.
    mover(244, 116, 'turtle', '', turtle()),
    // A school of teal fish near the top, heading right.
    mover(24, 34, 'swimA', 'animation-delay:-6s', at(0, 0, fish(FISH_TEAL)) + at(14, -6, fish(FISH_TEAL)) + at(12, 7, fish(FISH_TEAL))),
    // A lone pink fish, slower, heading right.
    mover(250, 74, 'swimC', 'animation-delay:-20s', fish(FISH_PINK)),
    // Two gold fish low down, heading left.
    mover(270, 146, 'swimB', 'animation-delay:-30s', at(0, 0, flip(10, fish(FISH_GOLD))) + at(13, 5, flip(10, fish(FISH_GOLD)))),
    // Jellyfish along the edges, bobbing.
    mover(286, 64, 'bob', '', jelly(0)),
    mover(24, 100, 'bob', 'animation-delay:-4s;animation-duration:11s', jelly(-0.6)),
    // The seabed.
    sand(),
    at(18, SEABED - 4, sprite(ROCK, ROCK_PAL)),
    at(284, SEABED - 4, sprite(ROCK, ROCK_PAL)),
    weed(6, 34, 0),
    weed(14, 24, -1.2),
    weed(300, 30, -0.6),
    weed(310, 42, -1.8),
    at(270, SEABED - 8, sprite(CORAL, CORAL_PAL)),
    at(254, SEABED - 6, sprite(STAR, STAR_PAL)),
    at(38, SEABED - 6, sprite(STAR, { s: '#ffcf5c', p: '#fff0b8' })),
    // The crab, scuttling back and forth.
    mover(58, SEABED - 9, 'walk', '', crab()),
    bubbles(),
    `</svg>`,
  ].join('')
