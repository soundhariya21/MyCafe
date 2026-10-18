// Text content used by several pages (testimonials, FAQs, gallery, team, timeline).

const img = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const testimonials = [
  {
    quote:
      'The brass filter kaapi here tastes like my grandmother’s kitchen, if her kitchen had a design studio. I come every Sunday and I have never once been rushed.',
    name: 'Ananya R.',
    role: 'Architect · Regular since 2020',
  },
  {
    quote:
      'The sourdough alone is worth the trip. Tangy, crackling crust, and the butter is churned in-house. Add the nitro cold and it is a perfect morning.',
    name: 'Karthik M.',
    role: 'Food blogger',
  },
  {
    quote:
      'Quiet, warm, and genuinely beautiful. It is the only café where I can finish a whole chapter. The baristas remember your order, and your name.',
    name: 'Meera S.',
    role: 'Author & weekend regular',
  },
  {
    quote:
      'We hosted a small birthday brunch here. The team handled everything — the Slow Brunch Board was a showstopper. Our guests are still talking about it.',
    name: 'Rohan & Priya',
    role: 'Private event guests',
  },
];

export const faqCategories = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'visit', label: 'Visiting' },
  { id: 'food', label: 'Food & Diet' },
  { id: 'beans', label: 'Beans & Orders' },
];

export const faqs = [
  {
    category: 'coffee',
    q: 'What makes your filter coffee extraction different?',
    a: 'We use estate-grade Arabica and Robusta roasted in micro-lots, brewed through traditional stainless-steel and brass gravity filters. The slow, drop-by-drop extraction gives a full-bodied, low-acidity decoction with a sweeter finish.',
  },
  {
    category: 'coffee',
    q: 'How is your nitro cold brew made?',
    a: 'Our cold brew steeps for 24 hours, is filtered twice, then infused with nitrogen and served on tap. The tiny nitrogen bubbles give it a naturally creamy texture — no dairy or sugar needed.',
  },
  {
    category: 'coffee',
    q: 'Can I get decaf or low-caffeine options?',
    a: 'Yes. We keep a Swiss-water decaf on espresso, and our chicory-heavy filter blend is lower in caffeine. Just ask the barista and we will guide you.',
  },
  {
    category: 'visit',
    q: 'Do I need to book a table?',
    a: 'Walk-ins are always welcome, but weekends fill up fast. Reserve online for guaranteed seating — tables are held for 15 minutes past your booking time.',
  },
  {
    category: 'visit',
    q: 'What are your opening hours?',
    a: 'We pour Tuesday to Sunday, 7:00 AM – 10:00 PM. Mondays we are closed so our roasters can focus on the week’s fresh batches.',
  },
  {
    category: 'visit',
    q: 'Is the café laptop and pet friendly?',
    a: 'Laptops are welcome at our long communal table and window bar before 5 PM on weekends. Well-behaved dogs are welcome on the garden patio.',
  },
  {
    category: 'visit',
    q: 'Do you host private events?',
    a: 'Absolutely — we host intimate birthdays, tastings and small team offsites for up to 30 guests. Write to hello@mycafe.in with your date and headcount.',
  },
  {
    category: 'food',
    q: 'Do you have dairy-free milk alternatives?',
    a: 'Yes! We offer barista-grade oat and almond milk for all hot brews, nitro colds and lattes at no extra charge.',
  },
  {
    category: 'food',
    q: 'Are there vegan or gluten-free options?',
    a: 'Our menu marks vegan (VEGAN) and gluten-free (GF) items clearly. The cold brew, pour over and several brunch plates are naturally vegan. Please note our kitchen handles wheat, nuts and dairy.',
  },
  {
    category: 'food',
    q: 'Is the bakery really baked fresh every day?',
    a: 'Every morning from 4 AM. Sourdough ferments for 48 hours; croissants are laminated over three days. When a tray sells out, it sells out.',
  },
  {
    category: 'beans',
    q: 'Can I purchase freshly roasted beans or ground powder?',
    a: 'Yes, our freshly roasted whole beans and custom grinds (French Press, AeroPress, South Indian Filter, Espresso) are packed to order at the café counter in 250 g and 1 kg bags.',
  },
  {
    category: 'beans',
    q: 'Do you ship across India?',
    a: 'We ship roasted beans pan-India within 24 hours of roasting. Orders over ₹1,200 ship free. Drop us a note via the contact page to place an order.',
  },
  {
    category: 'beans',
    q: 'Do you offer brewing classes?',
    a: 'We run a monthly Slow Coffee Workshop — covering pour-over, filter coffee and milk texturing. Seats are limited; subscribe to The Slow Letter to hear first.',
  },
];

