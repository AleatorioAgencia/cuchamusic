let appData = {};
let token = '';
let localVideoUrls = [];

async function login() {
  const pwd = document.getElementById('password').value;
  token = 'Bearer ' + pwd;

  try {
    let res = await fetch('/api/content');
    if (!res.ok) {
      res = await fetch('/data.json');
    }
    if (res.ok) {
      appData = await res.json();
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('admin-screen').classList.remove('hidden');
      
      // Populate global inputs
      document.getElementById('gen-logo-text').value = appData.general?.logoText || 'CUCHA';
      document.getElementById('gen-logo-image').value = appData.general?.logoImage || '';
      document.getElementById('gen-whatsapp').value = appData.general?.whatsapp || '';
      document.getElementById('gen-instagram').value = appData.general?.instagram || '';
      document.getElementById('gen-youtube').value = appData.general?.youtube || '';
      const rawVids = appData.general?.videoUrls || (appData.general?.heroVideoUrl ? [appData.general.heroVideoUrl] : []);
      localVideoUrls = rawVids.filter(Boolean);
      renderVideosInputs();
      document.getElementById('gen-press-kit').value = appData.general?.pressKitUrl || '';
      
      if (appData.general?.heroImages && appData.general.heroImages.length > 0) {
        document.getElementById('gen-img-hero').value = appData.general.heroImages[0];
      }
      const opacityVal = appData.general?.heroOpacity !== undefined ? appData.general.heroOpacity : 50;
      document.getElementById('gen-hero-opacity').value = opacityVal;
      document.getElementById('hero-opacity-val').textContent = opacityVal + '%';
      document.getElementById('gen-img-experience').value = appData.general?.experienceImage || '';
      document.getElementById('gen-img-bio').value = appData.general?.bioImage || '';

      // Populate gallery images
      const gal = appData.general?.galleryImages || [];
      for (let i = 0; i < 4; i++) {
        document.getElementById(`gen-gallery-img-${i}`).value = gal[i] || '';
      }

      // Populate visibility checkboxes
      const vis = appData.general?.sectionsVisibility || {};
      document.getElementById('vis-whyCucha').checked = vis.whyCucha !== false;
      document.getElementById('vis-experience').checked = vis.experience !== false;
      document.getElementById('vis-eventTypes').checked = vis.eventTypes !== false;
      document.getElementById('vis-socialProof').checked = vis.socialProof !== false;
      document.getElementById('vis-gallery').checked = vis.gallery !== false;
      document.getElementById('vis-bookingProcess').checked = vis.bookingProcess !== false;
      document.getElementById('vis-faqs').checked = vis.faqs !== false;
      document.getElementById('vis-contactForm').checked = vis.contactForm !== false;
      document.getElementById('vis-finalCta').checked = vis.finalCta !== false;

      // Render tab contents
      renderTabContent('es');
      renderTabContent('en');
    } else {
      alert("Error de inicio de sesión: Contraseña incorrecta");
    }
  } catch(e) {
    alert("Error de conexión con el servidor");
  }
}

function logout() {
  token = '';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-screen').classList.add('hidden');
  document.getElementById('password').value = '';
}

function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  // Remove border from all buttons
  document.querySelectorAll('[id^="btn-tab-"]').forEach(el => {
    el.classList.remove('border-amber-500', 'text-amber-500');
    el.classList.add('border-transparent', 'text-slate-400');
  });

  // Show active tab
  document.getElementById(tabId).classList.remove('hidden');
  // Highlight active button
  const activeBtn = document.getElementById('btn-' + tabId);
  activeBtn.classList.remove('border-transparent', 'text-slate-400');
  activeBtn.classList.add('border-amber-500', 'text-amber-500');
}

