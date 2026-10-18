// Creates admin/seed/content.json from the public site's bundled content.
// Run it again any time you want to reset the starting content:  npm run seed   (inside /admin)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { menuItems, pairings, roasts } from '../../src/js/data/menu.js';
import { faqs, galleryItems, testimonials, timeline, values, team, origins, defaultSettings } from '../../src/js/data/content.js';
import { sanitizeContent } from '../public/schema.js';

const raw = { menu: menuItems, pairings, roasts, gallery: galleryItems, faqs, testimonials, timeline, values, team, origins, settings: defaultSettings };
const { content, errors } = sanitizeContent(raw);
if (errors.length) {
  console.error('Seed content failed validation:\n - ' + errors.join('\n - '));
  process.exit(1);
}
const file = fileURLToPath(new URL('../seed/content.json', import.meta.url));
writeFileSync(file, JSON.stringify(content, null, 2) + '\n');
console.log(`Seed written: ${file}`);
console.log(Object.entries(content).map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.length + ' items' : 'settings'}`).join('\n'));
