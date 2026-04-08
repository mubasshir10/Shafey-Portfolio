const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
const targetElements = document.querySelectorAll('.fade-up');

function animateOnScroll() {
  const triggerPoint = window.innerHeight * 0.85;
  targetElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < triggerPoint) {
      el.classList.add('show');
    }
  });
}

function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  themeToggle.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('site-theme', isLight ? 'light' : 'dark');
}

function applyStoredTheme() {
  const savedTheme = localStorage.getItem('site-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '🌙';
  }
}

themeToggle.addEventListener('click', toggleTheme);
menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', () => {
  applyStoredTheme();
  animateOnScroll();
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + 120;
  sections.forEach((section) => {
    if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      document.querySelectorAll('.nav-links a').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${section.id}`);
      });
    }
  });
});
