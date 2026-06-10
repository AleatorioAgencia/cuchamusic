import './style.css';

document.addEventListener('DOMContentLoaded', async () => {
  let appData = null;
  let currentLang = localStorage.getItem('cucha-lang');

  // Detect default language
  if (!currentLang) {
    const browserLang = navigator.language || navigator.userLanguage;
    currentLang = browserLang.toLowerCase().includes('es') ? 'es' : 'en';
    localStorage.setItem('cucha-lang', currentLang);
  }

  // Set initial attribute on document
  document.documentElement.setAttribute('data-lang', currentLang);

  // Fetch content from Express API
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      appData = await res.json();
      initApp(appData, currentLang);
    } else {
      console.error('Failed to fetch content from server');
    }
  } catch (error) {
    console.error('Error fetching content:', error);
  }

  // Setup Scroll Reveal Observer
  setupScrollReveal();
  // Setup Navbar backdrop scroll listener
  setupNavbarScroll();
});

// Setup Scroll Reveal Intersection Observer
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

// Navbar Scroll Listener
function setupNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const floatWa = document.getElementById('floating-wa');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('bg-cucha-black/90', 'backdrop-blur-md', 'shadow-2xl', 'border-cucha-gold/10');
      navbar.classList.remove('border-transparent');
    } else {
      navbar.classList.remove('bg-cucha-black/90', 'backdrop-blur-md', 'shadow-2xl', 'border-cucha-gold/10');
      navbar.classList.add('border-transparent');
    }

    // Floating WA button appears after scrolling 300px
    if (window.scrollY > 300) {
      floatWa.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      floatWa.classList.add('opacity-100', 'translate-y-0');
    } else {
      floatWa.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      floatWa.classList.remove('opacity-100', 'translate-y-0');
    }
  });
}

