/**
 * SolarMax — script.js
 * Funcionalidades: Header scroll, menu mobile, partículas,
 * contadores animados, scroll reveal, carrossel, formulário,
 * urgência dinâmica, smooth scroll, ano no footer.
 */

'use strict';

/* ================================================================
   UTILITÁRIOS
================================================================ */

/**
 * Seleciona um elemento do DOM com segurança.
 * @param {string} selector
 * @param {Document|Element} context
 * @returns {Element|null}
 */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Seleciona múltiplos elementos do DOM.
 * @param {string} selector
 * @param {Document|Element} context
 * @returns {NodeList}
 */
const $$ = (selector, context = document) => context.querySelectorAll(selector);

/**
 * Debounce: atrasa execução de função.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ================================================================
   1. ANO ATUAL NO FOOTER
================================================================ */
function initCurrentYear() {
  const el = $('#current-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ================================================================
   2. HEADER: EFEITO AO ROLAR + ACTIVE LINK
================================================================ */
function initHeader() {
  const header = $('#header');
  if (!header) return;

  let lastScroll = 0;

  function updateHeader() {
    const scrollY = window.scrollY;

    // Adiciona classe "scrolled" ao rolar
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', debounce(updateHeader, 10), { passive: true });
  updateHeader();
}

/* ================================================================
   3. MENU MOBILE (HAMBURGER)
================================================================ */
function initMobileMenu() {
  const hamburger = $('#hamburger');
  const nav = $('#main-nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('open', !isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  });

  // Fecha ao clicar em um link
  $$('.nav-link', nav).forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ================================================================
   4. PARTÍCULAS ANIMADAS NO HERO
================================================================ */
function initParticles() {
  const container = $('#particles');
  if (!container) return;

  const COUNT = 20;

  for (let i = 0; i < COUNT; i++) {
    createParticle(container);
  }

  function createParticle(parent) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 4 + 2;
    const left   = Math.random() * 100;
    const delay  = Math.random() * 12;
    const dur    = Math.random() * 10 + 8;
    const opacity = Math.random() * 0.5 + 0.1;

    Object.assign(p.style, {
      width:          `${size}px`,
      height:         `${size}px`,
      left:           `${left}%`,
      animationDelay:    `${delay}s`,
      animationDuration: `${dur}s`,
      opacity:           String(opacity),
    });

    parent.appendChild(p);
  }
}

/* ================================================================
   5. CONTADORES ANIMADOS (TRUST SECTION)
================================================================ */
function initCounters() {
  const cards = $$('.trust__card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const numEl = entry.target.querySelector('.trust__number');
          if (!numEl || numEl.dataset.animated) return;
          numEl.dataset.animated = 'true';

          const target    = parseFloat(numEl.dataset.count);
          const isDecimal = target % 1 !== 0;
          const duration  = 1800;
          const start     = performance.now();

          function tick(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quart
            const eased    = 1 - Math.pow(1 - progress, 4);
            const current  = target * eased;

            numEl.textContent = isDecimal
              ? current.toFixed(1)
              : Math.round(current).toLocaleString('pt-BR');

            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  cards.forEach(card => observer.observe(card));
}

/* ================================================================
   6. SCROLL REVEAL (ELEMENTOS QUE SURGEM AO ROLAR)
================================================================ */
function initScrollReveal() {
  // Adiciona classe a todos os elementos que devem ser animados
  const targets = [
    '.trust__card',
    '.step',
    '.benefit-card',
    '.project-card',
    '.testimonial-card',
    '.section-header',
    '.budget__info',
    '.budget__form-wrapper',
    '.cert-badge',
  ];

  targets.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('animate-on-scroll');
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ================================================================
   7. CARROSSEL DE DEPOIMENTOS
================================================================ */
function initTestimonials() {
  const track  = $('#testimonials-track');
  const dotsEl = $('#testimonials-dots');
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');

  if (!track || !dotsEl) return;

  const cards  = Array.from($$('.testimonial-card', track));
  const total  = cards.length;
  let current  = 0;
  let autoTimer;

  // Cria dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className  = `dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Depoimento ${i + 1} de ${total}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  function goTo(index) {
    current = (index + total) % total;

    // Esconde todos, mostra só o atual (no mobile slider)
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === current);
    });

    // Anima a track para o card atual
    const cardWidth = cards[0].offsetWidth + 24; // gap
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    track.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';

    // Atualiza dots
    $$('.dot', dotsEl).forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function autoPlay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  prevBtn?.addEventListener('click', () => { goTo(current - 1); autoPlay(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); autoPlay(); });

  // Touch swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
      autoPlay();
    }
  });

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', autoPlay);

  // Atualiza posição ao redimensionar
  window.addEventListener('resize', debounce(() => goTo(current), 200));

  goTo(0);
  autoPlay();
}

/* ================================================================
   8. CONTADOR DE VAGAS (URGÊNCIA DINÂMICA)
================================================================ */
function initVagasCounter() {
  const els = [$('#vagas-counter'), $('#vagas-form')];
  // Simula um número de vagas decrescente (baseado no dia do mês)
  const dia   = new Date().getDate();
  const vagas = Math.max(3, 12 - Math.floor(dia / 3));

  els.forEach(el => { if (el) el.textContent = vagas; });
}

/* ================================================================
   9. FORMATAÇÃO AUTOMÁTICA DO TELEFONE
================================================================ */
function initPhoneFormat() {
  const phoneInput = $('#whatsapp');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '').slice(0, 11);
    if (val.length <= 10) {
      val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      val = val.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    this.value = val;
  });
}

