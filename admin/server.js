// MY.CAFÉ admin server
//   • serves the admin UI            (admin/public)
//   • GET  /api/content              PUBLIC read-only content for the website (CORS-enabled)
//   • POST /api/login                password -> short-lived signed token
//   • GET/PUT /api/admin/content     read / save everything (auth required)
//   • POST /api/admin/upload         upload a gallery / menu image (auth required)
//   • GET  /uploads/<file>           uploaded images
//
// Configuration (environment variables) — see README.md in this folder:
//   ADMIN_PASSWORD   password for the admin panel         (default "admin123" — fine on localhost, CHANGE IT before going live)
//   SESSION_SECRET   secret used to sign login tokens     (default: random, saved in the data folder)
//   PORT             port to listen on                    (default 4000)
//   DATA_DIR         where content + uploads are stored   (default ./data — mount a persistent disk here when hosting)
//   ALLOWED_ORIGINS  comma-separated sites allowed to read /api/content, or *   (default *)
//   PUBLIC_URL       public address of THIS server, used to build image links   (default: taken from the request)
//   SITE_URL         address of the public website, shows a "View site" link in the admin
//   TRUST_PROXY      set to 1 when running behind a proxy (Render, Railway, Nginx…)
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeContent } from './public/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Settings can live in admin/.env (copy .env.example). Real environment variables always win over the file.
if (typeof process.loadEnvFile === 'function' && existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
const PORT = Number(process.env.PORT) || 4000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const SEED_FILE = path.join(__dirname, 'seed', 'content.json');
const MAX_UPLOAD = 6 * 1024 * 1024; // 6 MB
const TOKEN_TTL = 12 * 60 * 60 * 1000; // 12 hours
const KEEP_BACKUPS = 20;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const usingDefaultPassword = process.env.ADMIN_PASSWORD === undefined;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);

for (const dir of [DATA_DIR, UPLOAD_DIR, BACKUP_DIR]) mkdirSync(dir, { recursive: true });

/* ---------- Secret for signing tokens ---------- */
async function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(DATA_DIR, '.session-secret');
  try {
    return (await fs.readFile(file, 'utf8')).trim();
  } catch {
    const secret = crypto.randomBytes(32).toString('hex');
    await fs.writeFile(file, secret, { mode: 0o600 });
    return secret;
  }
}
const SECRET = await loadSecret();

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

function makeToken() {
  const payload = String(Date.now() + TOKEN_TTL);
  return `${payload}.${sign(payload)}`;
}
function tokenValid(token) {
  if (typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sig.length !== sign(payload).length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) return false;
  return Number(payload) > Date.now();
}

