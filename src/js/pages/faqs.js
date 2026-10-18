// FAQs page: GSAP accordion + category tabs + live search.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { faqCategories } from '../data/content.js';
import { loadContent } from '../data/remote.js';

export async function init() {
  const { faqs } = await loadContent();
  const list = $('[data-faq-list]');
  const cats = $('[data-faq-cats]');
  const search = $('[data-faq-search]');
  const count = $('[data-faq-count]');
  const empty = $('[data-faq-empty]');

  list.innerHTML = faqs
    .map(
      (f, i) => `
      <article class="faq card" data-cat="${f.category}" data-text="${escapeHtml((f.q + ' ' + f.a).toLowerCase())}">
        <h3>
          <button type="button" class="faq__q" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
            <span>${escapeHtml(f.q)}</span>
            <span class="faq__icon" aria-hidden="true"><i></i><i></i></span>
          </button>
        </h3>
        <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><p>${escapeHtml(f.a)}</p></div>
      </article>`
    )
    .join('');
  list.setAttribute('data-stagger', 'up');
  list.setAttribute('data-stagger-amount', '0.06');

  cats.innerHTML = faqCategories
    .map((c, i) => `<button type="button" role="tab" class="chip${i ? '' : ' is-active'}" data-cat="${c.id}" aria-selected="${i === 0}">${c.label}</button>`)
    .join('');

  const items = $$('.faq', list);
  let category = 'all';
  let query = '';

  // ---- accordion ----
  const panels = new Map(items.map((item) => [item, $('.faq__a', item)]));
  gsap.set([...panels.values()], { height: 0 });

  function setOpen(item, open) {
    const btn = $('.faq__q', item);
    const panel = panels.get(item);
    if (btn.getAttribute('aria-expanded') === String(open)) return;
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    gsap.to(panel, {
      height: open ? 'auto' : 0,
      duration: reducedMotion ? 0 : 0.5,
      ease: 'power3.inOut',
      onComplete: () => open && ScrollTrigger.refresh(),
    });
    if (open && !reducedMotion) gsap.fromTo($('p', panel), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.1 });
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq__q');
    if (!btn) return;
    const item = btn.closest('.faq');
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    items.forEach((other) => other !== item && setOpen(other, false));
    setOpen(item, willOpen);
  });

  // ---- filter ----
  function apply() {
    let visible = 0;
    items.forEach((item) => {
      const show = (category === 'all' || item.dataset.cat === category) && (!query || item.dataset.text.includes(query));
      item.hidden = !show;
      if (!show) setOpen(item, false);
      else visible++;
    });
    empty.hidden = visible > 0;
    count.textContent = `${visible} ${visible === 1 ? 'answer' : 'answers'}`;
    if (!reducedMotion) {
      gsap.fromTo(items.filter((i) => !i.hidden), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', overwrite: true });
    }
    ScrollTrigger.refresh();
  }

  cats.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    category = btn.dataset.cat;
    $$('.chip', cats).forEach((c) => {
      c.classList.toggle('is-active', c === btn);
      c.setAttribute('aria-selected', String(c === btn));
    });
    apply();
  });

  let debounce;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = search.value.trim().toLowerCase();
      apply();
    }, 180);
  });

  count.textContent = `${items.length} answers`;
  // open the first question by default so the page doesn't look empty
  if (items[0]) requestAnimationFrame(() => setOpen(items[0], true));
  return null;
}