// SECURE FILE UPLOAD HELPER (BASE64)
window.handleFileUpload = async (fileInputId, targetInputId) => {
  const fileInput = document.getElementById(fileInputId);
  const targetInput = document.getElementById(targetInputId);
  if (!fileInput || !fileInput.files.length) return;

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          filename: file.name,
          base64Data: reader.result
        })
      });

      if (res.ok) {
        const data = await res.json();
        targetInput.value = data.url;
        alert('Archivo subido con éxito: ' + data.url);
      } else {
        const err = await res.json();
        alert('Error al subir archivo: ' + (err.error || 'error desconocido'));
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al subir el archivo');
    }
  };
  
  reader.readAsDataURL(file);
};

// HELPER: Dynamic inputs for videos
function renderVideosInputs() {
  const container = document.getElementById('admin-videos-list');
  if (!container) return;
  container.innerHTML = '';

  if (localVideoUrls.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay videos agregados. Haz clic en '+ Agregar Video' para añadir uno.</p>`;
    return;
  }

  localVideoUrls.forEach((url, idx) => {
    container.innerHTML += `
      <div class="flex items-center gap-2">
        <input type="text" id="gen-video-url-${idx}" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${url}" placeholder="Ej: https://youtu.be/... o enlace embed" onchange="localVideoUrls[${idx}] = this.value">
        <button onclick="removeVideoUrlInput(${idx})" class="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2.5 rounded text-xs whitespace-nowrap">Eliminar</button>
      </div>
    `;
  });
}

window.addVideoUrlInput = () => {
  localVideoUrls.push('');
  renderVideosInputs();
};

window.removeVideoUrlInput = (idx) => {
  localVideoUrls.splice(idx, 1);
  renderVideosInputs();
};

// HELPER: Convert normal YouTube/Vimeo URLs to embed compatible format
function convertToEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();
  
  // Already in embed format
  if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
    return url;
  }
  
  // YouTube watch links (e.g. youtube.com/watch?v=ID or youtu.be/ID)
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
  }

  // Vimeo standard link (e.g. vimeo.com/ID)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return url;
}

// SYNCHRONIZED CARD ACTIONS (MODIFIES ES & EN SIMULTANEOUSLY)

window.addWhyPoint = () => {
  if (!appData.es.whyCucha.points) appData.es.whyCucha.points = [];
  if (!appData.en.whyCucha.points) appData.en.whyCucha.points = [];
  
  appData.es.whyCucha.points.push({ title: "Nuevo Beneficio", desc: "Detalle del beneficio." });
  appData.en.whyCucha.points.push({ title: "New Benefit", desc: "Details of the benefit." });
  
  renderTabContent('es');
  renderTabContent('en');
};

window.removeWhyPoint = (idx) => {
  if (confirm("¿Estás seguro de que deseas eliminar este punto clave en ambos idiomas?")) {
    appData.es.whyCucha.points.splice(idx, 1);
    appData.en.whyCucha.points.splice(idx, 1);
    renderTabContent('es');
    renderTabContent('en');
  }
};

window.addEvent = () => {
  if (!appData.es.eventTypes) appData.es.eventTypes = [];
  if (!appData.en.eventTypes) appData.en.eventTypes = [];
  
  const newId = 'event-' + Date.now();
  appData.es.eventTypes.push({
    id: newId,
    title: "Nuevo Evento",
    desc: "Descripción en español.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  });
  appData.en.eventTypes.push({
    id: newId,
    title: "New Event",
    desc: "Description in English.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  });

  renderTabContent('es');
  renderTabContent('en');
};

window.removeEvent = (idx) => {
  if (confirm("¿Estás seguro de que deseas eliminar este formato de show en ambos idiomas?")) {
    appData.es.eventTypes.splice(idx, 1);
    appData.en.eventTypes.splice(idx, 1);
    renderTabContent('es');
    renderTabContent('en');
  }
};

window.addTestimonial = () => {
  if (!appData.es.socialProof.testimonials) appData.es.socialProof.testimonials = [];
  if (!appData.en.socialProof.testimonials) appData.en.socialProof.testimonials = [];

  appData.es.socialProof.testimonials.push({ text: "Comentario del cliente.", author: "Nombre", role: "Lugar / Cargo" });
  appData.en.socialProof.testimonials.push({ text: "Client testimonial comment.", author: "Name", role: "Venue / Role" });

  renderTabContent('es');
  renderTabContent('en');
};

window.removeTestimonial = (idx) => {
  if (confirm("¿Estás seguro de que deseas eliminar este testimonio en ambos idiomas?")) {
    appData.es.socialProof.testimonials.splice(idx, 1);
    appData.en.socialProof.testimonials.splice(idx, 1);
    renderTabContent('es');
    renderTabContent('en');
  }
};

window.addFaqGlobal = () => {
  if (!appData.es.faqs) appData.es.faqs = [];
  if (!appData.en.faqs) appData.en.faqs = [];

  appData.es.faqs.push({ question: "Nueva Pregunta", answer: "Respuesta" });
  appData.en.faqs.push({ question: "New Question", answer: "Answer" });

  renderTabContent('es');
  renderTabContent('en');
};

window.removeFaqGlobal = (idx) => {
  if (confirm("¿Estás seguro de que deseas eliminar esta pregunta frecuente en ambos idiomas?")) {
    appData.es.faqs.splice(idx, 1);
    appData.en.faqs.splice(idx, 1);
    renderTabContent('es');
    renderTabContent('en');
  }
};

// RENDER LOCALIZED EDIT FORMS
function renderTabContent(lang) {
  const container = document.getElementById(`tab-${lang}`);
  const t = appData[lang];
  if (!t) return;

  let html = `
    <!-- Global buttons translation in Header -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">Botones Globales (${lang.toUpperCase()})</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Botón de Cabecera (e.g. Consultar / Inquire)</label>
          <input type="text" id="${lang}-header-btninquire" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.header?.btnInquire || ''}">
        </div>
      </div>
    </div>

    <!-- Section 1: Hero -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">1. Hero Section (${lang.toUpperCase()})</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Título Hero (e.g. Baila libre.)</label>
          <input type="text" id="${lang}-hero-title" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.hero?.title || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Subtítulo Hero (e.g. Percusión en vivo...)</label>
          <input type="text" id="${lang}-hero-subtitle" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.hero?.subtitle || ''}">
        </div>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Descripción / Propuesta de Valor</label>
        <textarea id="${lang}-hero-description" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" rows="2">${t.hero?.description || ''}</textarea>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto Botón WhatsApp</label>
          <input type="text" id="${lang}-hero-btnwa" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.hero?.btnWhatsapp || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto Botón Reel/Show</label>
          <input type="text" id="${lang}-hero-btnreel" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.hero?.btnReel || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Trust Strip (Separados por ' · ')</label>
          <input type="text" id="${lang}-hero-trust" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.hero?.trustStrip || ''}">
        </div>
      </div>
    </div>

    <!-- Section 2: Why Cucha -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 class="text-lg font-bold text-amber-500">2. Why Cucha Section (${lang.toUpperCase()})</h3>
        <button onclick="addWhyPoint()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded">+ Agregar Punto</button>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Título de Sección</label>
        <input type="text" id="${lang}-why-title" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.whyCucha?.title || ''}">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Texto Principal</label>
        <textarea id="${lang}-why-text" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" rows="2">${t.whyCucha?.text || ''}</textarea>
      </div>
      
      <div class="pt-4 space-y-4">
        <label class="block text-xs uppercase text-slate-400 font-bold">Puntos Clave</label>
        <div class="grid md:grid-cols-2 gap-4">
          ${t.whyCucha?.points?.map((pt, i) => `
            <div class="bg-slate-900 p-4 rounded border border-slate-800 space-y-2 relative">
              <button onclick="removeWhyPoint(${i})" class="absolute top-2 right-2 text-rose-500 hover:text-rose-400 font-bold px-1 text-xs">Eliminar</button>
              <label class="block text-[10px] text-slate-500 font-bold">Punto ${i+1}</label>
              <input type="text" id="${lang}-why-point-title-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${pt.title || ''}" placeholder="Título">
              <textarea id="${lang}-why-point-desc-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" rows="2" placeholder="Descripción">${pt.desc || ''}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Section 3: Experience -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">3. Experiencia Section (${lang.toUpperCase()})</h3>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Título de Sección</label>
        <input type="text" id="${lang}-exp-title" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.experience?.title || ''}">
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Párrafo 1</label>
          <textarea id="${lang}-exp-text1" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" rows="3">${t.experience?.text1 || ''}</textarea>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Párrafo 2</label>
          <textarea id="${lang}-exp-text2" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" rows="3">${t.experience?.text2 || ''}</textarea>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Cita Destacada (Quote)</label>
          <input type="text" id="${lang}-exp-quote" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.experience?.quote || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto Botón WhatsApp Sección</label>
          <input type="text" id="${lang}-exp-btnwa" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.experience?.btnWhatsapp || ''}">
        </div>
      </div>
    </div>

    <!-- Section 4: Event Types -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 class="text-lg font-bold text-amber-500">4. Formatos de Eventos (${lang.toUpperCase()})</h3>
        <button onclick="addEvent()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded">+ Agregar Formato</button>
      </div>
      <div class="space-y-4">
        ${t.eventTypes?.map((ev, i) => `
          <div class="bg-slate-900 p-4 rounded border border-slate-800 grid md:grid-cols-3 gap-4 relative">
            <button onclick="removeEvent(${i})" class="absolute top-2 right-2 text-rose-500 hover:text-rose-400 font-bold px-1 text-xs">Eliminar</button>
            <div>
              <label class="block text-[10px] text-slate-500 font-bold">Título Evento (${ev.id || 'nuevo'})</label>
              <input type="text" id="${lang}-event-title-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${ev.title || ''}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 font-bold">Descripción</label>
              <textarea id="${lang}-event-desc-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" rows="2">${ev.desc || ''}</textarea>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 font-bold">Imagen</label>
              <div class="flex gap-2">
                <input type="text" id="${lang}-event-img-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" value="${ev.image || ''}">
                <input type="file" id="upload-${lang}-event-img-${i}" class="hidden" onchange="handleFileUpload('upload-${lang}-event-img-${i}', '${lang}-event-img-${i}')">
                <button onclick="document.getElementById('upload-${lang}-event-img-${i}').click()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 rounded text-xs font-semibold whitespace-nowrap">Subir</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section 5: Social Proof -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 class="text-lg font-bold text-amber-500">5. Credenciales y Testimonios (${lang.toUpperCase()})</h3>
        <button onclick="addTestimonial()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded">+ Agregar Testimonio</button>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Línea de Credibilidad Principal</label>
          <input type="text" id="${lang}-proof-line" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.socialProof?.credibilityLine || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto Botón WhatsApp Sección</label>
          <input type="text" id="${lang}-proof-btnwa" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.socialProof?.btnWhatsapp || ''}">
        </div>
      </div>
      
      <div class="pt-4 space-y-4">
        <label class="block text-xs uppercase text-slate-400 font-bold">Testimonios</label>
        <div class="space-y-4">
          ${t.socialProof?.testimonials?.map((test, i) => `
            <div class="bg-slate-900 p-4 rounded border border-slate-800 space-y-2 relative">
              <button onclick="removeTestimonial(${i})" class="absolute top-2 right-2 text-rose-500 hover:text-rose-400 font-bold px-1 text-xs">Eliminar</button>
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-[10px] text-slate-500">Autor</label>
                  <input type="text" id="${lang}-test-author-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${test.author || ''}">
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500">Rol / Lugar</label>
                  <input type="text" id="${lang}-test-role-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${test.role || ''}">
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-slate-500">Comentario</label>
                <textarea id="${lang}-test-text-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" rows="2">${test.text || ''}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Section 6: Booking Process -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">6. Proceso de Reserva (${lang.toUpperCase()})</h3>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Título de Sección</label>
        <input type="text" id="${lang}-book-title" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.bookingProcess?.title || ''}">
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        ${t.bookingProcess?.steps?.map((st, i) => `
          <div class="bg-slate-900 p-4 rounded border border-slate-800 space-y-2">
            <label class="block text-[10px] text-slate-500 font-bold">Paso ${i+1}</label>
            <input type="text" id="${lang}-step-title-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${st.title || ''}">
            <textarea id="${lang}-step-desc-${i}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" rows="2">${st.desc || ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section 7: FAQ Accordion -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 class="text-lg font-bold text-amber-500">7. FAQs Accordion (${lang.toUpperCase()})</h3>
        <button onclick="addFaqGlobal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded">+ Agregar FAQ</button>
      </div>
      <div class="space-y-4" id="${lang}-faqs-container">
        <!-- populated separately -->
      </div>
    </div>

    <!-- Section 8: Contact Form Submit Button -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">8. Formulario de Reserva (${lang.toUpperCase()})</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto Botón de Envío (e.g. Enviar consulta / Send Inquiry)</label>
          <input type="text" id="${lang}-contact-btnsubmit" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.contact?.btnSubmit || ''}">
        </div>
      </div>
    </div>

    <!-- Section 9: Final CTA -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">9. Cierre / Final CTA (${lang.toUpperCase()})</h3>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Título de Cierre</label>
        <input type="text" id="${lang}-final-headline" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.finalCta?.headline || ''}">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Texto descriptivo</label>
        <textarea id="${lang}-final-text" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" rows="2">${t.finalCta?.text || ''}</textarea>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Texto Botón WhatsApp</label>
        <input type="text" id="${lang}-final-btn" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.finalCta?.btn || ''}">
      </div>
    </div>

    <!-- Section 10: Footer Links -->
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <h3 class="text-lg font-bold text-amber-500 border-b border-slate-700 pb-2">10. Footer y Legales (${lang.toUpperCase()})</h3>
      <div class="grid md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Enlace Privacidad</label>
          <input type="text" id="${lang}-footer-privacy" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.footer?.privacy || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Enlace Términos</label>
          <input type="text" id="${lang}-footer-terms" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.footer?.terms || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Enlace Contacto</label>
          <input type="text" id="${lang}-footer-contact" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.footer?.contact || ''}">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Texto de Copyright (Legal)</label>
          <input type="text" id="${lang}-footer-legal" class="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" value="${t.footer?.legal || ''}">
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  renderFaqsList(lang);
}

