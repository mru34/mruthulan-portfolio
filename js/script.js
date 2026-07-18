const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav-links');
const interviewPanel = document.querySelector('.interview-panel');
const interviewToggles = document.querySelectorAll('[data-interview-toggle]');
const evidenceNavButton = document.querySelector('[data-evidence-nav]');
const announcement = document.querySelector('.mode-announcement');

function closeMenu() {
  body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

function setInterviewMode(enabled) {
  body.classList.toggle('interview-mode', enabled);
  interviewPanel.setAttribute('aria-hidden', String(!enabled));
  announcement.textContent = enabled
    ? 'Interview Mode active. Press Escape to exit.'
    : 'Interview Mode closed.';

  closeMenu();

  if (enabled) {
    interviewPanel.querySelector('a').focus();
  }
}

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  body.classList.toggle('menu-open', !isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
});

navigation.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    closeMenu();
  }
});

interviewToggles.forEach((button) => {
  button.addEventListener('click', () => {
    setInterviewMode(!body.classList.contains('interview-mode'));
  });
});

interviewPanel.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    event.preventDefault();
    document.querySelector(event.target.hash)?.scrollIntoView();
  }
});

evidenceNavButton.addEventListener('click', () => {
  document.querySelector('#work')?.scrollIntoView();
  interviewPanel.querySelector('a[href="#work"]')?.focus();
  announcement.textContent = 'SignalBridge evidence navigation focused.';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (body.classList.contains('interview-mode')) {
      setInterviewMode(false);
      document.querySelector('[data-interview-toggle]')?.focus();
    } else if (body.classList.contains('menu-open')) {
      closeMenu();
      menuToggle.focus();
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});