export const galleryItems = [
  { cat: 'coffee', title: 'Slow Drip Extraction', tag: 'Rituals', size: 'tall', src: img('1509785307050-d4066910ec1e') },
  { cat: 'bakes', title: 'Flaky Cardamom Crust', tag: 'Oven Daily', size: '', src: img('1555507036-ab1f4038808a') },
  { cat: 'coffee', title: 'Latte Art, Poured Twice', tag: 'Bar', size: 'wide', src: img('1541167760496-1628856ab772') },
  { cat: 'space', title: 'Quiet Morning Light', tag: 'Atmosphere', size: '', src: img('1554118811-1e0d58224f24') },
  { cat: 'coffee', title: 'Velvet Nitrogen Cascade', tag: 'Cold Bar', size: 'tall', src: img('1461023058943-07fcbe16d735') },
  { cat: 'bakes', title: 'Wild Sourdough', tag: '48 Hours', size: '', src: img('1509440159596-0249088772ff') },
  { cat: 'space', title: 'The Roastery Corner', tag: 'Behind the scenes', size: 'wide', src: img('1511537190424-bbbab87ac5eb') },
  { cat: 'coffee', title: 'Pour-Over Ceremony', tag: 'Rituals', size: '', src: img('1442512595331-e89e73853f31') },
  { cat: 'bakes', title: 'Croissants at Dawn', tag: 'Oven Daily', size: 'tall', src: img('1530610476181-d83430b64dcd') },
  { cat: 'space', title: 'Window Bar Afternoons', tag: 'Atmosphere', size: '', src: img('1521017432531-fbd92d768814') },
  { cat: 'bakes', title: 'Brunch, Unhurried', tag: 'Weekends', size: 'wide', src: img('1504754524776-8f4f37790ca0') },
  { cat: 'coffee', title: 'Single Origin Beans', tag: 'Sourcing', size: '', src: img('1447933601403-0c6688de566e') },
];

export const timeline = [
  { year: '2019', title: 'A tiny counter, one grinder', text: 'MY.CAFÉ opens as a 12-seat counter on Artisanal Lane, serving only filter coffee and two bakes.' },
  { year: '2020', title: 'We start roasting', text: 'A second-hand roaster arrives. We begin sourcing directly from shade-grown estates in Coorg and Chikmagalur.' },
  { year: '2022', title: 'The sourdough programme', text: 'A 48-hour fermentation bakery opens behind the bar. The cardamom bun is born — and sells out by 10 AM.' },
  { year: '2024', title: 'Nitro & the cold bar', text: 'We install our first nitro tap and launch the Kaapi Nitro Cold, now our most-ordered drink.' },
  { year: '2026', title: 'The new roastery café', text: 'We expand into a light-filled two-floor space with a patio, roastery window and the Slow Brunch menu.' },
];

export const values = [
  { icon: '🌱', title: 'Micro-Lot Sourcing', text: 'Direct, fairly priced relationships with shade-grown Arabica estates in South India.' },
  { icon: '⏳', title: 'Slow Extraction', text: 'Gravity-filtered patience and precise temperature control in every single cup.' },
  { icon: '🥖', title: 'Baked at 4 AM', text: 'Wild-yeast sourdough and hand-laminated pastry, baked in small batches.' },
  { icon: '♻️', title: 'Low-Waste Kitchen', text: 'Spent grounds go to local gardens; takeaway cups are compostable.' },
  { icon: '🤝', title: 'Community First', text: 'A pay-it-forward wall, monthly workshops and a table for every stranger.' },
  { icon: '✨', title: 'Sensory Space', text: 'A warm, moody haven designed for intimate talks and peaceful pauses.' },
];

export const team = [
  { name: 'Aarav Menon', role: 'Founder & Head Roaster', bio: 'Left a software career to chase the perfect decoction.' },
  { name: 'Diya Krishnan', role: 'Head Baker', bio: 'Keeper of the 6-year-old sourdough starter, “Bhaskar”.' },
  { name: 'Imran Qureshi', role: 'Lead Barista', bio: 'Three-time regional latte-art champion. Remembers every order.' },
  { name: 'Lakshmi Iyer', role: 'Café Manager', bio: 'Runs the floor, the playlists and the pay-it-forward wall.' },
];

export const origins = [
  { name: 'Coorg', alt: '1,100 m', note: 'Shade-grown under silver oak. Bright, floral, honeyed.' },
  { name: 'Chikmagalur', alt: '1,300 m', note: 'Birthplace of Indian coffee. Balanced, nutty, caramel.' },
  { name: 'Araku Valley', alt: '1,000 m', note: 'Tribal-farmed Arabica. Sweet, fruity, soft acidity.' },
  { name: 'Wayanad', alt: '900 m', note: 'Robusta in small lots. Bold, chocolatey, full-bodied.' },
];
