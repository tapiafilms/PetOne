import { getCartItems, updateCartItemQty, removeFromCart, clearCart, getProfile, saveProfile, addPurchase } from '../utils/db.js';
import { navigateTo, showToast } from '../main.js';

export async function renderCart(container) {
  const profile = await getProfile();
  let cartItems = await getCartItems();
  let selectedSucursal = 'PetOne Providencia'; // Default sucursal
  let orderCompletedData = null; // Stored order data once checked out

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-back-to-dash-cart" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700;">Cesta de Retiro</h2>
      </div>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-cart').addEventListener('click', () => navigateTo('dashboard'));

    if (orderCompletedData) {
      renderConfirmationView(container);
      return;
    }

    if (cartItems.length === 0) {
      renderEmptyState(container);
      return;
    }

    renderCartContent(container);
  }

  // EMPTY STATE VIEW
  function renderEmptyState(parent) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'glass-card';
    emptyBox.style.textAlign = 'center';
    emptyBox.style.padding = '3rem 1.5rem';
    emptyBox.style.marginTop = '1rem';
    emptyBox.innerHTML = `
      <span class="material-symbols-rounded" style="font-size: 64px; color: var(--text-muted); margin-bottom: 1rem; display: inline-block;">shopping_basket</span>
      <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Tu cesta está vacía</h3>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem; max-width: 240px; margin-left: auto; margin-right: auto;">
        Agrega productos del catálogo para generar tu boucher de retiro en tienda.
      </p>
      <button id="btn-cart-goto-catalog" class="btn btn-primary">Explorar Catálogo</button>
    `;
    parent.appendChild(emptyBox);

    document.getElementById('btn-cart-goto-catalog').addEventListener('click', () => navigateTo('catalog'));
  }

  // CART CONTENT VIEW
  function renderCartContent(parent) {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const pointsAccrued = Math.round(total * 0.05);

    // List Container
    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '10px';
    listContainer.style.marginBottom = '1.25rem';
    parent.appendChild(listContainer);

    listContainer.innerHTML = cartItems.map(item => `
      <div class="card" style="margin-bottom: 0; padding: 12px; display: flex; gap: 12px; align-items: center;">
        <div style="width: 54px; height: 54px; border-radius: 8px; background: ${item.imageBg}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.7rem; text-align: center; padding: 2px;">
          ${item.brand}
        </div>
        <div style="flex: 1; min-width: 0;">
          <span style="font-size: 0.65rem; color: var(--primary); font-weight: bold; text-transform: uppercase;">${item.brand}</span>
          <h4 style="font-size: 0.85rem; margin: 1px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</h4>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
            <strong style="font-size: 0.9rem; color: var(--text-primary);">$${(item.price * item.qty).toLocaleString('es-CL')}</strong>
            <span style="font-size: 0.7rem; color: var(--text-muted);">$${item.price.toLocaleString('es-CL')} c/u</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 8px; background-color: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 6px;">
            <button class="btn-qty-minus" data-id="${item.id}" style="background: none; border: none; color: var(--text-secondary); font-weight: bold; cursor: pointer; padding: 0 4px; font-size: 0.85rem;">-</button>
            <span style="font-size: 0.8rem; font-weight: bold; width: 14px; text-align: center; color: var(--text-primary);">${item.qty}</span>
            <button class="btn-qty-plus" data-id="${item.id}" style="background: none; border: none; color: var(--text-secondary); font-weight: bold; cursor: pointer; padding: 0 4px; font-size: 0.85rem;">+</button>
          </div>
          <button class="btn-item-remove" data-id="${item.id}" style="background: none; border: none; color: var(--danger); font-size: 0.7rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 2px; padding: 0;">
            <span class="material-symbols-rounded" style="font-size: 13px;">delete</span> Quitar
          </button>
        </div>
      </div>
    `).join('');

    // Totals Panel
    const totalCard = document.createElement('div');
    totalCard.className = 'glass-card';
    totalCard.style.padding = '14px';
    totalCard.style.marginBottom = '1.5rem';
    totalCard.innerHTML = `
      <h3 style="font-size: 0.95rem; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; color: var(--text-primary);">Resumen del Retiro</h3>
      
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px; color: var(--text-secondary);">
        <span>Artículos (${totalQty}):</span>
        <strong>$${total.toLocaleString('es-CL')}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 10px; color: var(--text-secondary);">
        <span>Costo de Preparación:</span>
        <strong style="color: var(--secondary); text-transform: uppercase; font-size: 0.75rem;">¡Gratis!</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 12px; border-top: 1px dashed var(--border-color); padding-top: 8px; color: var(--text-primary);">
        <span>Total a Pagar en Tienda:</span>
        <strong style="font-size: 1.15rem; color: white;">$${total.toLocaleString('es-CL')}</strong>
      </div>

      <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 10px; border-radius: 8px; font-size: 0.75rem; color: var(--secondary); display: flex; align-items: center; gap: 6px;">
        <span class="material-symbols-rounded" style="font-size: 16px;">stars</span>
        <span>Acumulas <strong>+${pointsAccrued} puntos</strong> de lealtad al retirar</span>
      </div>
    `;
    parent.appendChild(totalCard);

    // Primary Action Button
    const orderBtn = document.createElement('button');
    orderBtn.id = 'btn-cart-checkout';
    orderBtn.className = 'btn btn-primary';
    orderBtn.style.padding = '14px';
    orderBtn.style.fontSize = '0.95rem';
    orderBtn.style.fontWeight = 'bold';
    orderBtn.innerHTML = `
      <span class="material-symbols-rounded" style="vertical-align: text-bottom; margin-right: 6px;">storefront</span>
      Crear Retiro en Tienda
    `;
    parent.appendChild(orderBtn);

    // Click listeners for Qty adjustments
    listContainer.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = cartItems.find(i => i.id === id);
        if (item) {
          await updateCartItemQty(id, item.qty - 1);
          cartItems = await getCartItems();
          window.updateCartBadgeCount();
          render();
        }
      });
    });

    listContainer.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const item = cartItems.find(i => i.id === id);
        if (item) {
          await updateCartItemQty(id, item.qty + 1);
          cartItems = await getCartItems();
          window.updateCartBadgeCount();
          render();
        }
      });
    });

    listContainer.querySelectorAll('.btn-item-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await removeFromCart(id);
        cartItems = await getCartItems();
        window.updateCartBadgeCount();
        render();
      });
    });

    // Checkout modal event
    orderBtn.addEventListener('click', () => openBranchSelectorModal(total, pointsAccrued));
  }

  // MODAL TO CHOOSE SUCURSAL
  function openBranchSelectorModal(totalPrice, pointsAccrued) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0; font-size: 1.15rem;"><span class="material-symbols-rounded" style="color: var(--primary); vertical-align: text-bottom;">store</span> Selecciona Sucursal</h2>
          <button id="btn-close-branch" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Elige en qué sucursal de PetOne quieres que preparemos tus productos.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem;">
          <label style="display: flex; align-items: center; gap: 10px; background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="sucursal-radio" value="PetOne Providencia" ${selectedSucursal === 'PetOne Providencia' ? 'checked' : ''}>
            <div style="font-size: 0.8rem;">
              <strong>PetOne Providencia</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Av. Providencia 1482 • Listo en 30 min</div>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 10px; background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="sucursal-radio" value="PetOne Vitacura" ${selectedSucursal === 'PetOne Vitacura' ? 'checked' : ''}>
            <div style="font-size: 0.8rem;">
              <strong>PetOne Vitacura</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Av. Vitacura 4900 • Listo en 45 min</div>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 10px; background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; cursor: pointer;">
            <input type="radio" name="sucursal-radio" value="PetOne Santiago Centro" ${selectedSucursal === 'PetOne Santiago Centro' ? 'checked' : ''}>
            <div style="font-size: 0.8rem;">
              <strong>PetOne Santiago Centro</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Av. Libertador O'Higgins 390 • Listo en 1 hora</div>
            </div>
          </label>
        </div>

        <button id="btn-confirm-pickup" class="btn btn-primary">
          Confirmar y Crear Retiro
        </button>
      </div>
    `;

    document.getElementById('btn-close-branch').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-confirm-pickup').addEventListener('click', async () => {
      const selectedRadio = overlay.querySelector('input[name="sucursal-radio"]:checked');
      if (selectedRadio) {
        selectedSucursal = selectedRadio.value;
      }

      // Generate order data
      const orderCode = `PET-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPurchase = {
        id: `purch-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        total: totalPrice,
        items: cartItems.map(item => ({ brand: item.brand, name: item.name, price: item.price, qty: item.qty })),
        type: `Retiro en Tienda (${selectedSucursal})`,
        status: 'Pendiente de Pago Físico',
        orderCode: orderCode
      };

      // Add to IndexedDB & sync to Supabase
      await addPurchase(newPurchase);

      // Award points
      if (profile) {
        profile.points = (profile.points || 0) + pointsAccrued;
        await saveProfile(profile);
      }

      // Clear cart
      await clearCart();
      cartItems = [];
      window.updateCartBadgeCount();

      // Store data for confirmation screen
      orderCompletedData = newPurchase;
      overlay.remove();
      render();
    });
  }

  // CONFIRMATION BOUCHER VIEW
  function renderConfirmationView(parent) {
    const confCard = document.createElement('div');
    confCard.className = 'glass-card';
    confCard.style.padding = '1.5rem';
    confCard.style.textAlign = 'center';
    confCard.style.marginTop = '1rem';
    parent.appendChild(confCard);

    confCard.innerHTML = `
      <div style="width: 54px; height: 54px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.1); border: 2px solid var(--secondary); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; color: var(--secondary);">
        <span class="material-symbols-rounded" style="font-size: 32px;">check_circle</span>
      </div>
      <h3 style="font-size: 1.2rem; margin-bottom: 4px; color: white;">¡Retiro Creado Exitosamente!</h3>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Hemos enviado tu pedido a preparación en la sucursal elegida.
      </p>

      <!-- Digital Voucher Card -->
      <div style="background-color: rgba(0,0,0,0.25); border: 1.5px dashed var(--border-color); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: left; position: relative;">
        <div style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: #0a0f1d;"></div>
        <div style="position: absolute; right: -8px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: #0a0f1d;"></div>
        
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin-bottom: 10px;">
          <div>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Código de Retiro</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary); font-family: monospace; letter-spacing: 1px;">${orderCompletedData.orderCode}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Sucursal</span>
            <div style="font-size: 0.8rem; font-weight: bold; color: white;">${selectedSucursal.replace('PetOne ', '')}</div>
          </div>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">
          <strong>Productos a retirar:</strong>
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            ${orderCompletedData.items.map(item => `
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; background-color: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 4px;">
                <span>${item.qty}x ${item.brand} - ${item.name}</span>
                <span>$${(item.price * item.qty).toLocaleString('es-CL')}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 10px; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Total a pagar físicamente:</span>
          <strong style="font-size: 1rem; color: white;">$${orderCompletedData.total.toLocaleString('es-CL')}</strong>
        </div>

        <!-- Fake Barcode/QR visualization -->
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: white; padding: 12px; border-radius: 8px;">
          <!-- Custom CSS Barcode -->
          <div style="display: flex; align-items: stretch; height: 35px; width: 100%; max-width: 200px; background: white; gap: 2px;">
            <div style="width: 3px; background: black;"></div>
            <div style="width: 1px; background: black;"></div>
            <div style="width: 4px; background: black;"></div>
            <div style="width: 2px; background: black;"></div>
            <div style="width: 1px; background: black;"></div>
            <div style="width: 3px; background: black;"></div>
            <div style="width: 5px; background: black;"></div>
            <div style="width: 2px; background: black;"></div>
            <div style="width: 1px; background: black;"></div>
            <div style="width: 4px; background: black;"></div>
            <div style="width: 3px; background: black;"></div>
            <div style="width: 1px; background: black;"></div>
            <div style="width: 2px; background: black;"></div>
            <div style="width: 4px; background: black;"></div>
            <div style="width: 1px; background: black;"></div>
            <div style="width: 3px; background: black;"></div>
          </div>
          <div style="font-size: 0.65rem; color: #475569; font-family: monospace; letter-spacing: 3px;">*${orderCompletedData.orderCode}*</div>
        </div>
      </div>

      <!-- Preparation steps description -->
      <div style="text-align: left; background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.45;">
        <h4 style="font-weight: bold; color: white; margin-top: 0; margin-bottom: 6px;">Pasos para tu Retiro:</h4>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div>1. 📦 <strong>Preparación:</strong> El personal de la sucursal de <strong>${selectedSucursal}</strong> está seleccionando tus productos y empaquetándolos.</div>
          <div>2. 🏬 <strong>Dirígete a tienda:</strong> Acércate a la sucursal física elegida cuando gustes. El pedido estará listo para retirar.</div>
          <div>3. 💳 <strong>Pago y entrega:</strong> Muestra este boucher digital en caja, paga físicamente con tu medio de pago favorito (tarjetas o efectivo) y llévate tu pedido.</div>
        </div>
      </div>

      <button id="btn-confirm-conf-back" class="btn btn-secondary">Volver al Inicio</button>
    `;

    document.getElementById('btn-confirm-conf-back').addEventListener('click', () => {
      orderCompletedData = null;
      navigateTo('dashboard');
    });
  }

  // Initial load
  render();
}