/* ================================================================
   10. VALIDAÇÃO E ENVIO DO FORMULÁRIO
================================================================ */
function initForm() {
  const form      = $('#budget-form');
  const success   = $('#form-success');
  const btnText   = $('#btn-text');
  const btnLoading = $('#btn-loading');
  const submitBtn = $('#submit-btn');

  if (!form) return;

  const rules = {
    nome:     { min: 3,  msg: 'Por favor, informe seu nome completo.' },
    whatsapp: { pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/, msg: 'Informe um WhatsApp válido com DDD.' },
    cidade:   { min: 2,  msg: 'Informe sua cidade e estado.' },
    conta:    { required: true, msg: 'Selecione o valor aproximado da sua conta.' },
  };

  function validateField(field) {
    const id    = field.id || field.name;
    const rule  = rules[id];
    const errEl = $(`#${id}-error`);
    if (!rule || !errEl) return true;

    let valid = true;
    let msg   = '';

    if (rule.required && !field.value.trim()) {
      valid = false;
      msg   = rule.msg;
    } else if (rule.min && field.value.trim().length < rule.min) {
      valid = false;
      msg   = rule.msg;
    } else if (rule.pattern && !rule.pattern.test(field.value.trim())) {
      valid = false;
      msg   = rule.msg;
    }

    field.classList.toggle('error', !valid);
    errEl.textContent = valid ? '' : msg;
    return valid;
  }

  // Valida ao sair do campo
  $$('input, select', form).forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida todos os campos
    const fields  = Array.from($$('input, select', form));
    const allOk   = fields.every(f => validateField(f));
    if (!allOk) {
      // Foca no primeiro campo inválido
      const first = fields.find(f => f.classList.contains('error'));
      first?.focus();
      return;
    }

    // Estado de carregamento
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    // Simula envio (substituir por fetch real)
    await fakeSend(1500);

    // Exibe sucesso
    form.classList.add('hidden');
    success.classList.remove('hidden');

    // Scroll suave para o topo do card
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/**
 * Simula um envio assíncrono.
 * Substituir por fetch() para integração real.
 * @param {number} ms
 */
function fakeSend(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ================================================================
   11. SMOOTH SCROLL PARA ÂNCORAS
================================================================ */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const id = anchor.getAttribute('href');
    if (id === '#') return;

    const target = $(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Atualiza hash sem pular
    history.pushState(null, '', id);
  });
}

/* ================================================================
   12. ACTIVE NAV LINK AO ROLAR
================================================================ */
function initActiveNav() {
  const sections  = $$('section[id], footer[id]');
  const navLinks  = $$('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            link.classList.toggle('active', href === id);
          });
        }
      });
    },
    { rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--header-h')} 0px -60% 0px` }
  );

  sections.forEach(sec => observer.observe(sec));
}

/* ================================================================
   INICIALIZAÇÃO GLOBAL
================================================================ */
function init() {
  initCurrentYear();
  initHeader();
  initMobileMenu();
  initParticles();
  initCounters();
  initScrollReveal();
  initTestimonials();
  initVagasCounter();
  initPhoneFormat();
  initForm();
  initSmoothScroll();
  initActiveNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
