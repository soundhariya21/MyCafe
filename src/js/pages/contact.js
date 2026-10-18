// Contact page: live "open now" status, reservation form validation + success state.
import { gsap } from 'gsap';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { toast } from '../components/toast.js';
import { loadContent } from '../data/remote.js';
import { formatTime, toDecimal } from '../site-settings.js';

// Café hours by weekday (0 = Sunday) in 24h decimals; null = closed. Replaced by the admin-managed hours on load.
let HOURS = { 0: [7, 22], 1: null, 2: [7, 22], 3: [7, 22], 4: [7, 22], 5: [7, 22], 6: [7, 22] };
const SLOT_STEP = 0.5;

/** "Now" in the café's own timezone, whatever the visitor's locale. */
function nowInCafe() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return { day: d.getDay(), hour: d.getHours() + d.getMinutes() / 60 };
}

const fmt = (h) => {
  const hh = Math.floor(h);
  const mm = h % 1 ? '30' : '00';
  const suffix = hh >= 12 ? 'PM' : 'AM';
  return `${((hh + 11) % 12) + 1}:${mm} ${suffix}`;
};

const DAY_ROWS = [
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
  [0, 'Sunday'],
  [1, 'Monday'],
];

/** Admin settings -> { weekday: [open, close] | null } and a rebuilt hours table. */
function applyHours(hours) {
  HOURS = Object.fromEntries(DAY_ROWS.map(([n]) => [n, !hours[n] || hours[n].closed ? null : [toDecimal(hours[n].open), toDecimal(hours[n].close)]]));
  const body = $('[data-hours] tbody');
  if (!body) return;
  body.replaceChildren(
    ...DAY_ROWS.map(([n, label]) => {
      const row = document.createElement('tr');
      row.dataset.day = n;
      const th = document.createElement('th');
      th.textContent = label;
      const td = document.createElement('td');
      if (HOURS[n]) td.textContent = `${formatTime(hours[n].open, { short: false })} – ${formatTime(hours[n].close, { short: false })}`;
      else {
        td.textContent = 'Closed';
        row.classList.add('is-closed');
      }
      row.append(th, td);
      return row;
    })
  );
}

export async function init() {
  applyHours((await loadContent()).settings.hours);
  initOpenStatus();
  initForm();
  return null;
}

/* ---------- Open / closed indicator + highlight today's row ---------- */
function initOpenStatus() {
  const badge = $('[data-open-status]');
  const { day, hour } = nowInCafe();
  const today = HOURS[day];
  $(`[data-hours] tr[data-day="${day}"]`)?.classList.add('is-today');

  const open = today && hour >= today[0] && hour < today[1];
  badge.classList.toggle('is-open', !!open);
  $('span', badge).textContent = open
    ? `Open now · until ${fmt(today[1])}`
    : today && hour < today[0]
      ? `Closed · opens ${fmt(today[0])}`
      : 'Closed right now';
}

/* ---------- Reservation form ---------- */
function initForm() {
  const form = $('[data-reserve-form]');
  const done = $('[data-reserve-done]');
  const dateInput = $('[data-date]', form);
  const timeSelect = $('[data-time]', form);

  // Dates: today (IST) onward, never Monday
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  dateInput.min = iso(today);
  const max = new Date(today);
  max.setDate(max.getDate() + 90);
  dateInput.max = iso(max);

  // Time slots depend on the weekday chosen
  function fillSlots() {
    const value = dateInput.value;
    const previous = timeSelect.value;
    timeSelect.innerHTML = '<option value="">Select…</option>';
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    const hours = HOURS[weekday];
    if (!hours) {
      timeSelect.innerHTML = '<option value="">Closed that day</option>';
      return;
    }
    const isToday = value === iso(today);
    const nowH = today.getHours() + today.getMinutes() / 60;
    for (let h = hours[0]; h <= hours[1] - 1; h += SLOT_STEP) {
      if (isToday && h <= nowH + 0.5) continue;
      timeSelect.add(new Option(fmt(h), fmt(h)));
    }
    if (timeSelect.options.length === 1) timeSelect.innerHTML = '<option value="">No slots left today</option>';
    if ([...timeSelect.options].some((o) => o.value === previous)) timeSelect.value = previous;
  }
  dateInput.addEventListener('change', fillSlots);

  // ---- validation ----
  const validators = {
    name: (v) => (v.trim().length < 2 ? 'Please tell us your name.' : ''),
    phone: (v) => (/^[+\d][\d\s()-]{7,}$/.test(v.trim()) ? '' : 'Enter a valid phone number.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
    date: (v) => {
      if (!v) return 'Pick a date.';
      const [y, m, d] = v.split('-').map(Number);
      if (new Date(y, m - 1, d).getDay() === 1) return 'We are closed on Mondays.';
      return '';
    },
    time: (v) => (v ? '' : 'Choose a time.'),
  };

  function check(name) {
    const input = form.elements[name];
    const message = validators[name](input.value);
    input.classList.toggle('is-invalid', !!message);
    input.setAttribute('aria-invalid', String(!!message));
    $(`[data-error-for="${name}"]`, form).textContent = message;
    return !message;
  }

  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => input.value && check(name));
    input.addEventListener('input', () => input.classList.contains('is-invalid') && check(name));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = Object.keys(validators).map(check);
    if (results.includes(false)) {
      const firstBad = $('.is-invalid', form);
      firstBad?.focus();
      if (!reducedMotion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' });
      toast('Please fix the highlighted fields.', 'error');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    // No backend yet — this is where you would POST `data` to your API / Formspree / Google Sheet.
    // See the README section "Connecting the reservation form".
    showSuccess(data);
  });

  function showSuccess(data) {
    const nice = new Date(`${data.date}T00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    $('[data-done-text]', done).textContent = `Thank you, ${data.name.trim().split(' ')[0]}. We have saved your table — a confirmation will be sent to ${data.email}.`;
    $('[data-done-summary]', done).innerHTML = [
      ['When', `${nice} · ${data.time}`],
      ['Guests', data.guests],
      ['Seating', data.seating],
      ['Phone', data.phone],
    ]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
      .join('');

    toast('Reservation requested — see you soon! ☕');
    swap(form, done);

    // Draw the check mark
    if (!reducedMotion) {
      const circle = $('[data-check-circle]', done);
      const mark = $('[data-check-mark]', done);
      [circle, mark].forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap
        .timeline({ delay: 0.3 })
        .to(circle, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' })
        .to(mark, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.15');
    }
  }

  $('[data-reserve-again]', done).addEventListener('click', () => {
    form.reset();
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    $$('[data-error-for]', form).forEach((el) => (el.textContent = ''));
    timeSelect.innerHTML = '<option value="">Select…</option>';
    swap(done, form);
  });

  function swap(from, to) {
    if (reducedMotion) {
      from.hidden = true;
      to.hidden = false;
      return;
    }
    gsap.to(from, {
      opacity: 0,
      y: -16,
      duration: 0.3,
      onComplete: () => {
        from.hidden = true;
        to.hidden = false;
        gsap.fromTo(to, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      },
    });
  }
}
