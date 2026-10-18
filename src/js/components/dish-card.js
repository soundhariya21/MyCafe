// Renders one menu card. Shared by the Home "Signature picks" and the Menu page.
import { escapeHtml } from '../utils.js';
import { formatPrice } from '../data/menu.js';

const TAG_LABELS = {
  signature: ['Signature', 'gold'],
  new: ['New', 'gold'],
  veg: ['Veg', 'green'],
  vegan: ['Vegan', 'green'],
  gf: ['Gluten-free', ''],
  spicy: ['Spiced', ''],
};

export function dishCard(item) {
  const tags = item.tags
    .map((t) => TAG_LABELS[t])
    .filter(Boolean)
    .map(([label, tone]) => `<span class="tag ${tone ? `tag--${tone}` : ''}">${label}</span>`)
    .join('');

  return `
    <article class="dish card" data-tilt data-flip-id="${item.id}" data-category="${item.category}" data-name="${escapeHtml(
      `${item.name} ${item.desc} ${item.notes}`.toLowerCase()
    )}">
      <div class="dish__img">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <div class="dish__tags">${tags}</div>
      </div>
      <div class="dish__body">
        <div class="dish__top">
          <h3>${escapeHtml(item.name)}</h3>
          <span class="dish__price">${formatPrice(item.price)}</span>
        </div>
        <p class="dish__desc">${escapeHtml(item.desc)}</p>
        <p class="dish__notes">${escapeHtml(item.notes)}</p>
      </div>
    </article>`;
}
