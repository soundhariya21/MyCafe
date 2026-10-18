// `npm run dev:all` — starts the website AND the admin panel together on localhost.
//
//   website  → http://localhost:5173
//   admin    → http://localhost:4000      (login password: admin123, unless you set one in admin/.env)
//
// The first run also installs the admin's own dependencies. Press Ctrl+C once to stop both.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminDir = path.join(root, 'admin');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const c = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', gold: '\x1b[33m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m' };
const say = (msg = '') => console.log(msg);

/* ---------- 0. sanity checks ---------- */
if (!existsSync(viteBin)) {
  say(`${c.red}The website's packages are not installed yet.${c.reset} Run  ${c.bold}npm install${c.reset}  in this folder first, then try again.`);
  process.exit(1);
}

/* ---------- 1. admin dependencies (first run only) ---------- */
if (!existsSync(path.join(adminDir, 'node_modules', 'express'))) {
  say(`${c.gold}First run:${c.reset} installing the admin panel's packages (this takes a few seconds)…\n`);
  const install = spawnSync('npm install', { cwd: adminDir, stdio: 'inherit', shell: true });
  if (install.status !== 0) {
    say(`\n${c.red}Could not install the admin packages.${c.reset} Try:  cd admin  &&  npm install`);
    process.exit(1);
  }
  say();
}

/* ---------- 2. start both servers ---------- */
const children = [];
let stopping = false;

function run(name, color, args, options = {}) {
  const child = spawn(process.execPath, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, FORCE_COLOR: '1', ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tag = `${color}${c.bold}${name.padEnd(7)}${c.reset}${c.dim}│${c.reset} `;
  let portBusy = false;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (/EADDRINUSE|address already in use/i.test(line)) portBusy = true;
        if (line.trim()) out(tag + line);
      }
    });
  };
  pipe(child.stdout, console.log);
  pipe(child.stderr, console.error);
  child.on('exit', (code) => {
    if (stopping) return;
    say(`\n${c.red}${name} stopped (exit code ${code}).${c.reset}`);
    if (portBusy && options.busyHint) say(options.busyHint);
    stopAll(code ?? 1);
  });
  children.push(child);
  return child;
}

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => (say(`\n${c.dim}Stopping website and admin…${c.reset}`), stopAll(0)));
process.on('SIGTERM', () => stopAll(0));

say(`\n${c.gold}${c.bold}  MY.CAFÉ — local development${c.reset}\n`);

run('admin', c.cyan, ['server.js'], {
  cwd: adminDir,
  env: { SITE_URL: process.env.SITE_URL ?? 'http://localhost:5173' },
  busyHint: `${c.gold}Port 4000 is already in use${c.reset} — probably an admin server that is still running from earlier. Close it (or its terminal) and run this again.`,
});
run('site', c.gold, [viteBin], {
  busyHint: `${c.gold}Port 5173 is already in use${c.reset} — probably the website is still running from earlier. Close it and run this again.`,
});

setTimeout(() => {
  if (stopping) return;
  say(`
  ${c.green}${c.bold}Ready.${c.reset}
    Website  →  ${c.bold}http://localhost:5173${c.reset}
    Admin    →  ${c.bold}http://localhost:4000${c.reset}   ${c.dim}(password: admin123 — change it in admin/.env)${c.reset}

  ${c.dim}Edit something in the admin, press "Publish changes", then refresh the website.
  Press Ctrl+C to stop both.${c.reset}
`);
}, 2500);