/* ---------- Content storage ---------- */
// File format: { rev, updatedAt, content }. `rev` stops two browser tabs overwriting each other.
async function readStore() {
  try {
    return JSON.parse(await fs.readFile(CONTENT_FILE, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    const seed = JSON.parse(await fs.readFile(SEED_FILE, 'utf8'));
    const store = { rev: 1, updatedAt: new Date().toISOString(), content: seed };
    await writeStore(store, { backup: false });
    return store;
  }
}

async function writeStore(store, { backup = true } = {}) {
  if (backup && existsSync(CONTENT_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp}.json`));
    const old = (await fs.readdir(BACKUP_DIR)).filter((f) => f.startsWith('content-')).sort().reverse().slice(KEEP_BACKUPS);
    await Promise.all(old.map((f) => fs.unlink(path.join(BACKUP_DIR, f)).catch(() => {})));
  }
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, CONTENT_FILE); // atomic: readers never see a half-written file
}

/** Removes uploaded files no longer referenced anywhere (only if older than a day, so in-progress edits are safe). */
async function pruneUploads(content) {
  const used = new Set(JSON.stringify(content).match(/\/uploads\/[A-Za-z0-9._-]+/g)?.map((u) => u.slice('/uploads/'.length)) ?? []);
  for (const file of await fs.readdir(UPLOAD_DIR)) {
    if (used.has(file)) continue;
    const stat = await fs.stat(path.join(UPLOAD_DIR, file));
    if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) await fs.unlink(path.join(UPLOAD_DIR, file)).catch(() => {});
  }
}

/** For the PUBLIC endpoint: turn "/uploads/x.jpg" into a full address the other website can load. */
function absolutize(content, base) {
  const fix = (v) => (typeof v === 'string' && v.startsWith('/uploads/') ? base + v : v);
  return {
    ...content,
    menu: content.menu.map((m) => ({ ...m, image: fix(m.image) })),
    gallery: content.gallery.map((g) => ({ ...g, src: fix(g.src) })),
  };
}

/* ---------- App ---------- */
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.json({ limit: '1mb' }));

const baseUrl = (req) => (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

/* --- public API --- */
const publicCors = cors({
  origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
  methods: ['GET'],
  maxAge: 600,
});
app.get('/api/content', publicCors, async (req, res, next) => {
  try {
    const { content, updatedAt } = await readStore();
    res.setHeader('Cache-Control', 'no-cache');
    res.json({ ...absolutize(content, baseUrl(req)), updatedAt });
  } catch (err) {
    next(err);
  }
});

// The "you are using the default password" banner only matters when the admin is reachable by others — not on localhost
const isLocalHost = (req) => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(req.hostname);
app.get('/api/config', (req, res) => res.json({ siteUrl: process.env.SITE_URL || '', defaultPassword: usingDefaultPassword && !isLocalHost(req) }));

/* --- login (rate limited) --- */
const attempts = new Map();
function limited(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) {
    attempts.set(ip, { count: 0, reset: now + 15 * 60 * 1000 });
    return false;
  }
  return rec.count >= 8;
}
app.post('/api/login', (req, res) => {
  const ip = req.ip;
  if (limited(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const ok = typeof req.body?.password === 'string' && safeEqual(req.body.password, ADMIN_PASSWORD);
  if (!ok) {
    attempts.get(ip).count++;
    return res.status(401).json({ error: 'Wrong password.' });
  }
  attempts.delete(ip);
  res.json({ token: makeToken(), expiresIn: TOKEN_TTL });
});

/* --- admin API (auth required) --- */
const admin = express.Router();
admin.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tokenValid(token)) return res.status(401).json({ error: 'Please log in again.' });
  next();
});

admin.get('/content', async (_req, res, next) => {
  try {
    const { rev, updatedAt, content } = await readStore();
    res.json({ rev, updatedAt, content });
  } catch (err) {
    next(err);
  }
});

admin.put('/content', async (req, res, next) => {
  try {
    const store = await readStore();
    if (req.body?.rev !== store.rev) {
      return res.status(409).json({ error: 'The content was changed somewhere else. Reload the page to get the latest version.' });
    }
    const { content, errors } = sanitizeContent(req.body.content);
    if (errors.length) return res.status(422).json({ error: 'Some fields need attention.', errors });
    const next_ = { rev: store.rev + 1, updatedAt: new Date().toISOString(), content };
    await writeStore(next_);
    pruneUploads(content).catch(() => {});
    res.json({ rev: next_.rev, updatedAt: next_.updatedAt, content });
  } catch (err) {
    next(err);
  }
});

/* --- uploads --- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD, files: 1 } });
const SIGNATURES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'gif', test: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { ext: 'avif', test: (b) => b.subarray(4, 12).toString('latin1') === 'ftypavif' },
];
admin.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received.' });
    // Never trust the browser's file name or MIME type — check the real file signature
    const kind = SIGNATURES.find((s) => s.test(req.file.buffer));
    if (!kind) return res.status(415).json({ error: 'Only JPG, PNG, WebP, GIF or AVIF images are allowed.' });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${kind.ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), req.file.buffer);
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (err) {
    next(err);
  }
});
app.use('/api/admin', admin);

/* --- uploaded images (public) --- */
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    maxAge: '30d',
    immutable: true,
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

/* --- admin UI --- */
const CSP = [
  "default-src 'self'",
  "img-src 'self' https: data: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "script-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join('; ');
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', CSP);
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

/* --- errors --- */
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `That file is too large (max ${MAX_UPLOAD / 1024 / 1024} MB).` : 'Upload failed.';
    return res.status(413).json({ error: msg });
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

await readStore(); // creates content.json from the seed on first run
const server = app.listen(PORT, () => {
  console.log(`\n  MY.CAFÉ admin  →  http://localhost:${PORT}`);
  console.log(`  Public content →  http://localhost:${PORT}/api/content`);
  console.log(`  Data folder    →  ${DATA_DIR}`);
  if (usingDefaultPassword) console.log('\n  Login password: admin123  (default — change it with ADMIN_PASSWORD in admin/.env; required before hosting online)\n');
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`\n  Port ${PORT} is already in use — is another admin server still running? Close it, or set a different PORT in admin/.env.\n`);
  else console.error(err);
  process.exit(1);
});
