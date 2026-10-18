// Home page: hero entrance, featured dishes, pinned "bean to cup" scroller, testimonial carousel.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { loadContent } from '../data/remote.js';
import { dishCard } from '../components/dish-card.js';
import { splitReveal } from '../animations/reveal.js';

export async function init() {
  const content = await loadContent();
  renderFeatured(content.menu);
  initProcess();
  initTestimonials(content.testimonials);
  const enter = initHero();
  initFloaters();
  return enter;
}

/* ---------- Hero ---------- */
function initHero() {
  const hero = $('.hero');
  const items = $$('[data-hero-in]');
  const card = $('.hero__card');
  const ring = $('[data-ring]');
  const title = $('.hero__title');
  if (reducedMotion) return null;

  const titleTween = splitReveal(title, { scroll: false });
  gsap.set(items, { opacity: 0, y: 30 });
  gsap.set(card, { opacity: 0, y: 70, scale: 0.94 });
  gsap.set(ring, { opacity: 0, scale: 0.6 });

  // Rotating text ring + slow scroll parallax on the visual
  gsap.to(ring, { rotation: 360, duration: 26, repeat: -1, ease: 'none' });
  gsap.to('[data-hero-visual]', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });

  return () => {
    titleTween?.play();
    gsap.to(items, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, delay: 0.35, ease: 'power3.out' });
    gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 1.3, delay: 0.15, ease: 'power4.out' });
    gsap.to(ring, { opacity: 1, scale: 1, duration: 1.2, delay: 0.9, ease: 'back.out(1.6)' });
    gsap.from('.float-badge', { opacity: 0, scale: 0.7, y: 20, duration: 0.8, stagger: 0.2, delay: 1, ease: 'back.out(2)' });
  };
}

/** Gently bobbing badges. */
function initFloaters() {
  if (reducedMotion) return;
  $$('[data-float]').forEach((el, i) => {
    gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.6 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });
}

/* ---------- Featured dishes ---------- */
function renderFeatured(menuItems) {
  const grid = $('[data-featured]');
  if (!grid) return;
  // Items ticked “Show on Home page” in the admin; if none are ticked, show the first four dishes
  const featured = menuItems.filter((i) => i.featured);
  grid.innerHTML = (featured.length ? featured : menuItems.slice(0, 4)).map(dishCard).join('');
  grid.setAttribute('data-stagger', 'up');
}

/* ---------- Process: pinned horizontal scroll on desktop, stacked cards on mobile ---------- */
function initProcess() {
  const section = $('[data-process]');
  const track = $('[data-process-track]');
  const bar = $('[data-process-bar]');
  if (!section || !track || reducedMotion) return;

  const mm = gsap.matchMedia();

  mm.add('(min-width: 961px)', () => {
    const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
  });

  mm.add('(max-width: 960px)', () => {
    $$('.process__panel', track).forEach((panel) => {
      gsap.from(panel, { opacity: 0, y: 60, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 88%', once: true } });
    });
  });
}

/* ---------- Testimonials carousel ---------- */
function initTestimonials(testimonials) {
  const root = $('[data-testimonials]');
  if (!root) return;
  if (!testimonials.length) {
    root.closest('section')?.remove(); // no testimonials -> hide the whole section
    return;
  }
  const stage = $('[data-t-stage]', root);
  const dotsWrap = $('[data-t-dots]', root);

  stage.innerHTML = testimonials
    .map(
      (t, i) => `
      <figure class="t-slide" data-index="${i}" ${i ? 'aria-hidden="true"' : ''}>
        <span class="t-slide__mark" aria-hidden="true">“</span>
        <blockquote>${escapeHtml(t.quote)}</blockquote>
        <figcaption>
          <span class="avatar">${escapeHtml(t.name[0])}</span>
          <span><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.role)}</small></span>
        </figcaption>
      </figure>`
    )
    .join('');
  dotsWrap.innerHTML = testimonials.map((_, i) => `<button type="button" aria-label="Show testimonial ${i + 1}" class="dot${i ? '' : ' is-active'}"></button>`).join('');

  const slides = $$('.t-slide', stage);
  const dots = $$('.dot', dotsWrap);
  let current = 0;
  let timer;

  gsap.set(slides, { autoAlpha: 0 });
  gsap.set(slides[0], { autoAlpha: 1 });

  function go(next, dir = 1) {
    next = (next + slides.length) % slides.length;
    if (next === current) return;
    const from = slides[current];
    const to = slides[next];
    dots[current].classList.remove('is-active');
    dots[next].classList.add('is-active');
    from.setAttribute('aria-hidden', 'true');
    to.removeAttribute('aria-hidden');

    if (reducedMotion) {
      gsap.set(from, { autoAlpha: 0 });
      gsap.set(to, { autoAlpha: 1 });
    } else {
      gsap.to(from, { autoAlpha: 0, x: -60 * dir, duration: 0.5, ease: 'power2.in' });
      gsap.fromTo(to, { autoAlpha: 0, x: 60 * dir }, { autoAlpha: 1, x: 0, duration: 0.8, delay: 0.25, ease: 'power3.out' });
    }
    current = next;
  }

  const play = () => {
    if (reducedMotion) return;
    stop();
    timer = setInterval(() => go(current + 1), 7000);
  };
  const stop = () => clearInterval(timer);

  $('[data-t-next]', root).addEventListener('click', () => (go(current + 1, 1), play()));
  $('[data-t-prev]', root).addEventListener('click', () => (go(current - 1, -1), play()));
  dots.forEach((dot, i) => dot.addEventListener('click', () => (go(i, i > current ? 1 : -1), play())));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);

  // Only autoplay while visible
  ScrollTrigger.create({ trigger: root, start: 'top 90%', end: 'bottom 10%', onToggle: (self) => (self.isActive ? play() : stop()) });
}
