// Subscriptions Component for managing active recurring boxes and editing frequencies
import { getSubscriptions, addSubscription, deleteSubscription } from '../utils/db.js';
import { PRODUCTS } from '../data/mockData.js';
import { showToast, navigateTo } from '../main.js';

export async function renderSubscriptions(container) {
  const subscriptions = await getSubscriptions();

  function render() {
    container.innerHTML = '';

    // Header navigation
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <button id="btn-back-to-dash-subs" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Mis Suscripciones</h2>
      </div>
      <p style="font-size: 0.8rem; margin-left: 40px;">Programa tus despachos de alimento e higiene y ahorra un 10% adicional.</p>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-subs').addEventListener('click', () => navigateTo('dashboard'));

    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '12px';
    container.appendChild(listContainer);

    if (subscriptions.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem 1rem;">
          <span class="material-symbols-rounded" style="font-size: 48px; color: var(--text-muted); margin-bottom: 0.5rem;">autorenew</span>
          <h4 style="font-size: 0.95rem; color: var(--text-secondary);">Sin suscripciones activas</h4>
          <p style="font-size: 0.8rem; margin-top: 4px; margin-bottom: 1.5rem; line-height: 1.4;">
            No tienes despachos recurrentes configurados. Suscríbete a tus marcas favoritas desde el catálogo y olvídate de olvidar su comida.
          </p>
          <button id="btn-subs-goto-catalog" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.65rem 1.25rem;">
            Ver Productos Suscribibles
          </button>
        </div>
      `;
      
      setTimeout(() => {
        document.getElementById('btn-subs-goto-catalog')?.addEventListener('click', () => navigateTo('catalog'));
      }, 50);
      return;
    }

    listContainer.innerHTML = subscriptions.map(sub => {
      const prod = PRODUCTS.find(p => p.id === sub.productId);
      const isPaused = sub.status === 'Pausada';
      
      return `
        <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid ${isPaused ? 'var(--text-muted)' : 'var(--secondary)'};">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="width: 48px; height: 48px; border-radius: 8px; background: ${prod?.imageBg || 'var(--primary)'}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.75rem;">
              ${sub.brand[0]}
            </div>
            
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <span style="font-size: 0.7rem; color: var(--primary); font-weight: bold; text-transform: uppercase;">${sub.brand}</span>
                  <h4 style="font-size: 0.9rem; font-weight: bold; margin-top: 1px; color: ${isPaused ? 'var(--text-secondary)' : 'var(--text-primary)'};">${sub.name}</h4>
                </div>
                <span class="pill" style="font-size: 0.65rem; padding: 2px 6px; border-color: ${isPaused ? 'var(--text-muted)' : 'var(--secondary)'}; color: ${isPaused ? 'var(--text-muted)' : 'var(--secondary)'};">
                  ${sub.status}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                <span>Precio Suscripción:</span>
                <strong>$${sub.price.toLocaleString('es-CL')} <span style="font-size: 0.7rem; color: var(--secondary); font-weight: normal;">(Ahorro 10%)</span></strong>
              </div>

              <!-- Next Delivery / Frequency controls -->
              <div style="background-color: rgba(255,255,255,0.02); padding: 8px; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color); font-size: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="color: var(--text-muted);">Próximo Despacho:</span>
                  <strong style="color: ${isPaused ? 'var(--text-muted)' : 'var(--text-primary)'};">${isPaused ? 'En Pausa' : sub.nextDeliveryDate}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: var(--text-muted);">Frecuencia actual:</span>
                  <select class="select-frequency-inline" data-id="${sub.id}" style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; color: var(--text-primary); outline: none;">
                    <option value="15" ${sub.frequency === 15 ? 'selected' : ''}>Cada 15 días</option>
                    <option value="30" ${sub.frequency === 30 ? 'selected' : ''}>Cada 30 días</option>
                    <option value="45" ${sub.frequency === 45 ? 'selected' : ''}>Cada 45 días</option>
                    <option value="60" ${sub.frequency === 60 ? 'selected' : ''}>Cada 60 días</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
                <button class="btn btn-secondary btn-pause-sub" data-id="${sub.id}" style="padding: 4px 10px; font-size: 0.75rem; flex: 1;">
                  ${isPaused ? 'Activar' : 'Pausar'}
                </button>
                <button class="btn btn-secondary btn-cancel-sub" data-id="${sub.id}" style="padding: 4px 10px; font-size: 0.75rem; color: var(--danger); border-color: rgba(239, 68, 68, 0.2); flex: 1;">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach frequency update listeners
    listContainer.querySelectorAll('.select-frequency-inline').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = select.dataset.id;
        const newFreq = parseInt(e.target.value);
        const sub = subscriptions.find(s => s.id === id);
        
        if (sub) {
          sub.frequency = newFreq;
          
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + newFreq);
          sub.nextDeliveryDate = newDate.toISOString().split('T')[0];
          
          await addSubscription(sub);
          showToast(`Frecuencia de entrega actualizada a ${newFreq} días.`);
          render();
        }
      });
    });

    // Attach Pausa / Resume listeners
    listContainer.querySelectorAll('.btn-pause-sub').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const sub = subscriptions.find(s => s.id === id);
        
        if (sub) {
          if (sub.status === 'Activa') {
            sub.status = 'Pausada';
            showToast('Suscripción pausada con éxito.');
          } else {
            sub.status = 'Activa';
            showToast('Suscripción reactivada con éxito.');
          }
          await addSubscription(sub);
          render();
        }
      });
    });

    // Attach Cancel listeners
    listContainer.querySelectorAll('.btn-cancel-sub').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('¿Estás seguro de que deseas cancelar definitivamente esta entrega recurrente?')) {
          await deleteSubscription(id);
          showToast('Suscripción cancelada.');
          navigateTo('subscriptions');
        }
      });
    });
  }

  // Initial load
  render();
}