// Initialize Application UI and Bind Events
function initApp(data, lang) {
  // Bind Language Buttons
  const btnEs = document.getElementById('lang-btn-es');
  const btnEn = document.getElementById('lang-btn-en');

  function updateLangUI(newLang) {
    localStorage.setItem('cucha-lang', newLang);
    document.documentElement.setAttribute('data-lang', newLang);
    
    if (newLang === 'es') {
      btnEs.className = 'text-cucha-gold font-bold transition-colors';
      btnEn.className = 'text-gray-500 hover:text-cucha-light transition-colors';
    } else {
      btnEn.className = 'text-cucha-gold font-bold transition-colors';
      btnEs.className = 'text-gray-500 hover:text-cucha-light transition-colors';
    }
    
    renderLangContent(data, newLang);
  }

  btnEs.addEventListener('click', () => updateLangUI('es'));
  btnEn.addEventListener('click', () => updateLangUI('en'));

  // Run initial render
  updateLangUI(lang);

  // HELPER: Convert normal YouTube/Vimeo URLs to embed compatible format
  function convertToEmbedUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
      return url;
    }
    const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    if (ytWatchMatch && ytWatchMatch[1]) {
      return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  }

  // Setup Video Lightbox Modal
  const videoTrigger = document.getElementById('video-trigger');
  const videoModal = document.getElementById('video-modal');
  const videoClose = document.getElementById('video-modal-close');
  const videoIframe = document.getElementById('video-iframe');

  videoTrigger.addEventListener('click', () => {
    // Determine video embed link. Default to a premium nightlife/percussion feel video or customizable
    const rawUrl = data.general?.heroVideoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
    const embedUrl = convertToEmbedUrl(rawUrl);
    videoIframe.src = embedUrl;
    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Lock scroll
  });

  videoClose.addEventListener('click', () => {
    videoIframe.src = "";
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
    document.body.style.overflow = ''; // Unlock scroll
  });

  // Setup Form Submission & WhatsApp redirection
  const form = document.getElementById('booking-form');
  const successState = document.getElementById('form-success');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const date = document.getElementById('form-date').value;
    const location = document.getElementById('form-location').value;
    const eventType = document.getElementById('form-event-type').value;
    const message = document.getElementById('form-message').value;

    // Build message
    const waText = lang === 'es' 
      ? `Hola Cucha, me gustaría consultar tu disponibilidad para un evento. Aquí tienes los detalles:
- Nombre: ${name}
- Email: ${email}
- Fecha: ${date}
- Ciudad/País: ${location}
- Tipo de evento: ${eventType}
- Mensaje: ${message}`
      : `Hello Cucha, I would like to check your availability for an event. Here are the details:
- Name: ${name}
- Email: ${email}
- Date: ${date}
- City/Country: ${location}
- Event Type: ${eventType}
- Message: ${message}`;

    const whatsappNumber = data.general?.whatsapp || '34600000000';
    const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}`;

    // Transition form to success state
    form.classList.add('hidden');
    successState.classList.remove('hidden');

    // Trigger redirection after 2 seconds
    setTimeout(() => {
      window.open(waLink, '_blank');
    }, 2000);
  });
}

// Render Localized Texts and Component Arrays
function renderLangContent(data, lang) {
  const t = data[lang];
  const general = data.general;

  if (!t) return;

  // 1. Dynamic Logo Rendering (Header & Footer & Hero text fallback)
  const logoText = general?.logoText || "CUCHA";
  const logoImage = general?.logoImage || "";
  const logoContainer = document.getElementById('logo-container');
  const footerLogoContainer = document.getElementById('footer-logo-container');
  const heroLogoText = document.getElementById('hero-logo-text');

  if (heroLogoText) heroLogoText.textContent = logoText;

  const logoHtml = logoImage 
    ? `<img src="${logoImage}" alt="${logoText}" class="h-8 md:h-10 object-contain">`
    : `<span class="font-heading font-extrabold text-2xl md:text-3xl tracking-widest text-cucha-light hover:text-cucha-gold transition-colors duration-300">${logoText}</span>`;

  if (logoContainer) logoContainer.innerHTML = logoHtml;
  if (footerLogoContainer) footerLogoContainer.innerHTML = logoImage 
    ? `<img src="${logoImage}" alt="${logoText}" class="h-8 md:h-10 object-contain mx-auto md:mx-0">` 
    : `<span class="font-heading font-extrabold text-2xl tracking-widest text-cucha-light hover:text-cucha-gold transition-colors duration-300 block">${logoText}</span>`;

  // 2. Dynamic Section Visibility Toggles (Hides from DOM & menu links)
  const vis = general?.sectionsVisibility || {};
  const sectionsMapping = {
    'why': vis.whyCucha !== false,
    'experience': vis.experience !== false,
    'events': vis.eventTypes !== false,
    'social-proof': vis.socialProof !== false,
    'gallery': vis.gallery !== false,
    'booking': vis.bookingProcess !== false,
    'faqs': vis.faqs !== false,
    'contact': vis.contactForm !== false,
    'final-cta': vis.finalCta !== false
  };

  for (const [secId, isVisible] of Object.entries(sectionsMapping)) {
    const el = document.getElementById(secId);
    if (el) {
      if (isVisible) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    // Also toggle corresponding navigation links in header
    const navLink = document.querySelector(`#navbar a[href="#${secId}"]`);
    if (navLink) {
      if (isVisible) {
        navLink.classList.remove('hidden');
      } else {
        navLink.classList.add('hidden');
      }
    }
  }

  // 3. Dynamic Button Texts
  const navInquireBtn = document.getElementById('nav-inquire-btn');
  if (navInquireBtn) navInquireBtn.textContent = t.header?.btnInquire || (lang === 'es' ? 'Consultar' : 'Inquire');

  const expWaBtn = document.getElementById('exp-wa-btn');
  if (expWaBtn) expWaBtn.textContent = t.experience?.btnWhatsapp || (lang === 'es' ? 'Reservar por WhatsApp' : 'Book via WhatsApp');

  const proofWaBtn = document.getElementById('proof-wa-btn');
  if (proofWaBtn) proofWaBtn.textContent = t.socialProof?.btnWhatsapp || (lang === 'es' ? 'Consultar disponibilidad por WhatsApp' : 'Check availability on WhatsApp');

  const formSubmitBtn = document.getElementById('form-submit-btn');
  if (formSubmitBtn) formSubmitBtn.textContent = t.contact?.btnSubmit || (lang === 'es' ? 'Enviar consulta' : 'Send Inquiry');

  const finalWaBtn = document.getElementById('final-wa-btn');
  if (finalWaBtn) finalWaBtn.textContent = t.finalCta?.btn || (lang === 'es' ? 'Reservar por WhatsApp' : 'Book via WhatsApp');

  // 4. Dynamic Gallery Images
  const galImgs = general?.galleryImages || [];
  for (let i = 0; i < 4; i++) {
    const imgEl = document.getElementById(`gallery-img-${i}`);
    if (imgEl && galImgs[i]) {
      imgEl.src = galImgs[i];
    }
  }

  // General Hrefs (WhatsApp links)
  const whatsappNumber = general?.whatsapp || '34600000000';
  const defaultWaText = lang === 'es'
    ? 'Hola Cucha, me gustaría consultar tu disponibilidad para un evento.'
    : 'Hello Cucha, I would like to check your availability for an event.';
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultWaText)}`;

  // Apply to all WhatsApp buttons
  document.querySelectorAll('.btn-whatsapp-dynamic').forEach(btn => {
    btn.href = waLink;
  });
  document.getElementById('floating-wa').href = waLink;

  // Social Links
  document.getElementById('footer-instagram').href = general?.instagram || '#';
  document.getElementById('footer-youtube').href = general?.youtube || '#';

  // Hero Section
  document.getElementById('hero-headline').textContent = t.hero.title + " " + t.hero.subtitle;
  document.getElementById('hero-description').textContent = t.hero.description;
  
  const heroCtaPrimary = document.getElementById('hero-cta-primary');
  heroCtaPrimary.textContent = t.hero.btnWhatsapp;
  heroCtaPrimary.href = waLink;

  document.getElementById('hero-btn-secondary-text').textContent = t.hero.btnReel;
  
  if (general?.heroImages && general.heroImages.length > 0) {
    document.getElementById('hero-bg-img').src = general.heroImages[0];
  }

  // Hero trust strip
  const trustStripContainer = document.getElementById('hero-trust-strip');
  const trustItems = t.hero.trustStrip.split(' · ');
  trustStripContainer.innerHTML = trustItems.map(item => `<span>${item}</span>`).join('');

  // Why Cucha Section
  document.getElementById('why-title').textContent = t.whyCucha.title;
  document.getElementById('why-text').textContent = t.whyCucha.text;

  const whyPoints = t.whyCucha.points || [];
  const whyGrid = document.getElementById('why-points-grid');
  whyGrid.innerHTML = whyPoints.map((point, index) => `
    <div class="glass-panel p-8 rounded-2xl border border-cucha-gold/10 hover:border-cucha-gold/30 transition-all duration-300 transform hover:-translate-y-1">
      <div class="font-heading font-black text-2xl text-cucha-gold/20 mb-4">0${index + 1}</div>
      <h3 class="font-heading font-bold text-lg text-cucha-gold uppercase mb-3">${point.title}</h3>
      <p class="text-gray-400 text-sm font-light leading-relaxed">${point.desc}</p>
    </div>
  `).join('');

  // Experience Section
  document.getElementById('experience-title').textContent = t.experience.title;
  document.getElementById('experience-text1').textContent = t.experience.text1;
  document.getElementById('experience-text2').textContent = t.experience.text2;
  document.getElementById('experience-quote').textContent = `“${t.experience.quote}”`;
  if (general?.experienceImage) {
    document.getElementById('experience-img').src = general.experienceImage;
  }

  // Event Types Interactive Section
  const servicesNavList = document.getElementById('services-nav-list');
  const bgsContainer = document.getElementById('service-bgs-container');
  const eventTypes = t.eventTypes || [];

  // Generate crossfade background images
  bgsContainer.innerHTML = eventTypes.map((ev, index) => `
    <div id="service-bg-${ev.id}" class="service-interactive-bg absolute inset-0 ${index === 0 ? 'active' : ''}" style="background-image: url('${ev.image}');"></div>
  `).join('');

  // Generate menu items
  servicesNavList.innerHTML = eventTypes.map((ev, index) => `
    <div class="service-nav-item cursor-pointer p-6 md:p-8 flex flex-col transition-all duration-300 ${index === 0 ? 'active' : ''}" data-service-id="${ev.id}" onclick="selectService('${ev.id}')">
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-6">
          <span class="service-number text-xs font-heading font-bold tracking-wider text-gray-600">0${index + 1}</span>
          <span class="font-heading font-black text-lg md:text-xl uppercase tracking-wider text-cucha-light group-hover:text-cucha-gold">${ev.title}</span>
        </div>
        <span class="text-cucha-gold text-xl font-heading font-light">✦</span>
      </div>
      
      <!-- Expandable detail in mobile -->
      <div class="mt-4 text-gray-400 text-sm font-light leading-relaxed max-h-0 overflow-hidden transition-all duration-500 lg:hidden" id="service-desc-mob-${ev.id}">
        <p class="mb-4">${ev.desc}</p>
        <a href="#contact" onclick="setFormEventType('${ev.title}')" class="inline-block text-cucha-gold font-heading text-xs tracking-wider uppercase underline">
          ${lang === 'es' ? 'Consultar esta fecha' : 'Book this date'}
        </a>
      </div>
    </div>
  `).join('');

  // Set initial desktop details
  if (eventTypes.length > 0) {
    updateDesktopServiceDetail(eventTypes[0].title, eventTypes[0].desc);
  } else {
    updateDesktopServiceDetail("", "");
  }

  // Setup Hover Listeners for Desktop
  document.querySelectorAll('.service-nav-item').forEach(item => {
    const serviceId = item.getAttribute('data-service-id');
    const matchedService = eventTypes.find(ev => ev.id === serviceId);

    item.addEventListener('mouseenter', () => {
      // Background Crossfade
      document.querySelectorAll('.service-interactive-bg').forEach(bg => bg.classList.remove('active'));
      const activeBg = document.getElementById(`service-bg-${serviceId}`);
      if (activeBg) activeBg.classList.add('active');

      // Highlight Item
      document.querySelectorAll('.service-nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update Desktop text
      if (matchedService) {
        updateDesktopServiceDetail(matchedService.title, matchedService.desc);
      }
    });
  });

  // Social Proof (Testimonials)
  document.getElementById('social-proof-line').textContent = t.socialProof.credibilityLine;
  const testimonialsGrid = document.getElementById('testimonials-container');
  const testimonials = t.socialProof.testimonials || [];
  testimonialsGrid.innerHTML = testimonials.map(test => `
    <div class="glass-panel p-8 rounded-2xl border border-cucha-gold/10 hover:border-cucha-gold/30 transition-all duration-300 relative flex flex-col justify-between">
      <div class="text-cucha-gold text-5xl font-serif leading-none absolute top-4 left-6 select-none opacity-20">“</div>
      <p class="text-gray-300 font-light text-base leading-relaxed mb-6 italic relative z-10 pt-4">
        ${test.text}
      </p>
      <div class="border-t border-cucha-gold/10 pt-4 flex items-center justify-between">
        <div>
          <h4 class="font-heading font-bold text-sm uppercase text-cucha-gold">${test.author}</h4>
          <p class="text-[10px] text-gray-500 uppercase tracking-widest">${test.role}</p>
        </div>
        <span class="text-cucha-gold/30 text-xs">✦</span>
      </div>
    </div>
  `).join('');

  // Booking Process (Cómo reservar)
  document.getElementById('booking-title').textContent = t.bookingProcess.title;
  const stepsGrid = document.getElementById('booking-steps-grid');
  const steps = t.bookingProcess.steps || [];
  stepsGrid.innerHTML = steps.map((step, index) => `
    <div class="glass-panel p-8 rounded-2xl border border-cucha-gold/10 relative text-center">
      <div class="step-number-pill font-heading font-black text-6xl md:text-7xl mb-4">0${index + 1}</div>
      <h3 class="font-heading font-bold text-lg text-cucha-light uppercase mb-3">${step.title}</h3>
      <p class="text-gray-400 text-sm font-light leading-relaxed">${step.desc}</p>
      
      <!-- Connective arrow/line (Desktop only, except last) -->
      ${index < steps.length - 1 ? `
        <div class="hidden md:block absolute top-[40%] right-[-15%] w-[30%] h-[1px] border-t border-dashed border-cucha-gold/20 z-20"></div>
      ` : ''}
    </div>
  `).join('');

  // FAQs Accordion
  const faqContainer = document.getElementById('faq-accordion-container');
  const faqs = t.faqs || [];
  faqContainer.innerHTML = faqs.map((faq, index) => `
    <div class="faq-accordion-item border border-cucha-gold/10 rounded-xl bg-cucha-charcoal/30 overflow-hidden" id="faq-item-${index}">
      <button class="w-full text-left px-6 py-5 font-heading font-bold text-sm md:text-base text-cucha-light hover:text-cucha-gold focus:outline-none flex justify-between items-center transition-colors duration-300" onclick="toggleFaq(${index})">
        <span>${faq.question}</span>
        <span class="faq-icon-spin text-cucha-gold text-lg font-light" id="faq-btn-icon-${index}">+</span>
      </button>
      <div class="faq-accordion-content px-6 bg-cucha-black/40 text-gray-400 text-sm font-light leading-relaxed" id="faq-content-${index}">
        <p class="pb-6 pt-2">${faq.answer}</p>
      </div>
    </div>
  `).join('');

  // Final CTA Section
  document.getElementById('final-cta-headline').textContent = t.finalCta.headline;
  document.getElementById('final-cta-text').textContent = t.finalCta.text;

  // Footer Links
  document.getElementById('footer-link-privacy').textContent = t.footer.privacy;
  document.getElementById('footer-link-terms').textContent = t.footer.terms;
  document.getElementById('footer-link-contact').textContent = t.footer.contact;
  document.getElementById('footer-legal').textContent = t.footer.legal;
}

// Update Desktop Interactive Service Text panel
function updateDesktopServiceDetail(title, desc) {
  const detailTitle = document.getElementById('service-detail-title');
  const detailDesc = document.getElementById('service-detail-desc');
  if (detailTitle && detailDesc) {
    detailTitle.textContent = title;
    detailDesc.textContent = desc;
  }
}

// Handle Service selection / toggle (especially on mobile/click)
window.selectService = (serviceId) => {
  const mobDesc = document.getElementById(`service-desc-mob-${serviceId}`);
  if (!mobDesc) return;

  const isOpen = mobDesc.style.maxHeight && mobDesc.style.maxHeight !== '0px';

  // Close all mobile descriptions
  document.querySelectorAll('[id^="service-desc-mob-"]').forEach(el => {
    el.style.maxHeight = '0px';
  });

  // Toggle current one
  if (!isOpen) {
    mobDesc.style.maxHeight = '300px';
  }
};

// Help select event type from menu in booking form dropdown
window.setFormEventType = (title) => {
  const dropdown = document.getElementById('form-event-type');
  if (dropdown) {
    // Attempt to match option content or value
    for (let i = 0; i < dropdown.options.length; i++) {
      if (dropdown.options[i].text.toLowerCase().includes(title.toLowerCase()) || 
          dropdown.options[i].value.toLowerCase().includes(title.toLowerCase())) {
        dropdown.selectedIndex = i;
        break;
      }
    }
  }
};

// FAQ accordion toggler
window.toggleFaq = (index) => {
  const accordionItem = document.getElementById(`faq-item-${index}`);
  const isAlreadyActive = accordionItem.classList.contains('active');

  // Close all accordions
  document.querySelectorAll('.faq-accordion-item').forEach(item => {
    item.classList.remove('active');
  });

  // Open clicked one if it wasn't open
  if (!isAlreadyActive) {
    accordionItem.classList.add('active');
  }
};