// RENDER ACCORDION FAQ SEPARATELY FOR ADD/DELETE
function renderFaqsList(lang) {
  const container = document.getElementById(`${lang}-faqs-container`);
  if (!container) return;
  
  const faqs = appData[lang].faqs || [];
  container.innerHTML = '';

  faqs.forEach((faq, idx) => {
    container.innerHTML += `
      <div class="bg-slate-900 p-4 rounded border border-slate-800 relative">
        <button onclick="removeFaqGlobal(${idx})" class="absolute top-2 right-2 text-rose-500 hover:text-rose-400 font-bold px-2 text-sm">X Eliminar</button>
        <div class="space-y-2">
          <div>
            <label class="block text-[10px] text-slate-500">Pregunta ${idx + 1}</label>
            <input type="text" id="${lang}-faq-question-${idx}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value="${faq.question || ''}">
          </div>
          <div>
            <label class="block text-[10px] text-slate-500">Respuesta</label>
            <textarea id="${lang}-faq-answer-${idx}" class="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-xs" rows="2">${faq.answer || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  });
}

window.saveChanges = async () => {
  // 1. Save general fields
  if (!appData.general) appData.general = {};
  appData.general.logoText = document.getElementById('gen-logo-text').value;
  appData.general.logoImage = document.getElementById('gen-logo-image').value;
  appData.general.whatsapp = document.getElementById('gen-whatsapp').value;
  appData.general.instagram = document.getElementById('gen-instagram').value;
  appData.general.youtube = document.getElementById('gen-youtube').value;
  
  // Save video URLs array
  const finalVideoUrls = [];
  for (let i = 0; i < localVideoUrls.length; i++) {
    const inputEl = document.getElementById(`gen-video-url-${i}`);
    if (inputEl && inputEl.value.trim()) {
      finalVideoUrls.push(convertToEmbedUrl(inputEl.value.trim()));
    }
  }
  appData.general.videoUrls = finalVideoUrls;
  appData.general.heroVideoUrl = finalVideoUrls[0] || '';
  
  appData.general.pressKitUrl = document.getElementById('gen-press-kit').value;
  
  appData.general.heroImages = [document.getElementById('gen-img-hero').value];
  appData.general.heroOpacity = parseInt(document.getElementById('gen-hero-opacity').value, 10);
  appData.general.experienceImage = document.getElementById('gen-img-experience').value;
  appData.general.bioImage = document.getElementById('gen-img-bio').value;

  // Save gallery images
  appData.general.galleryImages = [0, 1, 2, 3].map(i => document.getElementById(`gen-gallery-img-${i}`).value);

  // Save visibility settings
  if (!appData.general.sectionsVisibility) appData.general.sectionsVisibility = {};
  appData.general.sectionsVisibility.whyCucha = document.getElementById('vis-whyCucha').checked;
  appData.general.sectionsVisibility.experience = document.getElementById('vis-experience').checked;
  appData.general.sectionsVisibility.eventTypes = document.getElementById('vis-eventTypes').checked;
  appData.general.sectionsVisibility.socialProof = document.getElementById('vis-socialProof').checked;
  appData.general.sectionsVisibility.gallery = document.getElementById('vis-gallery').checked;
  appData.general.sectionsVisibility.bookingProcess = document.getElementById('vis-bookingProcess').checked;
  appData.general.sectionsVisibility.faqs = document.getElementById('vis-faqs').checked;
  appData.general.sectionsVisibility.contactForm = document.getElementById('vis-contactForm').checked;
  appData.general.sectionsVisibility.finalCta = document.getElementById('vis-finalCta').checked;

  // 2. Save translated language fields (ES & EN)
  ['es', 'en'].forEach(lang => {
    if (!appData[lang]) appData[lang] = {};
    
    // Header
    if (!appData[lang].header) appData[lang].header = {};
    appData[lang].header.btnInquire = document.getElementById(`${lang}-header-btninquire`).value;

    // Hero
    if (!appData[lang].hero) appData[lang].hero = {};
    appData[lang].hero.title = document.getElementById(`${lang}-hero-title`).value;
    appData[lang].hero.subtitle = document.getElementById(`${lang}-hero-subtitle`).value;
    appData[lang].hero.description = document.getElementById(`${lang}-hero-description`).value;
    appData[lang].hero.btnWhatsapp = document.getElementById(`${lang}-hero-btnwa`).value;
    appData[lang].hero.btnReel = document.getElementById(`${lang}-hero-btnreel`).value;
    appData[lang].hero.trustStrip = document.getElementById(`${lang}-hero-trust`).value;

    // Why Cucha
    if (!appData[lang].whyCucha) appData[lang].whyCucha = {};
    appData[lang].whyCucha.title = document.getElementById(`${lang}-why-title`).value;
    appData[lang].whyCucha.text = document.getElementById(`${lang}-why-text`).value;
    appData[lang].whyCucha.points = (appData[lang].whyCucha.points || []).map((_, i) => ({
      title: document.getElementById(`${lang}-why-point-title-${i}`).value,
      desc: document.getElementById(`${lang}-why-point-desc-${i}`).value
    }));

    // Experience
    if (!appData[lang].experience) appData[lang].experience = {};
    appData[lang].experience.title = document.getElementById(`${lang}-exp-title`).value;
    appData[lang].experience.text1 = document.getElementById(`${lang}-exp-text1`).value;
    appData[lang].experience.text2 = document.getElementById(`${lang}-exp-text2`).value;
    appData[lang].experience.quote = document.getElementById(`${lang}-exp-quote`).value;
    appData[lang].experience.btnWhatsapp = document.getElementById(`${lang}-exp-btnwa`).value;

    // Event Types
    appData[lang].eventTypes = (appData[lang].eventTypes || []).map((ev, i) => ({
      id: ev.id,
      title: document.getElementById(`${lang}-event-title-${i}`).value,
      desc: document.getElementById(`${lang}-event-desc-${i}`).value,
      image: document.getElementById(`${lang}-event-img-${i}`).value
    }));

    // Social Proof
    if (!appData[lang].socialProof) appData[lang].socialProof = {};
    appData[lang].socialProof.credibilityLine = document.getElementById(`${lang}-proof-line`).value;
    appData[lang].socialProof.btnWhatsapp = document.getElementById(`${lang}-proof-btnwa`).value;
    appData[lang].socialProof.testimonials = (appData[lang].socialProof.testimonials || []).map((_, i) => ({
      author: document.getElementById(`${lang}-test-author-${i}`).value,
      role: document.getElementById(`${lang}-test-role-${i}`).value,
      text: document.getElementById(`${lang}-test-text-${i}`).value
    }));

    // Booking Process
    if (!appData[lang].bookingProcess) appData[lang].bookingProcess = {};
    appData[lang].bookingProcess.title = document.getElementById(`${lang}-book-title`).value;
    appData[lang].bookingProcess.steps.forEach((st, i) => {
      st.title = document.getElementById(`${lang}-step-title-${i}`).value;
      st.desc = document.getElementById(`${lang}-step-desc-${i}`).value;
    });

    // FAQs (sync values from editable inputs)
    if (appData[lang].faqs) {
      appData[lang].faqs.forEach((faq, i) => {
        faq.question = document.getElementById(`${lang}-faq-question-${i}`).value;
        faq.answer = document.getElementById(`${lang}-faq-answer-${i}`).value;
      });
    }

    // Contact
    if (!appData[lang].contact) appData[lang].contact = {};
    appData[lang].contact.btnSubmit = document.getElementById(`${lang}-contact-btnsubmit`).value;

    // Final CTA
    if (!appData[lang].finalCta) appData[lang].finalCta = {};
    appData[lang].finalCta.headline = document.getElementById(`${lang}-final-headline`).value;
    appData[lang].finalCta.text = document.getElementById(`${lang}-final-text`).value;
    appData[lang].finalCta.btn = document.getElementById(`${lang}-final-btn`).value;

    // Footer
    if (!appData[lang].footer) appData[lang].footer = {};
    appData[lang].footer.privacy = document.getElementById(`${lang}-footer-privacy`).value;
    appData[lang].footer.terms = document.getElementById(`${lang}-footer-terms`).value;
    appData[lang].footer.contact = document.getElementById(`${lang}-footer-contact`).value;
    appData[lang].footer.legal = document.getElementById(`${lang}-footer-legal`).value;
  });

  // 3. Post to Express endpoint
  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(appData)
    });

    if (res.ok) {
      alert("Cambios guardados con éxito y aplicados en vivo!");
      // Rerender lists
      renderTabContent('es');
      renderTabContent('en');
    } else {
      alert("Error al guardar: Contraseña incorrecta o error en el servidor.");
    }
  } catch(e) {
    alert("Error de conexión");
  }
};
