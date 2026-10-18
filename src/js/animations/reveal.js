// Reusable scroll animations, driven purely by data-attributes in the HTML:
//
//   data-reveal="up|down|left|right|scale|fade"   fade/slide element in when scrolled into view
//   data-delay="0.2"                              optional extra delay (seconds)
//   data-stagger                                  its direct children reveal one after another
//   data-split="lines|words|chars"                SplitText heading reveal (masked lines by default)
//   data-parallax="12"                            image parallax inside an overflow:hidden wrapper
//   data-count="4.9" data-decimals="1" data-suffix="★" data-prefix=""   animated number counter
//   data-marquee data-speed="60"                  infinite text marquee that reacts to scroll direction
//   data-scroll-row="-1|1"                        row that slides sideways while scrolling past
//
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { $$, reducedMotion } from '../utils.js';

const FROM = {
  up: { y: 50 },
  down: { y: -50 },
  left: { x: -60 },
  right: { x: 60 },
  scale: { scale: 0.88, y: 30 },
  fade: {},
};

/**
 * Heading split into masked lines + words.
 * With { scroll: false } the animation waits until you call handle.play() (used by the hero intro).
 * SplitText splits asynchronously (after fonts load), so the handle remembers an early play() call.
 */
export function splitReveal(el, { type = 'lines', scroll = true, delay = 0 } = {}) {
  if (reducedMotion) return null;
  const handle = {
    tween: null,
    started: scroll,
    play() {
      this.started = true;
      this.tween?.play();
    },
  };
  SplitText.create(el, {
    type: type === 'chars' ? 'lines,words,chars' : 'lines,words',
    mask: 'lines',
    linesClass: 'sl',
    wordsClass: 'sw',
    charsClass: 'sc',
    autoSplit: true,
    onSplit(self) {
      handle.tween = gsap.from(type === 'chars' ? self.chars : self.words, {
        yPercent: 115,
        rotate: type === 'chars' ? 6 : 0,
        duration: 1,
        delay,
        ease: 'power4.out',
        stagger: type === 'chars' ? 0.025 : 0.045,
        paused: !handle.started,
        scrollTrigger: scroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
      });
      return handle.tween;
    },
  });
  return handle;
}

function initSplit() {
  $$('[data-split]').forEach((el) => {
    if (el.hasAttribute('data-split-manual')) return;
    splitReveal(el, { type: el.dataset.split || 'lines', delay: Number(el.dataset.delay || 0) });
  });
}

function initReveals() {
  // 1. Individual elements, batched so neighbours stagger naturally
  const singles = $$('[data-reveal]').filter((el) => !el.closest('[data-stagger]'));
  singles.forEach((el) => gsap.set(el, { opacity: 0, ...(FROM[el.dataset.reveal || 'up'] ?? FROM.up) }));

  ScrollTrigger.batch(singles, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: (i) => Number(batch[i]?.dataset.delay || 0),
        overwrite: 'auto',
      }),
  });

  // 2. Containers whose children stagger in
  $$('[data-stagger]').forEach((group) => {
    const kids = [...group.children];
    const dir = group.dataset.stagger || 'up';
    gsap.set(kids, { opacity: 0, ...(FROM[dir] ?? FROM.up) });
    ScrollTrigger.create({
      trigger: group,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(kids, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: Number(group.dataset.staggerAmount || 0.1),
        }),
    });
  });
}

function initParallax() {
  $$('[data-parallax]').forEach((img) => {
    const amount = Number(img.dataset.parallax) || 12;
    gsap.fromTo(
      img,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

function formatNumber(value, decimals) {
  return decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
}

function initCounters() {
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const render = (v) => (el.textContent = `${prefix}${formatNumber(v, decimals)}${suffix}`);

    if (reducedMotion) return render(end);
    render(0);
    const state = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 110%',
      once: true,
      onEnter: () => gsap.to(state, { v: end, duration: 2.2, ease: 'power2.out', onUpdate: () => render(state.v) }),
    });
  });
}

function initMarquees() {
  const marquees = $$('[data-marquee]');
  if (!marquees.length || reducedMotion) return;

  const loops = marquees.flatMap((marquee) => {
    const track = marquee.querySelector('.marquee__track');
    const item = marquee.querySelector('.marquee__item');
    if (!track || !item) return [];

    // Duplicate the item until the track is comfortably wider than the viewport (+ one extra for the loop)
    const width = item.offsetWidth;
    const copies = Math.ceil((window.innerWidth * 2) / width) + 1;
    for (let i = 0; i < copies; i++) track.appendChild(item.cloneNode(true));

    const speed = Number(marquee.dataset.speed || 60); // px per second
    return [gsap.to(track, { x: -width, duration: width / speed, ease: 'none', repeat: -1 })];
  });

  // Speed up (and flip direction) with the scroll velocity, easing back to normal when scrolling stops
  let direction = 1;
  const watcher = ScrollTrigger.create({ onUpdate: (self) => (direction = self.direction || direction) });
  gsap.ticker.add(() => {
    const boost = Math.min(Math.abs(watcher.getVelocity()) / 400, 4);
    loops.forEach((loop) => loop.timeScale(gsap.utils.interpolate(loop.timeScale(), direction * (1 + boost), 0.08)));
  });
}

function initScrollRows() {
  $$('[data-scroll-row]').forEach((row) => {
    const dir = Number(row.dataset.scrollRow) || -1;
    gsap.fromTo(
      row,
      { xPercent: dir * -10 },
      { xPercent: dir * 10, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
    );
  });
}

/** Call once per page, AFTER dynamic content has been rendered. */
export function initScrollAnimations() {
  if (reducedMotion) {
    initCounters();
    return;
  }
  initSplit();
  initReveals();
  initParallax();
  initCounters();
  initMarquees();
  initScrollRows();
}
