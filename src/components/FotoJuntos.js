// FotoJuntos Component: Merges user selfie + pet photo in magical settings using AI
import { getAiPhotos, addAiPhoto, deleteAiPhoto, getPets, getProfile } from '../utils/db.js';
import { navigateTo, showToast } from '../main.js';

const JUNTOS_WORKER_URL = 'https://wufly-push.pablo77tapia.workers.dev/api/juntar-fotos';

const JUNTOS_LUGARES = [
  { label: '🏖️ Playa',     prompt: 'beautiful beach in Patagonia' },
  { label: '🏔️ Andes',     prompt: 'snowy Andes mountains at sunset' },
  { label: '🌌 Espacio',    prompt: 'outer space surrounded by stars and galaxies' },
  { label: '🌿 Bosque',     prompt: 'magical enchanted forest with glowing lights' },
  { label: '🏙️ Ciudad',    prompt: 'futuristic neon city skyline at night' },
];

export async function renderFotoJuntos(container) {
  const profile = await getProfile();
  const pets = await getPets();
  let aiPhotos = await getAiPhotos();

  let _jFotoMascota = null;
  let _jSelfie = null;
  let _jLugar = JUNTOS_LUGARES[0].prompt;
  let _selectedPetId = pets[0]?.id || '';

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-back-to-community" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0; font-size: 1.4rem;">✨ Juntos - IA</h2>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Fusiona una foto de tu mascota con tu selfie en un paisaje mágico creado por IA.</p>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-community').addEventListener('click', () => navigateTo('community'));

    if (pets.length === 0) {
      container.innerHTML += `
        <div class="card" style="text-align: center; padding: 1.5rem 1rem;">
          <span class="material-symbols-rounded" style="font-size: 36px; color: var(--text-muted); margin-bottom: 0.5rem;">pets</span>
          <h4 style="font-size: 0.9rem; color: var(--text-secondary);">No tienes mascotas registradas</h4>
          <p style="font-size: 0.75rem; margin-top: 4px; margin-bottom: 12px;">Registra al menos una mascota en el onboarding para usar esta función.</p>
          <button id="btn-goto-onboarding" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.5rem 1rem; width: auto;">Ir a Registrar</button>
        </div>
      `;
      setTimeout(() => {
        document.getElementById('btn-goto-onboarding')?.addEventListener('click', () => {
          indexedDB.deleteDatabase('petone_db');
          window.location.reload();
        });
      }, 50);
      return;
    }

    // Interactive Creator Card
    const creatorCard = document.createElement('div');
    creatorCard.className = 'glass-card';
    creatorCard.style.padding = '1.25rem';
    creatorCard.style.marginBottom = '1.5rem';
    container.appendChild(creatorCard);

    creatorCard.innerHTML = `
      <!-- Pet Selector -->
      <div class="input-group">
        <label class="input-label">Selecciona tu Mascota</label>
        <select id="juntos-select-pet" class="input-field select-field">
          ${pets.map(p => `<option value="${p.id}" ${p.id === _selectedPetId ? 'selected' : ''}>${p.name} (${p.breed})</option>`).join('')}
        </select>
      </div>

      <!-- Upload Fields Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1rem;">
        
        <!-- Pet Photo -->
        <div>
          <label class="input-label" style="font-size: 0.7rem; letter-spacing: 0.05em;">FOTO DE TU MASCOTA</label>
          <div id="juntos-z-mascota" style="aspect-ratio: 1/1; border: 2px dashed var(--border-color); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.01); overflow: hidden; position: relative;">
            <input type="file" id="juntos-input-mascota" accept="image/*" style="display:none;">
            <div id="juntos-ph-mascota" style="text-align: center; padding: 8px;">
              <span style="font-size: 1.8rem; display: block; margin-bottom: 4px;">📸</span>
              <span style="font-size: 0.75rem; font-weight: bold; color: var(--secondary);">Subir foto</span>
            </div>
            <div id="juntos-prev-mascota" style="display: none; position: absolute; inset: 0;"></div>
          </div>
        </div>

        <!-- User Selfie -->
        <div>
          <label class="input-label" style="font-size: 0.7rem; letter-spacing: 0.05em;">TU SELFIE</label>
          <div id="juntos-z-selfie" style="aspect-ratio: 1/1; border: 2px dashed var(--border-color); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.01); overflow: hidden; position: relative;">
            <input type="file" id="juntos-input-selfie" accept="image/*" style="display:none;">
            <div id="juntos-ph-selfie" style="text-align: center; padding: 8px;">
              <span style="font-size: 1.8rem; display: block; margin-bottom: 4px;">🤳</span>
              <span style="font-size: 0.75rem; font-weight: bold; color: var(--secondary);">Subir selfie</span>
            </div>
            <div id="juntos-prev-selfie" style="display: none; position: absolute; inset: 0;"></div>
          </div>
        </div>

      </div>

      <!-- Landscape Selector -->
      <div style="margin-bottom: 1.25rem;">
        <label class="input-label">Selecciona el Paisaje</label>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="juntos-lugares">
          ${JUNTOS_LUGARES.map((l, idx) => `
            <button class="btn btn-secondary btn-lugar" data-prompt="${l.prompt}" style="font-size: 0.75rem; padding: 6px 12px; width: auto; border-radius: 50px; background-color: ${l.prompt === _jLugar ? 'var(--secondary)' : 'none'}; border-color: ${l.prompt === _jLugar ? 'var(--secondary)' : 'var(--border-color)'}; color: ${l.prompt === _jLugar ? 'white' : 'var(--text-secondary)'};">
              ${l.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Action Button -->
      <button id="juntos-btn-generate" class="btn btn-primary" style="opacity: 0.5; pointer-events: none; background: linear-gradient(135deg, var(--primary), var(--secondary)); font-weight: bold;">
        ✨ Juntar con IA
      </button>

      <!-- Fused Image Output -->
      <div id="juntos-result-container" style="display: none; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem;"></div>
    `;

    // Connect interactions
    const petSelect = document.getElementById('juntos-select-pet');
    petSelect.addEventListener('change', (e) => {
      _selectedPetId = e.target.value;
    });

    const zm = document.getElementById('juntos-z-mascota');
    const inputM = document.getElementById('juntos-input-mascota');
    zm.addEventListener('click', () => inputM.click());
    inputM.addEventListener('change', (e) => handleImageUpload(e, 'mascota'));

    const zs = document.getElementById('juntos-z-selfie');
    const inputS = document.getElementById('juntos-input-selfie');
    zs.addEventListener('click', () => inputS.click());
    inputS.addEventListener('change', (e) => handleImageUpload(e, 'selfie'));

    creatorCard.querySelectorAll('.btn-lugar').forEach(btn => {
      btn.addEventListener('click', () => {
        _jLugar = btn.dataset.prompt;
        creatorCard.querySelectorAll('.btn-lugar').forEach(b => {
          b.style.backgroundColor = 'rgba(0,0,0,0)';
          b.style.borderColor = 'var(--border-color)';
          b.style.color = 'var(--text-secondary)';
        });
        btn.style.backgroundColor = 'var(--secondary)';
        btn.style.borderColor = 'var(--secondary)';
        btn.style.color = 'white';
      });
    });

    const genBtn = document.getElementById('juntos-btn-generate');
    genBtn.addEventListener('click', () => processFusion());

    // 6. User Gallery at bottom
    renderGallery();
  }

  // Handle uploaded files
  function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const MAX = 640;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL('image/jpeg', 0.8);

        if (type === 'mascota') {
          _jFotoMascota = b64;
          setUploadPreview('juntos-prev-mascota', 'juntos-ph-mascota', 'juntos-z-mascota', b64);
        } else {
          _jSelfie = b64;
          setUploadPreview('juntos-prev-selfie', 'juntos-ph-selfie', 'juntos-z-selfie', b64);
        }
        checkReadyState();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function setUploadPreview(prevId, phId, zoneId, src) {
    const prev = document.getElementById(prevId);
    const ph = document.getElementById(phId);
    const zone = document.getElementById(zoneId);
    
    prev.innerHTML = `<img src="${src}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
    prev.style.display = 'block';
    ph.style.display = 'none';
    zone.style.borderColor = 'var(--secondary)';
    zone.style.borderStyle = 'solid';
  }

  function checkReadyState() {
    const genBtn = document.getElementById('juntos-btn-generate');
    if (!genBtn) return;
    const ready = _jFotoMascota && _jSelfie;
    genBtn.style.opacity = ready ? '1' : '0.5';
    genBtn.style.pointerEvents = ready ? 'auto' : 'none';
  }

  // Call Worker and Poll Status
  async function processFusion() {
    const genBtn = document.getElementById('juntos-btn-generate');
    const resultContainer = document.getElementById('juntos-result-container');
    const pet = pets.find(p => p.id === _selectedPetId);

    genBtn.style.pointerEvents = 'none';
    genBtn.style.opacity = '0.5';
    resultContainer.style.display = 'none';

    // Show processing overlay
    const overlay = document.createElement('div');
    overlay.id = 'juntos-processing-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '4000';
    overlay.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; text-align: center; padding: 20px;">
        <div class="loader" style="width: 48px; height: 48px; border: 4px solid var(--secondary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h3 style="color: white; font-size: 1.15rem; font-weight: bold; margin: 0;" id="overlay-status-text">Generando Foto Mágica...</h3>
        <p style="color: #cbd5e1; font-size: 0.8rem; max-width: 250px; margin: 0;">La IA está recortando y fusionando las siluetas en tu paisaje seleccionado.</p>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      // Step 1: Submit photos to CF worker
      const res = await fetch(JUNTOS_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfie: _jSelfie,
          fotoMascota: _jFotoMascota,
          lugar: _jLugar,
          tipoPet: pet.species === 'gato' ? 'cat' : 'dog'
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { requestId, statusUrl, responseUrl } = await res.json();
      if (!requestId || !statusUrl || !responseUrl) throw new Error('Respuesta del Worker incompleta.');

      // Step 2: Poll status
      let finalImageUrl = null;
      const JUNTOS_STATUS_URL = JUNTOS_WORKER_URL.replace('/api/juntar-fotos', '/api/juntar-status');
      const start = Date.now();
      let attempt = 0;

      while (!finalImageUrl && Date.now() - start < 90000) {
        await new Promise(r => setTimeout(r, attempt < 3 ? 4000 : 5000));
        attempt++;

        document.getElementById('overlay-status-text').textContent = `Fusionando imágenes${'.'.repeat((attempt % 3) + 1)}`;

        const pollRes = await fetch(
          `${JUNTOS_STATUS_URL}?id=${requestId}&statusUrl=${encodeURIComponent(statusUrl)}&responseUrl=${encodeURIComponent(responseUrl)}`
        );
        if (!pollRes.ok) continue;
        const pollData = await pollRes.json();

        if (pollData.status === 'COMPLETED' && pollData.imagenUrl) {
          finalImageUrl = pollData.imagenUrl;
        } else if (pollData.status === 'FAILED') {
          throw new Error('La tarea de IA falló en el servidor.');
        }
      }

      if (!finalImageUrl) throw new Error('Timeout esperando la respuesta del servidor de IA.');

      // Hide Loader
      overlay.remove();

      // Display Result
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <h3 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--secondary); display: flex; align-items: center; gap: 4px;">
          <span class="material-symbols-rounded" style="font-size: 16px;">celebrate</span> ¡Foto Generada!
        </h3>
        <div style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.35);">
          <img src="${finalImageUrl}" style="width: 100%; display: block;" alt="Foto Juntos IA">
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="juntos-btn-save" class="btn btn-primary" style="flex: 2; font-weight: bold; background: linear-gradient(135deg, var(--primary), var(--secondary));">
            💾 Guardar en Mi Galería
          </button>
          <button id="juntos-btn-share" class="btn btn-secondary btn-icon" style="width: 44px; height: 44px; flex-shrink: 0;" title="Compartir">
            <span class="material-symbols-rounded" style="font-size: 18px;">share</span>
          </button>
        </div>
      `;

      document.getElementById('juntos-btn-share').addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: '✨ Mi Foto Juntos IA - PetOne',
            text: '¡Mira la foto que generé con mi mascota usando IA!',
            url: finalImageUrl
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(finalImageUrl);
          showToast('Enlace de foto copiado al portapapeles.');
        }
      });

      document.getElementById('juntos-btn-save').addEventListener('click', async () => {
        const saveBtn = document.getElementById('juntos-btn-save');
        saveBtn.style.pointerEvents = 'none';
        saveBtn.style.opacity = '0.5';
        
        await addAiPhoto({
          id: `aiph-${Date.now()}`,
          petId: _selectedPetId,
          imageUrl: finalImageUrl,
          timestamp: Date.now()
        });

        showToast('¡Foto guardada en tu galería local y sincronizada!');
        saveBtn.innerHTML = '✓ Guardado';
        saveBtn.style.backgroundColor = 'var(--secondary)';
        
        // Refresh Gallery
        aiPhotos = await getAiPhotos();
        renderGallery();
      });

    } catch (err) {
      console.error(err);
      overlay.remove();
      showToast('Error al generar la foto IA. Intenta de nuevo.');
      genBtn.style.pointerEvents = 'auto';
      genBtn.style.opacity = '1';
    }
  }

  // Render saved AI photos list
  function renderGallery() {
    let gallerySection = document.getElementById('juntos-gallery-section');
    if (!gallerySection) {
      gallerySection = document.createElement('div');
      gallerySection.id = 'juntos-gallery-section';
      gallerySection.style.marginTop = '1.5rem';
      container.appendChild(gallerySection);
    }

    gallerySection.innerHTML = `<h2><span class="material-symbols-rounded" style="color: var(--accent);">auto_awesome_motion</span> Mi Galería IA</h2>`;

    if (aiPhotos.length === 0) {
      gallerySection.innerHTML += `
        <div class="card" style="text-align: center; padding: 1.25rem 1rem; border-style: dashed;">
          <span style="font-size: 2rem; display: block; margin-bottom: 6px;">🖼️</span>
          <p style="font-size: 0.75rem; color: var(--text-secondary);">Aún no tienes fotos de IA guardadas. ¡Crea la primera arriba!</p>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px';
    grid.style.marginTop = '8px';
    gallerySection.appendChild(grid);

    grid.innerHTML = aiPhotos.map(ph => {
      const pet = pets.find(p => p.id === ph.petId);
      return `
        <div class="glass-card" style="padding: 8px; display: flex; flex-direction: column; position: relative;">
          <div style="aspect-ratio: 1/1; border-radius: 8px; overflow: hidden; margin-bottom: 6px; cursor: pointer;" class="btn-view-photo" data-url="${ph.imageUrl}">
            <img src="${ph.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; font-weight: bold; color: var(--text-secondary);">Mascota: ${pet ? pet.name : 'Mascota'}</span>
            <button class="btn-delete-photo" data-id="${ph.id}" style="background: none; border: none; padding: 2px; cursor: pointer; color: var(--danger); display: flex; align-items: center;" title="Eliminar">
              <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click for preview modal
    grid.querySelectorAll('.btn-view-photo').forEach(img => {
      img.addEventListener('click', () => {
        openPreviewModal(img.dataset.url);
      });
    });

    // Attach click for deleting photo
    grid.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas eliminar esta foto de tu galería?')) {
          const phId = btn.dataset.id;
          await deleteAiPhoto(phId);
          showToast('Foto eliminada.');
          aiPhotos = await getAiPhotos();
          renderGallery();
        }
      });
    });
  }

  // IMAGE PREVIEW MODAL
  function openPreviewModal(url) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '5000';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div style="position: relative; max-width: 380px; width: 100%; border-radius: 20px; overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: 0 12px 36px rgba(0,0,0,0.5); padding: 12px;">
        <img src="${url}" style="width: 100%; border-radius: 12px; display: block;" alt="Preview">
        <button id="btn-close-prev" class="btn btn-secondary btn-icon" style="position: absolute; top: 20px; right: 20px; width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-close-prev').addEventListener('click', () => overlay.remove());
  }

  // Initial load
  render();
}
