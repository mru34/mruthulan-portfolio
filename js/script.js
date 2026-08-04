const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav-links');
const interviewPanel = document.querySelector('.interview-panel');
const interviewToggles = document.querySelectorAll('[data-interview-toggle]');
const interviewSlides = [...document.querySelectorAll('[data-interview-slide]')];
const interviewStepButtons = [...document.querySelectorAll('[data-interview-step]')];
const interviewPreviousButtons = document.querySelectorAll('[data-interview-prev]');
const interviewNextButtons = document.querySelectorAll('[data-interview-next]');
const interviewProgressLabels = document.querySelectorAll('[data-interview-progress]');
const announcement = document.querySelector('.mode-announcement');
let currentInterviewSlide = 0;
let interviewReturnFocus = null;

function closeMenu() {
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}

function showInterviewSlide(index, focusSlide = true) {
  const nextIndex = Math.min(Math.max(index, 0), interviewSlides.length - 1);
  currentInterviewSlide = nextIndex;

  interviewSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === nextIndex;
    slide.hidden = !isActive;
    slide.classList.toggle('is-active', isActive);
  });

  interviewStepButtons.forEach((button, buttonIndex) => {
    if (buttonIndex === nextIndex) {
      button.setAttribute('aria-current', 'step');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  interviewProgressLabels.forEach((label) => {
    label.textContent = `${nextIndex + 1} / ${interviewSlides.length}`;
  });

  interviewPreviousButtons.forEach((button) => {
    button.disabled = nextIndex === 0;
  });

  interviewNextButtons.forEach((button) => {
    button.disabled = nextIndex === interviewSlides.length - 1;
  });

  document.querySelector('body.interview-mode main')?.scrollTo({ top: 0 });

  if (focusSlide) {
    interviewSlides[nextIndex]?.focus({ preventScroll: true });
  }

  announcement.textContent = `Interview section ${nextIndex + 1} of ${interviewSlides.length}.`;
}

function setInterviewMode(enabled, trigger = null) {
  body.classList.toggle('interview-mode', enabled);
  interviewPanel.setAttribute('aria-hidden', String(!enabled));
  closeMenu();

  if (enabled) {
    interviewReturnFocus = trigger;
    showInterviewSlide(0);
    announcement.textContent = 'Interview View active. Use the arrow keys to move between sections and Escape to exit.';
  } else {
    announcement.textContent = 'Interview View closed.';
    interviewReturnFocus?.focus();
  }
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  body.classList.toggle('menu-open', !isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
});

navigation?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    closeMenu();
  }
});

interviewToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const enabled = !body.classList.contains('interview-mode');
    setInterviewMode(enabled, enabled ? button : null);
  });
});

interviewStepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showInterviewSlide(Number(button.dataset.interviewStep));
  });
});

interviewPreviousButtons.forEach((button) => {
  button.addEventListener('click', () => showInterviewSlide(currentInterviewSlide - 1));
});

interviewNextButtons.forEach((button) => {
  button.addEventListener('click', () => showInterviewSlide(currentInterviewSlide + 1));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (body.classList.contains('interview-mode')) {
      setInterviewMode(false);
    } else if (body.classList.contains('menu-open')) {
      closeMenu();
      menuToggle?.focus();
    }
    return;
  }

  if (!body.classList.contains('interview-mode')) {
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault();
    showInterviewSlide(currentInterviewSlide + 1);
  }

  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    showInterviewSlide(currentInterviewSlide - 1);
  }

  if (event.key === 'Home') {
    event.preventDefault();
    showInterviewSlide(0);
  }

  if (event.key === 'End') {
    event.preventDefault();
    showInterviewSlide(interviewSlides.length - 1);
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});

showInterviewSlide(0, false);
