// Copies the web app (../static) into www/ for Capacitor, and writes the API base
// URL the bundled app should talk to. Set API_BASE env at build time, e.g.:
//   API_BASE=https://landing-pack.onrender.com node copy-web.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'static');
const DST = path.join(__dirname, 'www');

if (!fs.existsSync(SRC)) {
  console.error('Source static/ not found at', SRC);
  process.exit(1);
}
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });

// Inject API base so the bundled app calls YOUR backend, not localhost.
const apiBase = process.env.API_BASE || 'http://localhost:8000';
const cfg = `window.API_BASE = ${JSON.stringify(apiBase)};\n`;
fs.writeFileSync(path.join(DST, 'api-base.js'), cfg);

// Make index.html load api-base.js BEFORE app.js.
const idxPath = path.join(DST, 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');
if (!html.includes('api-base.js')) {
  html = html.replace('<script src="/static/app.js?v=6"></script>',
                       '<script src="api-base.js"></script>\n  <script src="/static/app.js?v=6"></script>');
  fs.writeFileSync(idxPath, html);
}
console.log('Web assets copied to www/ with API_BASE =', apiBase);
