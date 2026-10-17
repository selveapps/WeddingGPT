#!/usr/bin/env node
/**
 * Builds every icon asset from the shared artwork, so the icon is identical
 * everywhere it appears: store / home screen icon, Android adaptive icon,
 * web favicon and the Android notification icon. The app draws
 * the same tile with `<AppIcon />`.
 *
 * Sources: `src/features/mascot/appIconArt.js` (the tile) and
 * `src/features/mascot/swanArt.js` (the swan couple mascot).
 *
 *   npm run icons                 writes PNGs (and their SVG sources) to assets/
 *   npm run icons -- --sheet DIR  also writes a sheet of every mood to DIR
 *
 * Rendering uses a headless Chrome or Edge, so there are no image libraries to
 * install. Set CHROME_PATH if the browser is somewhere unusual.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
const work = mkdtempSync(join(tmpdir(), 'mascot-'));

// The art files are ES modules inside a CommonJS package, so load copies as .mjs.
const mascotDir = join(root, 'src/features/mascot');
for (const name of ['swanArt', 'appIconArt']) {
  const source = readFileSync(join(mascotDir, `${name}.js`), 'utf8').replace(/from '\.\/(\w+)'/g, "from './$1.mjs'");
  writeFileSync(join(work, `${name}.mjs`), source);
}
const { MASCOT_MOODS, swanArt } = await import(pathToFileURL(join(work, 'swanArt.mjs')).href);
const { appIconArt, appIconBackground, placedMascot } = await import(
  pathToFileURL(join(work, 'appIconArt.mjs')).href
);

// --- Node tree -> SVG text ---------------------------------------------------
const KEBAB = new Set([
  'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'stopColor', 'stopOpacity', 'fillOpacity', 'strokeOpacity',
]);
const attr = (name) => (KEBAB.has(name) ? name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`) : name);

function toSvg(node) {
  if (!node) return '';
  const [tag, attrs = {}, children = []] = node;
  const props = Object.entries(attrs)
    .filter(([key]) => key !== 'blink')
    .map(([key, value]) => `${attr(key)}="${value}"`)
    .join(' ');
  const inner = children.map(toSvg).join('');
  return `<${tag}${props ? ` ${props}` : ''}>${inner}</${tag}>`;
}

/** An SVG document of `size` px drawing `body` in the 1024 icon space. */
const svg = (size, body, viewBox = '0 0 1024 1024') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`;

/**
 * Android status-bar icon: Android draws it as a white silhouette and tints it,
 * so it is the two swans as flat white shapes - their necks still make the heart.
 */
const notificationIcon = `<g transform="translate(4 2) scale(0.74)">${toSvg(swanArt({ side: 'bride', mono: true }))}${toSvg(swanArt({ side: 'groom', mono: true }))}</g>`;

const files = {
  // Store / home screen icon: full bleed, no transparency (the OS rounds it).
  'icon.png': { size: 1024, svg: svg(1024, toSvg(appIconArt())) },
  // Android adaptive icon: the swans inside the 66% safe zone over the same tile.
  'adaptive-icon.png': { size: 1024, transparent: true, svg: svg(1024, toSvg(placedMascot({ scale: 0.62 }))) },
  'adaptive-icon-background.png': { size: 1024, svg: svg(1024, toSvg(appIconBackground())) },
  // Web favicon; Expo scales it down.
  'favicon.png': { size: 256, svg: svg(256, toSvg(appIconArt())) },
  'notification-icon.png': { size: 96, transparent: true, svg: svg(96, notificationIcon, '0 0 96 96') },
};

// --- Rendering -------------------------------------------------------------
function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.');
  return found;
}

const browser = findBrowser();

function render(name, { size, svg: markup, transparent = false }, outDir) {
  const html = join(work, `${name}.html`);
  writeFileSync(
    html,
    `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${markup}</body></html>`
  );
  const out = join(outDir, name);
  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${size},${size}`,
      ...(transparent ? ['--default-background-color=00000000'] : []),
      `--screenshot=${out}`,
      pathToFileURL(html).href,
    ],
    { stdio: 'ignore' }
  );
  return out;
}

mkdirSync(join(assets, 'source'), { recursive: true });
for (const [name, spec] of Object.entries(files)) {
  writeFileSync(join(assets, 'source', name.replace('.png', '.svg')), spec.svg);
  render(name, spec, assets);
  console.log(`assets/${name}`);
}

// Optional: a sheet of every mood, for reviewing the character.
const sheetIndex = process.argv.indexOf('--sheet');
if (sheetIndex !== -1) {
  const dir = resolve(process.argv[sheetIndex + 1] ?? '.');
  mkdirSync(dir, { recursive: true });
  const cell = 240;
  const body = MASCOT_MOODS.map(
    (mood, i) => `<g transform="translate(${i * cell} 0) scale(${cell / 1024})">${toSvg(placedMascot({ mood, scale: 0.9 }))}</g>`
  ).join('');
  const width = cell * MASCOT_MOODS.length;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cell}" viewBox="0 0 ${width} ${cell}"><rect width="${width}" height="${cell}" fill="#FFFBF8"/>${body}</svg>`;
  const html = join(work, 'sheet.html');
  writeFileSync(html, `<!doctype html><html><body style="margin:0">${markup}</body></html>`);
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${width},${cell}`, `--screenshot=${join(dir, 'mascot-moods.png')}`, pathToFileURL(html).href], { stdio: 'ignore' });
  console.log(join(dir, 'mascot-moods.png'));
}

rmSync(work, { recursive: true, force: true });
