// news-image-20261121 — "THE WORLD IN ONE DAY — SATURDAY 21 NOVEMBER 2026"
//
// A newspaper front page summing up Saturday 21 November 2026, drawn from
// scratch with a hand-rolled canvas and PNG encoder. No network at run time,
// no dependencies beyond Node's built-ins. Running `node main.ts` writes
// /output/entry.png, byte-identical on every run.
//
// Stories are the day-so-far reports filed on 21 November 2026 (built
// ~03:53 WAT): the Trump–Xi–Putin trilateral summit in Shenzhen, Russia's
// renewed missile assault on Ukraine and a missile crash in Poland, the
// ICJ's genocide ruling against Myanmar, and the claim that Claude proved
// the Riemann Hypothesis — plus the day's briefs from around the world.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1024;
const H = 1024;

// ---- colours: newsprint paper, black ink, one red accent ----
const PAPER: RGB = [248, 244, 234];
const INK: RGB = [17, 17, 17];
const RED: RGB = [164, 31, 31];
const GREY: RGB = [96, 91, 80];
const FAINT: RGB = [224, 217, 198];
const PALE_RED: RGB = [238, 226, 214];

type RGB = [number, number, number];

// ---- 5x7 bitmap font ----
// Each glyph is seven rows; each row is a five-bit mask, most significant
// bit on the left. Lowercase letters sit on the same seven-row grid, so
// body copy can stay readable at small scales.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0f, 0x11, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x09, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10],
  q: [0x00, 0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x0e, 0x08, 0x08, 0x08, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x15, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "-": [0, 0, 0, 0x0e, 0, 0, 0],
  "–": [0, 0, 0, 0x0e, 0, 0, 0],
  "—": [0, 0, 0, 0x1f, 0, 0, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "’": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "%": [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  "+": [0, 0x04, 0x04, 0x0e, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "•": [0, 0, 0x0c, 0x0c, 0x0c, 0, 0],
  "·": [0, 0, 0, 0, 0x0c, 0x0c, 0],
  "×": [0, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  "<": [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
  ">": [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
};

const FALLBACK = FONT["?"];

// ---- tiny RGB canvas ----
class Canvas {
  px: Uint8Array;
  w: number;
  h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h * 3);
  }
  fill(color: RGB): void {
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = color[0];
      this.px[i + 1] = color[1];
      this.px[i + 2] = color[2];
    }
  }
  set(x: number, y: number, color: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = color[0];
    this.px[i + 1] = color[1];
    this.px[i + 2] = color[2];
  }
  rect(x: number, y: number, w: number, h: number, color: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
  }
  hline(x: number, y: number, w: number, color: RGB, thick = 1): void {
    this.rect(x, y, w, thick, color);
  }
  vline(x: number, y: number, h: number, color: RGB, thick = 1): void {
    this.rect(x, y, thick, h, color);
  }
  // Bresenham line, for the globe's meridians and decoration.
  line(x0: number, y0: number, x1: number, y1: number, color: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, color);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, color: RGB, fill = false): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d2 = x * x + y * y;
        if (fill ? d2 <= r * r : Math.abs(Math.sqrt(d2) - r) < 0.9) {
          this.set(cx + x, cy + y, color);
        }
      }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, color: RGB): void {
    for (let a = 0; a < 360; a += 1) {
      const t = (a * Math.PI) / 180;
      this.set(
        Math.round(cx + rx * Math.cos(t)),
        Math.round(cy + ry * Math.sin(t)),
        color,
      );
    }
  }
}

// ---- text ----
function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale; // 5px glyph + 1px gap, per char
}

