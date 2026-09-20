const menuButton = document.querySelector('.menu-button');
const mainNav = document.querySelector('.main-nav');

function closeMenu() {
  if (!menuButton || !mainNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  mainNav.classList.remove('open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mainNav?.classList.toggle('open', open);
});

mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 800) closeMenu();
});

const heroVisual = document.querySelector('.hero-visual');
const heroObject = document.querySelector('.hero-object');
if (heroVisual && heroObject && matchMedia('(pointer: fine)').matches && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  heroVisual.addEventListener('pointermove', (event) => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroObject.style.setProperty('--tilt-x', `${(-y * 9).toFixed(2)}deg`);
    heroObject.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
  });
  heroVisual.addEventListener('pointerleave', () => {
    heroObject.style.setProperty('--tilt-x', '0deg');
    heroObject.style.setProperty('--tilt-y', '0deg');
  });
}
