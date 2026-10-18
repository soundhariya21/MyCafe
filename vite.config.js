import { defineConfig } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = import.meta.dirname;
const partialsDir = resolve(root, 'src/partials');

/**
 * Tiny HTML partials plugin.
 * Replaces <!--@include name--> with the contents of src/partials/name.html,
 * so the navbar / footer / <head> boilerplate are written once and shared by every page.
 */
function htmlPartials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/<!--@include\s+([\w-]+)\s*-->/g, (_, name) =>
          readFileSync(resolve(partialsDir, `${name}.html`), 'utf-8')
        ),
    },
    // Reload the browser when a partial changes during `npm run dev`
    handleHotUpdate({ file, server }) {
      if (file.startsWith(partialsDir)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

// Every *.html file in the project root becomes its own page in the build.
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace('.html', ''), resolve(root, file)])
);

export default defineConfig({
  base: './',
  plugins: [htmlPartials(), react(), tailwindcss()],
  resolve: { alias: { '@': resolve(root, 'src') } },
  server: { open: true },
  build: {
    rollupOptions: { input: pages },
  },
});
