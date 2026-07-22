// Onboarding Component for household and multi-pet registration
import { saveProfile, addPet } from '../utils/db.js';

export function renderOnboarding(container) {
  let step = 1;
  const householdData = {
    name: '',
    email: '',
    phone: '',
    points: 100 // Welcome points
  };
  const petsList = [];

  function render() {
    container.innerHTML = '';
    
    // Title & Welcome
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '2rem';
    header.innerHTML = `
      <img src="/logo-petone.png" alt="PetOne Logo" style="height: 64px; width: auto; object-fit: contain; margin-bottom: 0.5rem; filter: drop-shadow(0 0 8px var(--primary-glow));">
      <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800;">Bienvenido a PetOne</h1>
      <p style="margin-top: 4px;">Configura tu hogar para recibir recomendaciones personalizadas</p>
    `;
    container.appendChild(header);

    // Step Indicator
    const progress = document.createElement('div');
    progress.style.display = 'flex';
    progress.style.justifyContent = 'space-between';
    progress.style.alignItems = 'center';
    progress.style.marginBottom = '2rem';
    progress.style.position = 'relative';
    progress.innerHTML = `
      <div style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background-color: var(--border-color); z-index: 1;"></div>
      <div style="position: absolute; top: 50%; left: 0; width: ${step === 1 ? '0%' : step === 2 ? '50%' : '100%'}; height: 2px; background-color: var(--primary); z-index: 1; transition: width 0.3s ease;"></div>
      
      <div class="step-dot" style="width: 32px; height: 32px; border-radius: 50%; background-color: ${step >= 1 ? 'var(--primary)' : 'var(--bg-secondary)'}; border: 2px solid ${step >= 1 ? 'var(--primary)' : 'var(--border-color)'}; z-index: 2; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; color: white;">1</div>
      <div class="step-dot" style="width: 32px; height: 32px; border-radius: 50%; background-color: ${step >= 2 ? 'var(--primary)' : 'var(--bg-secondary)'}; border: 2px solid ${step >= 2 ? 'var(--primary)' : 'var(--border-color)'}; z-index: 2; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; color: ${step >= 2 ? 'white' : 'var(--text-secondary)'};">2</div>
      <div class="step-dot" style="width: 32px; height: 32px; border-radius: 50%; background-color: ${step >= 3 ? 'var(--primary)' : 'var(--bg-secondary)'}; border: 2px solid ${step >= 3 ? 'var(--primary)' : 'var(--border-color)'}; z-index: 2; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; color: ${step >= 3 ? 'white' : 'var(--text-secondary)'};">3</div>
    `;
    container.appendChild(progress);

    // Form Container
    const formBox = document.createElement('div');
    formBox.className = 'glass-card';
    container.appendChild(formBox);

    if (step === 1) {
      renderStep1(formBox);
    } else if (step === 2) {
      renderStep2(formBox);
    } else if (step === 3) {
      renderStep3(formBox);
    }
  }

  // STEP 1: Household / Account Registration
  function renderStep1(parent) {
    parent.innerHTML = `
      <h2 style="margin-bottom: 1.25rem;"><span class="material-symbols-rounded">home_iot_device</span> Datos del Hogar</h2>
      
      <div class="input-group">
        <label class="input-label">Nombre del Tutor</label>
        <input type="text" id="user-name" class="input-field" placeholder="Ej. Juan Pérez" value="${householdData.name}">
      </div>
      
      <div class="input-group">
        <label class="input-label">Correo Electrónico</label>
        <input type="email" id="user-email" class="input-field" placeholder="ejemplo@email.com" value="${householdData.email}">
      </div>
      
      <div class="input-group" style="margin-bottom: 2rem;">
        <label class="input-label">Teléfono de Contacto</label>
        <input type="tel" id="user-phone" class="input-field" placeholder="+56 9 1234 5678" value="${householdData.phone}">
      </div>
      
      <button class="btn btn-primary" id="btn-next-1">
        Siguiente: Agregar Mascotas
        <span class="material-symbols-rounded">arrow_forward</span>
      </button>
    `;

    document.getElementById('btn-next-1').addEventListener('click', () => {
      const name = document.getElementById('user-name').value.trim();
      const email = document.getElementById('user-email').value.trim();
      const phone = document.getElementById('user-phone').value.trim();

      if (!name || !email || !phone) {
        alert('Por favor, completa todos los campos del hogar.');
        return;
      }

      householdData.name = name;
      householdData.email = email;
      householdData.phone = phone;

      step = 2;
      render();
    });
  }

  // STEP 2: Pet Profiling (Supports adding multiple pets)
  // STEP 2: Pet Profiling (Supports adding multiple pets)
  let _tempPetPhoto = null;

  function renderStep2(parent) {
    parent.innerHTML = `
      <h2 style="margin-bottom: 1.25rem;"><span class="material-symbols-rounded">pets</span> Perfil de Mascotas</h2>
      <p style="margin-bottom: 1.25rem; font-size: 0.85rem;">Puedes ingresar una o más mascotas de tu hogar.</p>
      
      <!-- List of already added pets -->
      <div id="added-pets-list" style="margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 8px;"></div>
      
      <!-- Pet Form -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem; margin-top: 1rem;">
        <h3 style="margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 6px; font-size: 0.95rem;">
          <span class="material-symbols-rounded">add_circle</span> Nueva Mascota
        </h3>
        
        <!-- Pet Photo Upload Section -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 1rem;">
          <div id="onb-pet-photo-zone" style="width: 72px; height: 72px; border-radius: 50%; border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; background: var(--bg-secondary);">
            <div id="onb-pet-photo-ph" style="display: flex; flex-direction: column; align-items: center; color: var(--text-muted); text-align: center;">
              <span class="material-symbols-rounded" style="font-size: 24px;">add_a_photo</span>
              <span style="font-size: 0.55rem; font-weight: bold; margin-top: 2px;">Subir Foto</span>
            </div>
            <div id="onb-pet-photo-prev" style="position: absolute; inset: 0; display: none;"></div>
          </div>
          <input type="file" id="onb-pet-photo-input" accept="image/*" style="display: none;">
          <span style="font-size: 0.65rem; color: var(--text-muted);">Foto de perfil (Opcional)</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="input-group">
            <label class="input-label">Nombre</label>
            <input type="text" id="pet-name" class="input-field" placeholder="Nombre">
          </div>
          <div class="input-group">
            <label class="input-label">Especie</label>
            <select id="pet-species" class="input-field select-field">
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="input-group">
            <label class="input-label">Raza</label>
            <input type="text" id="pet-breed" class="input-field" placeholder="Ej. Golden Retriever">
          </div>
          <div class="input-group">
            <label class="input-label">Edad (Años)</label>
            <input type="number" id="pet-age" class="input-field" placeholder="Ej. 3" min="0" max="30">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div class="input-group">
            <label class="input-label">Tamaño</label>
            <select id="pet-size" class="input-field select-field">
              <option value="pequeño">Pequeño (1-10 kg)</option>
              <option value="mediano" selected>Mediano (11-25 kg)</option>
              <option value="grande">Grande (26-44 kg)</option>
              <option value="gigante">Gigante (+45 kg)</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Peso (kg)</label>
            <input type="number" id="pet-weight" class="input-field" placeholder="Ej. 18" step="0.1" min="0">
          </div>
        </div>

        <div class="input-group" style="margin-bottom: 1.5rem;">
          <label class="input-label">Condiciones / Alergias</label>
          <input type="text" id="pet-allergies" class="input-field" placeholder="Ninguna (Ej. Alergia al pollo, dermatitis)">
        </div>

        <button class="btn btn-secondary" id="btn-add-pet" style="margin-bottom: 1.5rem;">
          <span class="material-symbols-rounded">add</span>
          Agregar Mascota al Hogar
        </button>
      </div>

      <div style="display: flex; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
        <button class="btn btn-secondary" id="btn-back-2" style="flex: 1;">Atrás</button>
        <button class="btn btn-primary" id="btn-next-2" style="flex: 2;">Siguiente</button>
      </div>
    `;

    const addedList = document.getElementById('added-pets-list');
    
    // Connect Photo Selector
    const photoZone = document.getElementById('onb-pet-photo-zone');
    const photoInput = document.getElementById('onb-pet-photo-input');
    const photoPh = document.getElementById('onb-pet-photo-ph');
    const photoPrev = document.getElementById('onb-pet-photo-prev');

    photoZone.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          // Compress pet image using canvas
          const sizeLimit = 256;
          let w = img.width;
          let h = img.height;
          if (w > sizeLimit || h > sizeLimit) {
            if (w > h) {
              h = Math.round((h * sizeLimit) / w);
              w = sizeLimit;
            } else {
              w = Math.round((w * sizeLimit) / h);
              h = sizeLimit;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          _tempPetPhoto = canvas.toDataURL('image/jpeg', 0.85);

          photoPrev.innerHTML = `<img src="${_tempPetPhoto}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
          photoPrev.style.display = 'block';
          photoPh.style.display = 'none';
          photoZone.style.borderColor = 'var(--secondary)';
          photoZone.style.borderStyle = 'solid';
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    function refreshPetsList() {
      if (petsList.length === 0) {
        addedList.innerHTML = `<p style="font-style: italic; color: var(--text-muted); text-align: center;">Aún no has agregado mascotas.</p>`;
        return;
      }
      
      addedList.innerHTML = petsList.map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
              ${p.photo ? `
                <img src="${p.photo}" style="width: 100%; height: 100%; object-fit: cover;">
              ` : `
                <span style="font-size: 1.1rem;">${p.species === 'perro' ? '🐶' : '🐱'}</span>
              `}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">
                ${p.name}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">${p.breed} • ${p.age} años • ${p.weight} kg</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-icon delete-btn" data-idx="${idx}" style="width: 32px; height: 32px; border-radius: 6px;">
            <span class="material-symbols-rounded" style="font-size: 16px; color: var(--danger);">delete</span>
          </button>
        </div>
      `).join('');

      addedList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.dataset.idx);
          petsList.splice(idx, 1);
          refreshPetsList();
        });
      });
    }

    refreshPetsList();

    // Add Pet Click Event
    document.getElementById('btn-add-pet').addEventListener('click', () => {
      const name = document.getElementById('pet-name').value.trim();
      const species = document.getElementById('pet-species').value;
      const breed = document.getElementById('pet-breed').value.trim() || 'Cruza';
      const age = parseInt(document.getElementById('pet-age').value) || 0;
      const size = document.getElementById('pet-size').value;
      const weight = parseFloat(document.getElementById('pet-weight').value) || 0.0;
      const allergies = document.getElementById('pet-allergies').value.trim() || 'Ninguna';

      if (!name) {
        alert('Ingresa el nombre de la mascota.');
        return;
      }

      petsList.push({
        id: `pet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        species,
        breed,
        age,
        size,
        weight,
        allergies,
        photo: _tempPetPhoto
      });

      // Clear pet fields
      document.getElementById('pet-name').value = '';
      document.getElementById('pet-breed').value = '';
      document.getElementById('pet-age').value = '';
      document.getElementById('pet-weight').value = '';
      document.getElementById('pet-allergies').value = '';
      
      // Reset Photo Preview
      _tempPetPhoto = null;
      photoPrev.innerHTML = '';
      photoPrev.style.display = 'none';
      photoPh.style.display = 'flex';
      photoZone.style.borderColor = 'var(--border-color)';
      photoZone.style.borderStyle = 'dashed';

      refreshPetsList();
    });

    // Navigation buttons
    document.getElementById('btn-back-2').addEventListener('click', () => {
      step = 1;
      render();
    });

    document.getElementById('btn-next-2').addEventListener('click', () => {
      if (petsList.length === 0) {
        alert('Debes agregar al menos una mascota para continuar.');
        return;
      }
      step = 3;
      render();
    });
  }

  // STEP 3: Final confirmation & save to IndexedDB
  function renderStep3(parent) {
    parent.innerHTML = `
      <h2 style="margin-bottom: 1rem; text-align: center;"><span class="material-symbols-rounded" style="color: var(--secondary); font-size: 32px;">verified_user</span> ¡Hogar Listo!</h2>
      <p style="text-align: center; margin-bottom: 1.5rem;">Confirma los detalles del registro para activar tu cuenta de PetOne y recibir tus primeros 100 puntos de fidelidad.</p>

      <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 1.5rem;">
        <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 8px; color: var(--primary);">Tutor del Hogar:</div>
        <div style="font-size: 0.9rem; color: var(--text-primary);">${householdData.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${householdData.email} • ${householdData.phone}</div>
        
        <div style="font-weight: bold; font-size: 0.95rem; margin-top: 12px; margin-bottom: 8px; color: var(--primary);">Mascotas Registradas (${petsList.length}):</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${petsList.map(p => `<div style="font-size: 0.85rem; color: var(--text-secondary);">• <strong>${p.name}</strong> (${p.species === 'perro' ? 'Perro' : 'Gato'}, ${p.breed}, ${p.age} años)</div>`).join('')}
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" id="btn-back-3" style="flex: 1;">Atrás</button>
        <button class="btn btn-primary" id="btn-confirm-finish" style="flex: 2;">Confirmar y Entrar</button>
      </div>
    `;

    document.getElementById('btn-back-3').addEventListener('click', () => {
      step = 2;
      render();
    });

    document.getElementById('btn-confirm-finish').addEventListener('click', async () => {
      try {
        // Save profile
        await saveProfile(householdData);
        // Save all pets
        for (const pet of petsList) {
          await addPet(pet);
        }
        // Force complete page reload to initialize app shell
        window.location.reload();
      } catch (err) {
        console.error('Error al guardar datos de onboarding:', err);
        alert('Hubo un error al guardar tu perfil local. Inténtalo de nuevo.');
      }
    });
  }

  // Initial render
  render();
}
