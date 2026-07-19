// Store Locator Component for finding physical stores and checking stock availability in real time
import { STORES, PRODUCTS } from '../data/mockData.js';
import { showToast } from '../main.js';

export async function renderStoreLocator(container) {
  let selectedProductId = PRODUCTS[0].id;
  const localStoresState = JSON.parse(JSON.stringify(STORES)); // Local clone to allow real-time booking deductions

  function render() {
    container.innerHTML = '';

    const selectedProduct = PRODUCTS.find(p => p.id === selectedProductId);

    // Title and introduction
    const introSection = document.createElement('div');
    introSection.style.marginBottom = '1.25rem';
    introSection.innerHTML = `
      <h2 style="margin-bottom: 4px;"><span class="material-symbols-rounded" style="color: var(--secondary);">store</span> Sucursales y Stock</h2>
      <p style="font-size: 0.8rem;">Consulta la disponibilidad de tus artículos preferidos en tiempo real por tienda antes de ir o reservar.</p>
    `;
    container.appendChild(introSection);

    // Product selector dropdown to check stock
    const productSelector = document.createElement('div');
    productSelector.className = 'glass-card';
    productSelector.style.marginBottom = '1.25rem';
    productSelector.innerHTML = `
      <label class="input-label" for="stock-product-select">Selecciona un producto para ver su stock:</label>
      <select id="stock-product-select" class="input-field select-field">
        ${PRODUCTS.map(p => `<option value="${p.id}" ${p.id === selectedProductId ? 'selected' : ''}>${p.brand} - ${p.name} (${p.size})</option>`).join('')}
      </select>
      
      <!-- Short product info summary -->
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">
        <span style="width: 12px; height: 12px; border-radius: 3px; background: ${selectedProduct.imageBg}; display: inline-block;"></span>
        <span>Precio sugerido: <strong>$${selectedProduct.price.toLocaleString('es-CL')}</strong></span>
      </div>
    `;
    container.appendChild(productSelector);

    // Simulated Map Container (Aesthetic Mock)
    const mapMock = document.createElement('div');
    mapMock.className = 'card';
    mapMock.style.height = '150px';
    mapMock.style.background = 'radial-gradient(circle at 70% 30%, rgba(79, 70, 229, 0.25) 0%, var(--bg-secondary) 80%)';
    mapMock.style.border = '1px solid var(--border-color)';
    mapMock.style.position = 'relative';
    mapMock.style.display = 'flex';
    mapMock.style.alignItems = 'center';
    mapMock.style.justifyContent = 'center';
    mapMock.style.overflow = 'hidden';
    mapMock.style.marginBottom = '1.25rem';
    mapMock.innerHTML = `
      <!-- Mock Map Grid Lines -->
      <div style="position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px;"></div>
      
      <!-- Mock Location Pins -->
      <div style="position: absolute; left: 30%; top: 40%; transform: translate(-50%, -50%); text-align: center; cursor: pointer;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 28px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">location_on</span>
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-top: -4px;">PetOne Providencia</div>
      </div>
      <div style="position: absolute; left: 75%; top: 25%; transform: translate(-50%, -50%); text-align: center; cursor: pointer;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 28px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">location_on</span>
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-top: -4px;">PetOne Las Condes</div>
      </div>
      <div style="position: absolute; left: 50%; top: 75%; transform: translate(-50%, -50%); text-align: center; cursor: pointer;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 28px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">location_on</span>
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-top: -4px;">PetOne Santiago Centro</div>
      </div>
      
      <!-- Map Overlay -->
      <div style="position: absolute; bottom: 8px; left: 8px; font-size: 0.65rem; color: var(--text-muted); background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px;">
        Geolocalización Activa (Material Maps Mock)
      </div>
    `;
    container.appendChild(mapMock);

    // List of stores and their stock
    const storesList = document.createElement('div');
    storesList.style.display = 'flex';
    storesList.style.flexDirection = 'column';
    storesList.style.gap = '10px';
    container.appendChild(storesList);

    storesList.innerHTML = localStoresState.map(store => {
      const stockQty = store.stock[selectedProductId] !== undefined ? store.stock[selectedProductId] : 0;
      
      let stockBadge = '';
      let canReserve = false;
      
      if (stockQty > 5) {
        stockBadge = `<span class="pill" style="border-color: var(--secondary); color: var(--secondary); background-color: rgba(16,185,129,0.05); font-size: 0.7rem; padding: 2px 8px;">Stock Disponible (${stockQty} un.)</span>`;
        canReserve = true;
      } else if (stockQty > 0 && stockQty <= 5) {
        stockBadge = `<span class="pill" style="border-color: var(--accent); color: var(--accent); background-color: rgba(245,158,11,0.05); font-size: 0.7rem; padding: 2px 8px;">Pocas Unidades (${stockQty} un.)</span>`;
        canReserve = true;
      } else {
        stockBadge = `<span class="pill" style="border-color: var(--danger); color: var(--danger); background-color: rgba(239,68,68,0.05); font-size: 0.7rem; padding: 2px 8px;">Sin Stock</span>`;
        canReserve = false;
      }

      return `
        <div class="card" style="margin-bottom: 0; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 0.95rem; font-weight: 700;">${store.name}</h3>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${store.address}</p>
              <div style="display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 0.7rem; color: var(--text-muted);">
                <span class="material-symbols-rounded" style="font-size: 14px;">near_me</span>
                <span>A ${store.distance} de tu ubicación</span>
              </div>
            </div>
            
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              ${stockBadge}
              ${canReserve ? `
                <button class="btn btn-primary btn-reserve" data-store-id="${store.id}" style="width: auto; padding: 6px 12px; font-size: 0.75rem; border-radius: 8px;">
                  Reservar Retiro
                </button>
              ` : `
                <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.75rem; border-radius: 8px; opacity: 0.5; cursor: not-allowed;" disabled>
                  No Disponible
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Event listener for product select dropdown
    const selectEl = document.getElementById('stock-product-select');
    selectEl.addEventListener('change', (e) => {
      selectedProductId = e.target.value;
      render();
    });

    // Event listener for Click & Collect bookings
    storesList.querySelectorAll('.btn-reserve').forEach(btn => {
      btn.addEventListener('click', () => {
        const storeId = btn.dataset.storeId;
        const targetStore = localStoresState.find(s => s.id === storeId);
        
        if (targetStore && targetStore.stock[selectedProductId] > 0) {
          // Deduct 1 unit from stock to show real-time change
          targetStore.stock[selectedProductId] -= 1;
          
          showToast(`¡Reserva confirmada en ${targetStore.name}! Recibirás un correo con las instrucciones de retiro.`);
          
          // Re-render to show updated stock number
          render();
        }
      });
    });
  }

  // Initial load
  render();
}
