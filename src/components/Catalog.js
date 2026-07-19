// Catalog Component for multi-category and multi-brand exploration with comparison, private label switcher, subscriptions and cross-selling (Phase 2 Upgrade)
import { CATEGORIES, PRODUCTS, CROSS_SELL_RULES } from '../data/mockData.js';
import { getProfile, saveProfile, addPurchase, addSubscription, getPurchases } from '../utils/db.js';
import { showToast, navigateTo } from '../main.js';

export async function renderCatalog(container) {
  const profile = await getProfile();
  const purchases = await getPurchases();
  let selectedCategory = 'alimentos';
  let searchQuery = '';
  const selectedForComparison = [];

  function render() {
    container.innerHTML = '';

    // Search bar
    const searchSection = document.createElement('div');
    searchSection.style.marginBottom = '1rem';
    searchSection.innerHTML = `
      <div style="position: relative;">
        <span class="material-symbols-rounded" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 20px;">search</span>
        <input type="text" id="catalog-search" class="input-field" placeholder="Buscar alimentos, correas, champú..." style="padding-left: 2.5rem;" value="${searchQuery}">
      </div>
    `;
    container.appendChild(searchSection);

    // Categories tabs
    const categoryTabs = document.createElement('div');
    categoryTabs.className = 'scroll-x';
    categoryTabs.style.marginBottom = '1.25rem';
    categoryTabs.innerHTML = CATEGORIES.map(cat => `
      <div class="pill ${cat.id === selectedCategory ? 'pill-active' : ''}" data-cat="${cat.id}" style="cursor: pointer; padding: 0.5rem 1rem;">
        <span class="material-symbols-rounded" style="font-size: 16px;">${cat.icon}</span>
        <span>${cat.name}</span>
      </div>
    `).join('');
    container.appendChild(categoryTabs);

    categoryTabs.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        selectedCategory = pill.dataset.cat;
        render();
      });
    });

    // Comparison Banner (sticky drawer bottom)
    const compareBanner = document.createElement('div');
    compareBanner.id = 'compare-banner';
    compareBanner.style.display = selectedForComparison.length > 0 ? 'flex' : 'none';
    compareBanner.style.justifyContent = 'space-between';
    compareBanner.style.alignItems = 'center';
    compareBanner.style.backgroundColor = 'var(--primary)';
    compareBanner.style.color = 'white';
    compareBanner.style.padding = '10px 16px';
    compareBanner.style.borderRadius = '12px';
    compareBanner.style.marginBottom = '1rem';
    compareBanner.innerHTML = `
      <span style="font-size: 0.85rem; font-weight: 500;">
        <span class="material-symbols-rounded" style="font-size: 16px; vertical-align: text-bottom; margin-right: 4px;">compare_arrows</span>
        ${selectedForComparison.length} producto(s) para comparar
      </span>
      <button id="btn-compare-now" class="btn btn-secondary" style="width: auto; padding: 4px 12px; font-size: 0.75rem; background-color: white; color: var(--primary);">
        Comparar Ahora
      </button>
    `;
    container.appendChild(compareBanner);

    // Private Label Switcher recommendation banner
    if (selectedCategory === 'alimentos' || selectedCategory === 'higiene') {
      const privateLabelBanner = document.createElement('div');
      privateLabelBanner.className = 'glass-card';
      privateLabelBanner.style.border = '1px solid rgba(245, 158, 11, 0.4)';
      privateLabelBanner.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)';
      privateLabelBanner.style.marginBottom = '1rem';
      privateLabelBanner.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: flex-start;">
          <span class="material-symbols-rounded" style="color: var(--accent); font-size: 24px;">verified</span>
          <div>
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--accent); margin-bottom: 2px;">PetOne Essentials</h4>
            <p style="font-size: 0.75rem; color: var(--text-primary);">
              Prueba nuestra alternativa de marca propia. Ahorra hasta un 25% con calidad garantizada por veterinarios.
            </p>
            <button id="btn-buy-pl" class="btn btn-primary" style="margin-top: 8px; font-size: 0.75rem; padding: 4px 10px; width: auto; background: var(--accent); box-shadow: none;">
              Ver PetOne Premium Food ($19.990)
            </button>
          </div>
        </div>
      `;
      container.appendChild(privateLabelBanner);

      setTimeout(() => {
        document.getElementById('btn-buy-pl')?.addEventListener('click', async () => {
          await simulatePurchase({
            id: 'pl-1',
            brand: 'PetOne Essentials',
            name: 'Premium Adult Complete',
            price: 19990
          });
        });
      }, 50);
    }

    // Filter products
    const filteredProducts = PRODUCTS.filter(p => {
      const matchesCategory = p.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Product List Grid
    const productGrid = document.createElement('div');
    productGrid.style.display = 'flex';
    productGrid.style.flexDirection = 'column';
    productGrid.style.gap = '12px';
    productGrid.style.marginBottom = '1.5rem';
    container.appendChild(productGrid);

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = `
        <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
          <span class="material-symbols-rounded" style="font-size: 40px; margin-bottom: 8px;">search_off</span>
          <p>No se encontraron productos en esta categoría.</p>
        </div>
      `;
    } else {
      productGrid.innerHTML = filteredProducts.map(p => {
        const isChecked = selectedForComparison.includes(p.id);
        const isSubscribable = p.category === 'alimentos' || p.category === 'higiene';
        return `
          <div class="card" style="margin-bottom: 0; padding: 12px; display: flex; gap: 12px; position: relative;">
            <div style="width: 72px; height: 72px; border-radius: 12px; background: ${p.imageBg}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.85rem; text-align: center; padding: 4px;">
              ${p.brand}
            </div>
            
            <div style="flex: 1;">
              <span style="font-size: 0.75rem; color: var(--primary); font-weight: bold; text-transform: uppercase;">${p.brand}</span>
              <h3 style="font-size: 0.95rem; margin-top: 2px;">${p.name}</h3>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${p.size}</p>
              
              <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                <span class="material-symbols-rounded" style="color: var(--accent); font-size: 14px; font-variation-settings: 'FILL' 1;">star</span>
                <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-primary);">${p.rating}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">(${p.reviews})</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                <strong style="color: var(--text-primary); font-size: 1.05rem;">$${p.price.toLocaleString('es-CL')}</strong>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-secondary btn-compare" data-id="${p.id}" style="width: auto; padding: 6px 10px; font-size: 0.75rem;">
                    ${isChecked ? 'Remover' : 'Comparar'}
                  </button>
                  ${isSubscribable ? `
                    <button class="btn btn-secondary btn-subscribe" data-id="${p.id}" style="width: auto; padding: 6px 10px; font-size: 0.75rem; border-color: var(--secondary); color: var(--secondary); background: rgba(16,185,129,0.02);">
                      Suscribir
                    </button>
                  ` : ''}
                  <button class="btn btn-primary btn-buy" data-id="${p.id}" style="width: auto; padding: 6px 12px; font-size: 0.75rem;">
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Cross-Selling Recommendation Widget (Phase 2 Upgrade)
    renderCrossSellingWidget();

    // Attach event listeners for search input
    const searchInput = document.getElementById('catalog-search');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
    });
    searchInput.addEventListener('change', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Attach event listeners to product actions
    productGrid.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prod = PRODUCTS.find(p => p.id === btn.dataset.id);
        await simulatePurchase(prod);
        render(); // Re-render to update cross-sell widget based on new purchase!
      });
    });

    productGrid.querySelectorAll('.btn-compare').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = selectedForComparison.indexOf(id);
        if (idx > -1) {
          selectedForComparison.splice(idx, 1);
        } else {
          if (selectedForComparison.length >= 3) {
            alert('Puedes comparar un máximo de 3 productos a la vez.');
            return;
          }
          selectedForComparison.push(id);
        }
        render();
      });
    });

    productGrid.querySelectorAll('.btn-subscribe').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = PRODUCTS.find(p => p.id === btn.dataset.id);
        openSubscribeModal(prod);
      });
    });

    const compareBtn = document.getElementById('btn-compare-now');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => openCompareModal());
    }
  }

  // Cross-selling dynamic rendering
  function renderCrossSellingWidget() {
    // Determine target category based on last purchase
    let targetCategory = 'alimentos';
    if (purchases.length > 0) {
      // Find category of first product of last purchase
      const lastPurch = purchases[0];
      const matchItem = PRODUCTS.find(p => p.name === lastPurch.items[0]?.name);
      if (matchItem) targetCategory = matchItem.category;
    }

    const recommendedIds = CROSS_SELL_RULES[targetCategory] || ['prod-8', 'prod-7'];
    const recommendations = PRODUCTS.filter(p => recommendedIds.includes(p.id));

    if (recommendations.length === 0) return;

    const widget = document.createElement('div');
    widget.style.marginTop = '1.5rem';
    widget.innerHTML = `
      <h2 style="font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 18px;">celebrity_decoration</span>
        Complementos recomendados para ti:
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${recommendations.map(p => `
          <div class="card" style="margin-bottom: 0; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="width: 100%; height: 50px; border-radius: 8px; background: ${p.imageBg}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.7rem; padding: 4px; margin-bottom: 6px; text-align: center;">
                ${p.brand}
              </div>
              <span style="font-size: 0.65rem; color: var(--primary); font-weight: bold; text-transform: uppercase;">${p.brand}</span>
              <h4 style="font-size: 0.8rem; font-weight: 600; margin-top: 2px; line-height: 1.2;">${p.name}</h4>
            </div>
            
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; font-weight: bold;">$${p.price.toLocaleString('es-CL')}</span>
              <button class="btn btn-primary btn-buy-cross" data-id="${p.id}" style="width: auto; padding: 4px 8px; font-size: 0.65rem; border-radius: 6px;">
                <span class="material-symbols-rounded" style="font-size: 14px;">add_shopping_cart</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(widget);

    widget.querySelectorAll('.btn-buy-cross').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prod = PRODUCTS.find(p => p.id === btn.dataset.id);
        await simulatePurchase(prod);
        render();
      });
    });
  }

  // Handle a purchase simulation
  async function simulatePurchase(product) {
    const purchase = {
      id: `purch-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      total: product.price,
      items: [
        { brand: product.brand, name: product.name, price: product.price }
      ],
      type: 'E-Commerce (PWA App)'
    };

    await addPurchase(purchase);

    // Update points
    profile.points = (profile.points || 0) + Math.round(product.price * 0.05);
    await saveProfile(profile);

    showToast(`¡Compraste ${product.brand} con éxito! 5% acumulado en puntos.`);
  }

  // SUBSCRIBE MODAL DIALOG
  function openSubscribeModal(product) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0;"><span class="material-symbols-rounded" style="color: var(--secondary);">autorenew</span> Suscribir Despacho</h2>
          <button id="btn-close-sub" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; background-color: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
          <div style="width: 48px; height: 48px; border-radius: 8px; background: ${product.imageBg}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.75rem;">
            ${product.brand[0]}
          </div>
          <div>
            <h4 style="font-size: 0.9rem; font-weight: bold;">${product.brand} - ${product.name}</h4>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
              <span style="text-decoration: line-through; font-size: 0.8rem; color: var(--text-muted);">$${product.price.toLocaleString('es-CL')}</span>
              <strong style="color: var(--secondary); font-size: 0.95rem;">$${Math.round(product.price * 0.9).toLocaleString('es-CL')} <span style="font-size: 0.7rem; font-weight: normal; color: var(--text-secondary);">(10% Desc.)</span></strong>
            </div>
          </div>
        </div>

        <div class="input-group" style="margin-bottom: 1.25rem;">
          <label class="input-label">Frecuencia de Despacho</label>
          <select id="sub-frequency" class="input-field select-field">
            <option value="15">Cada 15 días</option>
            <option value="30" selected>Cada 30 días (Recomendado)</option>
            <option value="45">Cada 45 días</option>
            <option value="60">Cada 60 días</option>
          </select>
        </div>

        <div style="background-color: rgba(16,185,129,0.03); border: 1px solid rgba(16,185,129,0.2); padding: 10px; border-radius: 8px; font-size: 0.75rem; color: var(--secondary); margin-bottom: 1.5rem; display: flex; gap: 8px;">
          <span class="material-symbols-rounded" style="font-size: 16px;">info</span>
          <span>Recibirás 100 puntos de lealtad de bienvenida al confirmar esta suscripción recurrente. Puedes pausarla o cancelarla cuando quieras sin costo.</span>
        </div>

        <button id="btn-confirm-subscription" class="btn btn-primary" style="background: var(--secondary); box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
          Confirmar Suscripción
        </button>
      </div>
    `;

    document.getElementById('btn-close-sub').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-confirm-subscription').addEventListener('click', async () => {
      const frequencyDays = parseInt(document.getElementById('sub-frequency').value);
      
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + frequencyDays);
      const nextDeliveryStr = nextDate.toISOString().split('T')[0];

      const newSub = {
        id: `sub-${Date.now()}`,
        productId: product.id,
        brand: product.brand,
        name: product.name,
        price: Math.round(product.price * 0.9), // 10% discount
        frequency: frequencyDays,
        nextDeliveryDate: nextDeliveryStr,
        status: 'Activa'
      };

      await addSubscription(newSub);

      // Add points
      profile.points = (profile.points || 0) + 100;
      await saveProfile(profile);

      showToast(`¡Te suscribiste exitosamente a ${product.name}!`);
      overlay.remove();
      navigateTo('dashboard');
    });
  }

  // COMPARE MODAL DIALOG
  function openCompareModal() {
    const productsToCompare = PRODUCTS.filter(p => selectedForComparison.includes(p.id));
    if (productsToCompare.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content" style="max-height: 90vh;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0;"><span class="material-symbols-rounded">compare_arrows</span> Comparador de Marcas</h2>
          <button id="btn-close-compare" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div style="overflow-x: auto; margin-bottom: 1.5rem;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <th style="padding: 8px; color: var(--text-muted);">Característica</th>
                ${productsToCompare.map(p => `<th style="padding: 8px; font-weight: bold; color: var(--primary); text-align: center;">${p.brand}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px; color: var(--text-secondary); font-weight: 500;">Producto</td>
                ${productsToCompare.map(p => `<td style="padding: 8px; text-align: center; font-weight: 600;">${p.name}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px; color: var(--text-secondary); font-weight: 500;">Tamaño</td>
                ${productsToCompare.map(p => `<td style="padding: 8px; text-align: center; color: var(--text-secondary);">${p.size}</td>`).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px; color: var(--text-secondary); font-weight: 500;">Evaluación</td>
                ${productsToCompare.map(p => `
                  <td style="padding: 8px; text-align: center;">
                    <span style="display: inline-flex; align-items: center; gap: 2px;">
                      <span class="material-symbols-rounded" style="color: var(--accent); font-size: 12px; font-variation-settings: 'FILL' 1;">star</span>
                      ${p.rating}
                    </span>
                  </td>
                `).join('')}
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px; color: var(--text-secondary); font-weight: 500;">Precio</td>
                ${productsToCompare.map(p => `<td style="padding: 8px; text-align: center; font-weight: bold; color: var(--text-primary);">$${p.price.toLocaleString('es-CL')}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>

        <button id="btn-close-compare-bottom" class="btn btn-primary">Volver al Catálogo</button>
      </div>
    `;

    const closeModal = () => overlay.remove();
    document.getElementById('btn-close-compare').addEventListener('click', closeModal);
    document.getElementById('btn-close-compare-bottom').addEventListener('click', closeModal);
  }

  // Initial load
  render();
}
