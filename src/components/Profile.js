// Profile Component for user details, loyalty points and quick access to health tracker and subscriptions
import { getProfile, getPets } from '../utils/db.js';
import { navigateTo } from '../main.js';

export async function renderProfile(container) {
  const profile = await getProfile();
  const pets = await getPets();

  function render() {
    container.innerHTML = '';

    if (!profile) {
      container.innerHTML = `<p>Error: Perfil no encontrado.</p>`;
      return;
    }

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-back-to-dash-prof" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Mi Perfil PetOne</h2>
      </div>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-prof').addEventListener('click', () => navigateTo('dashboard'));

    // User details card
    const userCard = document.createElement('div');
    userCard.className = 'glass-card';
    userCard.style.padding = '1rem 1.25rem';
    userCard.style.marginBottom = '1.25rem';
    userCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem;">
          ${profile.name[0]}
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: bold; margin: 0;">${profile.name}</h3>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${profile.email}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 0.85rem; color: var(--text-secondary);">
        <span>Teléfono: <strong>${profile.phone}</strong></span>
        <span>Puntos: <strong style="color: var(--secondary);">${profile.points}</strong></span>
      </div>
    `;
    container.appendChild(userCard);

    // List of Pets with shortcuts
    const petsSection = document.createElement('div');
    petsSection.style.marginBottom = '1.25rem';
    petsSection.innerHTML = `
      <h3 style="font-size: 0.95rem; margin-bottom: 8px;">Tus Mascotas</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${pets.map(pet => `
          <div class="card" style="margin-bottom: 0; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">${pet.species === 'perro' ? '🐶' : '🐱'}</span>
              <div>
                <strong style="font-size: 0.85rem;">${pet.name}</strong>
                <p style="font-size: 0.7rem; color: var(--text-secondary);">${pet.breed} • ${pet.age} años</p>
              </div>
            </div>
            <button class="btn btn-secondary btn-pet-health" data-id="${pet.id}" style="width: auto; padding: 4px 10px; font-size: 0.7rem; border-radius: 6px;">
              Ver Salud
            </button>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(petsSection);

    // General Menu Actions
    const menuActions = document.createElement('div');
    menuActions.style.display = 'flex';
    menuActions.style.flexDirection = 'column';
    menuActions.style.gap = '8px';
    container.appendChild(menuActions);

    menuActions.innerHTML = `
      <button id="btn-menu-subs" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;">
        <span class="material-symbols-rounded" style="color: var(--primary);">autorenew</span>
        <div style="flex: 1; margin-left: 8px;">
          <div style="font-size: 0.85rem; font-weight: bold;">Mis Suscripciones</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Gestiona tus despachos recurrentes</div>
        </div>
        <span class="material-symbols-rounded" style="color: var(--text-muted); font-size: 18px;">chevron_right</span>
      </button>

      <button id="btn-menu-health" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;">
        <span class="material-symbols-rounded" style="color: var(--secondary);">monitor_weight</span>
        <div style="flex: 1; margin-left: 8px;">
          <div style="font-size: 0.85rem; font-weight: bold;">Diario de Salud y Pesos</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Historial médico y digestivo de mascotas</div>
        </div>
        <span class="material-symbols-rounded" style="color: var(--text-muted); font-size: 18px;">chevron_right</span>
      </button>

      <button id="btn-menu-privacy" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px;">
        <span class="material-symbols-rounded" style="color: var(--accent);">shield_lock</span>
        <div style="flex: 1; margin-left: 8px;">
          <div style="font-size: 0.85rem; font-weight: bold;">Ajustes de Privacidad</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Gobernanza y consentimientos de datos</div>
        </div>
        <span class="material-symbols-rounded" style="color: var(--text-muted); font-size: 18px;">chevron_right</span>
      </button>

      <button id="btn-menu-reset" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px; margin-top: 1rem; border-color: rgba(239, 68, 68, 0.2);">
        <span class="material-symbols-rounded" style="color: var(--danger);">logout</span>
        <div style="flex: 1; margin-left: 8px;">
          <div style="font-size: 0.85rem; font-weight: bold; color: var(--danger);">Cerrar Sesión / Reiniciar App</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Borra los datos de este dispositivo</div>
        </div>
      </button>
    `;

    // Event listeners
    petsSection.querySelectorAll('.btn-pet-health').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo('health', btn.dataset.id);
      });
    });

    document.getElementById('btn-menu-subs').addEventListener('click', () => navigateTo('subscriptions'));
    document.getElementById('btn-menu-health').addEventListener('click', () => navigateTo('health', pets[0]?.id));
    document.getElementById('btn-menu-privacy').addEventListener('click', () => navigateTo('analytics')); // open privacy tab
    document.getElementById('btn-menu-reset').addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas cerrar sesión y reiniciar tu perfil? Esto borrará tus datos locales.')) {
        indexedDB.deleteDatabase('petone_db');
        window.location.reload();
      }
    });
  }

  // Initial load
  render();
}