function drawText(
  cv: Canvas,
  x: number,
  y: number,
  text: string,
  scale: number,
  color: RGB,
): void {
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FALLBACK;
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          cv.rect(cx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(
  cv: Canvas,
  cx: number,
  y: number,
  text: string,
  scale: number,
  color: RGB,
): void {
  drawText(cv, cx - Math.floor(textWidth(text, scale) / 2), y, text, scale, color);
}

// Greedy word wrap; returns the lines used.
function wrapText(text: string, maxWidth: number, scale: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur === "" ? word : cur + " " + word;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      // A single over-long word is split by character.
      if (textWidth(word, scale) > maxWidth) {
        let chunk = "";
        for (const ch of word) {
          if (textWidth(chunk + ch, scale) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        cur = chunk;
      } else cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// Draw wrapped text; returns the y just below the last line.
function drawPara(
  cv: Canvas,
  x: number,
  y: number,
  text: string,
  maxWidth: number,
  scale: number,
  color: RGB,
  lineGap = 5,
): number {
  const lines = wrapText(text, maxWidth, scale);
  const lineH = 7 * scale + lineGap;
  lines.forEach((ln, i) => drawText(cv, x, y + i * lineH, ln, scale, color));
  return y + lines.length * lineH;
}

// ---- deterministic PNG encoder (RGB, no ancillary chunks) ----
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // One filter byte (0 = none) per scanline, then raw RGB rows.
  const raw = Buffer.alloc(cv.h * (1 + cv.w * 3));
  for (let y = 0; y < cv.h; y++) {
    raw[y * (1 + cv.w * 3)] = 0;
    raw.set(
      cv.px.subarray(y * cv.w * 3, (y + 1) * cv.w * 3),
      y * (1 + cv.w * 3) + 1,
    );
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- the day's stories (reports filed on 21 November 2026) ----

const LEAD_KICKER = "SHENZHEN  •  THE TRILATERAL SUMMIT";
const LEAD_HEAD = ["TRUMP, XI AND PUTIN", "MEET FACE TO FACE"];
const LEAD_DECK =
  "The three leaders hold their first trilateral talks at APEC in Shenzhen, " +
  "signing a joint declaration on UN reform, nuclear weapons and oil output. " +
  "Trump calls Putin \"my friend\" and sees a \"real good chance\" of ending " +
  "the Ukraine war.";

const STORY2_KICKER = "UKRAINE  •  WAR";
const STORY2_HEAD = "RUSSIA POUNDS UKRAINE ANEW";
const STORY2_BODY =
  "Moscow launches a huge missile and drone assault, killing eight in Kyiv, " +
  "a day after Putin vowed retaliation for a Ukrainian strike on the " +
  "Crimean Bridge. A Russian missile crashes in Poland; Warsaw calls it a " +
  "provocation.";

const STORY3_KICKER = "THE HAGUE  •  JUSTICE";
const STORY3_HEAD = "COURT: MYANMAR COMMITTED GENOCIDE";
const STORY3_BODY =
  "The world's top court finds Myanmar guilty of genocide against the " +
  "Rohingya; Malaysia plans to resettle 10,000 Rohingya in Turkey.";

const STORY4_KICKER = "SCIENCE  •  MATHEMATICS";
const STORY4_HEAD = "CLAUDE 'SOLVES' MATH'S RIDDLE?";
const STORY4_BODY =
  "An Anthropic researcher says the firm's Claude chatbot has proved the " +
  "Riemann Hypothesis, a problem unsolved for 167 years. The claim awaits " +
  "checking.";

const BRIEFS: Array<[string, string]> = [
  [
    "NEW YORK",
    "Gupta jailed 19.5 years in the Pannun murder-for-hire plot.",
  ],
  [
    "COPENHAGEN",
    "Denmark says Russia plotted to kill a Ukrainian rapper.",
  ],
  [
    "LONDON",
    "UK and EU clinch a deal to reset ties on trade and youth.",
  ],
  [
    "CLIMATE",
    "COP31 talks run into overtime as fossil fuels deadlock them.",
  ],
  [
    "DHAKA",
    "Fresh arson attacks rock Bangladesh amid political unrest.",
  ],
  [
    "BRASILIA",
    "Jair Bolsonaro is hospitalised with abdominal pain.",
  ],
  [
    "BAGHDAD",
    "Iraqi forces retake a pro-Iran militia stronghold.",
  ],
  [
    "RIYADH",
    "A Houthi missile threat is intercepted over the capital.",
  ],
];

// ---- layout ----

const M = 40; // page margin
const CW = W - 2 * M; // content width, 944

function masthead(cv: Canvas): void {
  // Top rules and the paper's name.
  cv.hline(M, 26, CW, INK, 2);
  drawTextCentered(cv, W / 2, 44, "THE WORLD IN ONE DAY", 6, INK);
  cv.hline(M, 96, CW, INK, 2);
  cv.hline(M, 101, CW, INK, 1);
  // Dateline, the day this page sums up.
  drawTextCentered(cv, W / 2, 116, "SATURDAY, 21 NOVEMBER 2026", 3, RED);
  drawTextCentered(
    cv,
    W / 2,
    142,
    "THE DAY'S NEWS, ON ONE PAGE  •  DAY-SO-FAR EDITION",
    2,
    GREY,
  );
  cv.hline(M, 164, CW, INK, 3);
}

// A small globe: circle, meridians, parallels, red dots on the day's places.
function globe(cv: Canvas, cx: number, cy: number, r: number): void {
  cv.circle(cx, cy, r, INK);
  cv.ellipse(cx, cy, Math.round(r * 0.45), r, INK);
  cv.ellipse(cx, cy, Math.round(r * 0.85), r, INK);
  cv.ellipse(cx, cy, r, Math.round(r * 0.45), INK);
  cv.ellipse(cx, cy, r, Math.round(r * 0.85), INK);
  cv.hline(cx - r, cy, 2 * r, INK);
  // Shenzhen, Kyiv, The Hague — the day's three centres of gravity.
  cv.circle(cx + Math.round(r * 0.55), cy - Math.round(r * 0.1), 4, RED, true);
  cv.circle(cx - Math.round(r * 0.15), cy - Math.round(r * 0.45), 4, RED, true);
  cv.circle(cx - Math.round(r * 0.55), cy + Math.round(r * 0.25), 4, RED, true);
}

function leadStory(cv: Canvas, startY: number): number {
  let y = startY;
  drawText(cv, M, y, LEAD_KICKER, 2, RED);
  y += 30;
  for (const line of LEAD_HEAD) {
    drawText(cv, M, y, line, 5, INK);
    y += 42;
  }
  // Deck wraps beside the globe on the right.
  const deckEnd = drawPara(cv, M, y + 4, LEAD_DECK, 770, 2, INK, 5);
  globe(cv, 912, 252, 54);
  drawTextCentered(cv, 912, 320, "SHENZHEN", 2, GREY);
  drawTextCentered(cv, 912, 338, "KYIV  •  HAGUE", 2, GREY);
  const ruleY = Math.max(deckEnd, 352) + 10;
  cv.hline(M, ruleY, CW, INK, 2);
  return ruleY;
}

function storyBlock(
  cv: Canvas,
  x: number,
  y: number,
  w: number,
  kicker: string,
  head: string,
  body: string,
  headScale: number,
): number {
  drawText(cv, x, y, kicker, 2, RED);
  let yy = y + 28;
  for (const line of wrapText(head, w, headScale)) {
    drawText(cv, x, yy, line, headScale, INK);
    yy += 7 * headScale + 6;
  }
  yy = drawPara(cv, x, yy + 2, body, w, 2, INK, 5);
  return yy;
}

// The maths story as a full-width band under the two-column row.
function scienceBand(cv: Canvas, startY: number): number {
  let y = startY + 8;
  drawText(cv, M, y, STORY4_KICKER, 2, RED);
  y += 28;
  drawText(cv, M, y, STORY4_HEAD, 3, INK);
  y += 7 * 3 + 8;
  return drawPara(cv, M, y, STORY4_BODY, CW, 2, INK, 6);
}

function briefs(cv: Canvas, startY: number): number {
  let y = startY + 8;
  cv.hline(M, y, CW, INK, 2);
  let yy = y + 16;
  drawText(cv, M, yy, "ELSEWHERE TODAY", 3, INK);
  cv.hline(M + textWidth("ELSEWHERE TODAY", 3) + 16, yy + 10, CW - textWidth("ELSEWHERE TODAY", 3) - 16, RED, 2);
  yy += 38;
  // Two columns of briefs, four per column.
  const colW = Math.floor((CW - 32) / 2);
  const half = Math.ceil(BRIEFS.length / 2);
  const columns = [BRIEFS.slice(0, half), BRIEFS.slice(half)];
  let bottom = yy;
  for (let c = 0; c < 2; c++) {
    let cy = yy;
    const x = M + c * (colW + 32);
    for (const [place, text] of columns[c]) {
      cv.rect(x, cy + 3, 8, 8, RED);
      const full = place + " — " + text;
      cy = drawPara(cv, x + 16, cy, full, colW - 16, 2, INK, 4);
      cy += 6;
    }
    bottom = Math.max(bottom, cy);
  }
  return bottom;
}

function footer(cv: Canvas): void {
  cv.hline(M, 968, CW, INK, 2);
  drawTextCentered(
    cv,
    W / 2,
    982,
    "COMPILED FROM REPORTS FILED ON 21 NOVEMBER 2026  •  STORIES MAY DEVELOP",
    2,
    GREY,
  );
}

// ---- main ----

function main(): void {
  const cv = new Canvas(W, H);
  cv.fill(PAPER);
  // Faint frame around the page.
  cv.hline(M - 8, 18, CW + 16, FAINT, 1);
  cv.hline(M - 8, 967, CW + 16, FAINT, 1);
  cv.vline(M - 8, 18, 950, FAINT, 1);
  cv.vline(M + CW + 7, 18, 950, FAINT, 1);

  masthead(cv);
  const afterLead = leadStory(cv, 182);

  // Middle row: Ukraine on the left, The Hague on the right.
  const midY = afterLead + 16;
  const leftW = 560;
  const rightX = M + leftW + 32;
  const rightW = CW - leftW - 32;
  const leftEnd = storyBlock(cv, M, midY, leftW, STORY2_KICKER, STORY2_HEAD, STORY2_BODY, 4);
  cv.vline(rightX - 16, midY, 190, FAINT, 1);
  const rightEnd = storyBlock(cv, rightX, midY, rightW, STORY3_KICKER, STORY3_HEAD, STORY3_BODY, 3);
  const afterMid = Math.max(leftEnd, rightEnd);

  const afterBand = scienceBand(cv, afterMid);
  const afterBriefs = briefs(cv, afterBand + 2);
  void afterBriefs;

  footer(cv);

  // Write only the file itself; the output directory is the grader's mount
  // and must never be removed or recreated.
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", encodePng(cv));
}

main();
