// Fills every element marked  data-bind="..."  with contact details from the admin-managed settings.
//   data-bind="address"        multi-line address text
//   data-bind="phone"          phone number (+ tel: link when the element is an <a>)
//   data-bind="email"          email (+ mailto: link when the element is an <a>)
//   data-bind="hours-summary"  e.g. "Tue – Sun · 7 AM – 10 PM"
//   data-bind="closed-note"    e.g. "Mondays: closed for roasting"  (hidden when empty)
// The HTML keeps sensible default text, so the page is correct even before / without the server.
import { $$ } from './utils.js';

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first, for building ranges like "Tue – Sun"
const NAMES = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

/** '07:30' -> '7:30 AM',  '22:00' -> '10 PM' */
export function formatTime(t, { short = true } = {}) {
  const [hh, mm] = t.split(':').map(Number);
  const hour = ((hh + 11) % 12) + 1;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  return mm || !short ? `${hour}:${String(mm).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

/** '07:30' -> 7.5 */
export const toDecimal = (t) => {
  const [hh, mm] = t.split(':').map(Number);
  return hh + mm / 60;
};

export function hoursSummary(hours) {
  const open = WEEK.filter((n) => hours[n] && !hours[n].closed);
  if (!open.length) return 'Currently closed';

  // group consecutive open days into ranges
  const runs = [];
  for (const n of open) {
    const last = runs.at(-1);
    if (last && WEEK.indexOf(n) === WEEK.indexOf(last.at(-1)) + 1) last.push(n);
    else runs.push([n]);
  }
  const days = runs.length === 1 && runs[0].length === 7 ? 'Every day' : runs.map((r) => (r.length === 1 ? NAMES[r[0]] : `${NAMES[r[0]]} – ${NAMES[r.at(-1)]}`)).join(', ');

  const same = open.every((n) => hours[n].open === hours[open[0]].open && hours[n].close === hours[open[0]].close);
  return same ? `${days} · ${formatTime(hours[open[0]].open)} – ${formatTime(hours[open[0]].close)}` : `${days} · hours vary`;
}

export function applySettings(settings) {
  $$('[data-bind]').forEach((el) => {
    switch (el.dataset.bind) {
      case 'address':
        el.textContent = settings.address;
        break;
      case 'phone':
        el.textContent = settings.phone;
        if (el.tagName === 'A') el.href = `tel:${settings.phone.replace(/[^\d+]/g, '')}`;
        break;
      case 'email':
        el.textContent = settings.email;
        if (el.tagName === 'A') el.href = `mailto:${settings.email}`;
        break;
      case 'hours-summary':
        el.textContent = hoursSummary(settings.hours);
        break;
      case 'closed-note':
        el.textContent = settings.closedNote;
        el.hidden = !settings.closedNote;
        break;
    }
  });
}
