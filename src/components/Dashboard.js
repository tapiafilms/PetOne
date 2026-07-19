// Dashboard Component for "Mis Mascotas" overview, smart recompra, ticket scanning, health diaries, subscriptions and Phase 3 upgrades (Retail Media + AI)
import { getProfile, getPets, getPurchases, addPurchase, addOfflineTicket, saveProfile, getSubscriptions, saveRetailMediaPerformance, addScanLog } from '../utils/db.js';
import { TIPS_AND_CARE, PRODUCTS } from '../data/mockData.js';
import { navigateTo, showToast } from '../main.js';

export async function renderDashboard(container) {
  const profile = await getProfile();
  const pets = await getPets();
  const purchases = await getPurchases();
  const subscriptions = await getSubscriptions();

  // Primary pet selected (defaults to first pet)
  let activePetIndex = 0;
  const activePet = pets[activePetIndex];

  // Ad Mock (Retail Media Network)
  const currentAd = {
    id: 'ad-1',
    sponsor: 'KONG Classic',
    title: 'Estimula su mente y juego',
    desc: 'Compra el clásico de caucho natural con 15% de descuento.',
    targetProductId: 'prod-8'
  };

  // Register Retail Media Impression
  try {
    await saveRetailMediaPerformance({
      id: currentAd.id,
      sponsor: currentAd.sponsor,
      impressions: 1, // incremental simulation done in analysis
      clicks: 0
    });
  } catch(err) {
    console.warn('Fallo registro media analytic:', err);
  }

  function render() {
    container.innerHTML = '';

    if (!activePet) {
      container.innerHTML = `<p>Error: No se encontraron mascotas registradas.</p>`;
      return;
    }

    // 1. Retail Media Banner (Sponsor)
    const adBanner = document.createElement('div');
    adBanner.className = 'glass-card';
    adBanner.style.border = '1px solid rgba(79, 70, 229, 0.3)';
    adBanner.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(17, 24, 39, 0.7) 100%)';
    adBanner.style.padding = '10px 14px';
    adBanner.style.marginBottom = '1.25rem';
    adBanner.style.cursor = 'pointer';
    adBanner.style.position = 'relative';
    adBanner.innerHTML = `
      <span style="position: absolute; right: 10px; top: 8px; font-size: 0.6rem; text-transform: uppercase; color: var(--primary); font-weight: 700; border: 1px solid var(--primary); padding: 1px 4px; border-radius: 4px;">Patrocinado</span>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 28px;">campaign</span>
        <div>
          <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">${currentAd.sponsor}</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1px;">${currentAd.title}. ${currentAd.desc}</p>
        </div>
      </div>
    `;
    container.appendChild(adBanner);

    adBanner.addEventListener('click', async () => {
      // Register Ad Click
      try {
        await saveRetailMediaPerformance({
          id: currentAd.id,
          sponsor: currentAd.sponsor,
          impressions: 1,
          clicks: 1
        });
      } catch(err) {}
      
      navigateTo('catalog');
      showToast(`Redirigiendo a oferta patrocinada por ${currentAd.sponsor}`);
    });

    // Welcoming Header
    const welcomeSection = document.createElement('div');
    welcomeSection.style.marginBottom = '1.25rem';
    welcomeSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800;">Hola, ${profile.name}!</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem;">Tu hogar acumula <strong>${profile.points}</strong> puntos PetOne</p>
        </div>
        <button id="btn-reset-profile" class="btn btn-secondary btn-icon" title="Reiniciar Perfil" style="width: 36px; height: 36px; border-radius: 8px;">
          <span class="material-symbols-rounded" style="font-size: 18px; color: var(--text-muted);">refresh</span>
        </button>
      </div>
    `;
    container.appendChild(welcomeSection);

    // Multi-Pet Selector tabs
    if (pets.length > 1) {
      const petTabs = document.createElement('div');
      petTabs.className = 'scroll-x';
      petTabs.style.marginBottom = '1rem';
      petTabs.innerHTML = pets.map((pet, idx) => `
        <div class="pill ${idx === activePetIndex ? 'pill-active' : ''}" data-idx="${idx}" style="cursor: pointer; padding: 0.5rem 1rem;">
          <span class="material-symbols-rounded" style="font-size: 16px;">${pet.species === 'perro' ? 'pets' : 'explore'}</span>
          <span>${pet.name}</span>
        </div>
      `).join('');
      container.appendChild(petTabs);

      petTabs.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
          activePetIndex = parseInt(pill.dataset.idx);
          render();
        });
      });
    }

    // Staff Diagnosis Alert
    if (activePet.diagnosis) {
      const diag = activePet.diagnosis;
      let couponText = '';
      let couponCode = '';
      
      if (diag.toLowerCase().includes('reseca')) {
        couponText = '20% de descuento en Champú Oster Avena y Coco (Ideal para piel sensible)';
        couponCode = 'DERMA20';
      } else if (diag.toLowerCase().includes('sarro')) {
        couponText = '15% de descuento en Juguetes Rellenables KONG (Excelente para remover sarro)';
        couponCode = 'DENTAL15';
      } else {
        couponText = '10% de descuento en la categoría Higiene y Cuidados';
        couponCode = 'PETONE10';
      }

      const diagnosisAlert = document.createElement('div');
      diagnosisAlert.className = 'glass-card';
      diagnosisAlert.style.border = '1px solid var(--danger)';
      diagnosisAlert.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(17, 24, 39, 0.6) 100%)';
      diagnosisAlert.style.marginBottom = '1rem';
      diagnosisAlert.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: flex-start;">
          <span class="material-symbols-rounded" style="color: var(--danger); font-size: 24px;">error</span>
          <div style="flex: 1;">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--danger); margin-bottom: 2px;">
              Recomendación de Staff (${activePet.diagnosisStaff || 'Estilista'})
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-primary); line-height: 1.4;">
              Se detectó <strong>"${diag}"</strong> durante la última visita de ${activePet.name}.
            </p>
            <div style="background-color: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px; margin-top: 6px; border: 1px dashed rgba(239, 68, 68, 0.4);">
              <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Beneficio Recomendado:</div>
              <div style="font-size: 0.8rem; font-weight: bold; color: white; margin-top: 2px;">${couponText}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <span style="font-family: monospace; background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; color: var(--danger); font-weight: bold; border: 1px solid var(--border-color);">${couponCode}</span>
                <button id="btn-redeem-coupon" class="btn btn-primary" style="width: auto; padding: 4px 10px; font-size: 0.7rem; background-color: var(--danger); box-shadow: none;">Ir al Catálogo</button>
              </div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(diagnosisAlert);
      
      setTimeout(() => {
        document.getElementById('btn-redeem-coupon')?.addEventListener('click', () => {
          navigateTo('catalog');
        });
      }, 50);
    }

    // Active Pet Card
    const petCard = document.createElement('div');
    petCard.className = 'glass-card';
    petCard.style.position = 'relative';
    petCard.style.overflow = 'hidden';
    petCard.style.marginBottom = '1rem';
    petCard.innerHTML = `
      <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%); pointer-events: none;"></div>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #818cf8); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">
          ${activePet.species === 'perro' ? '🐶' : '🐱'}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 style="font-size: 1.3rem; margin: 0;">${activePet.name}</h3>
            <span class="pill" style="font-size: 0.7rem; padding: 2px 6px;">${activePet.breed}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px;">
            ${activePet.age} años • ${activePet.weight} kg • Alergias: ${activePet.allergies}
          </p>
        </div>
      </div>

      <!-- Health tracker shortcut -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div id="btn-goto-health" style="text-align: center; border-right: 1px solid var(--border-color); cursor: pointer;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span class="material-symbols-rounded" style="font-size: 14px; color: var(--secondary);">monitor_weight</span>
            Historial de Peso
          </div>
          <div style="font-weight: bold; color: var(--text-primary); margin-top: 2px; font-size: 0.95rem;">
            ${activePet.weight} kg <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-secondary);">➔</span>
          </div>
        </div>
        <div id="btn-goto-health-feedback" style="text-align: center; cursor: pointer;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span class="material-symbols-rounded" style="font-size: 14px; color: var(--accent);">rate_review</span>
            Diario de Salud
          </div>
          <div style="font-weight: bold; color: var(--secondary); margin-top: 2px; font-size: 0.95rem;">
            Ver Diario <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-secondary);">➔</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(petCard);

    // Active Subscriptions Card
    if (subscriptions.length > 0) {
      const subsCard = document.createElement('div');
      subsCard.className = 'glass-card';
      subsCard.style.borderLeft = '4px solid var(--secondary)';
      subsCard.style.marginBottom = '1.25rem';
      
      const nextSub = subscriptions[0];
      subsCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
              <span class="material-symbols-rounded" style="color: var(--secondary); font-size: 18px;">autorenew</span>
              Suscripción Activa
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-primary); margin-top: 4px; font-weight: 500;">
              ${nextSub.brand} - ${nextSub.name}
            </p>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              Próximo despacho: <strong>${nextSub.nextDeliveryDate}</strong>
            </p>
          </div>
          <button id="btn-goto-subs" class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.75rem; border-radius: 8px;">
            Gestionar
          </button>
        </div>
      `;
      container.appendChild(subsCard);
      
      setTimeout(() => {
        document.getElementById('btn-goto-subs')?.addEventListener('click', () => {
          navigateTo('subscriptions');
        });
      }, 50);
    }

    // In-store Scan & Go Card
    const scanGoCard = document.createElement('div');
    scanGoCard.className = 'card';
    scanGoCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)';
    scanGoCard.style.borderColor = 'var(--secondary)';
    scanGoCard.style.marginBottom = '1.25rem';
    scanGoCard.style.position = 'relative';
    scanGoCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="material-symbols-rounded" style="font-size: 32px; color: var(--secondary);">qr_code_scanner</span>
        <div style="flex: 1;">
          <h3 style="font-size: 0.95rem; margin: 0; color: var(--text-primary);">Scan & Go en Tienda</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Escanea el código de un artículo en góndola física para comprar de inmediato.</p>
        </div>
        <button id="btn-start-scan-go" class="btn btn-primary" style="width: auto; padding: 6px 14px; font-size: 0.75rem; background-color: var(--secondary); box-shadow: none;">
          Escanear
        </button>
      </div>
    `;
    container.appendChild(scanGoCard);

    // Care Tips and Preventative Care Cards
    const careSection = document.createElement('div');
    careSection.style.marginBottom = '1.5rem';
    
    const petTips = TIPS_AND_CARE[activePet.species] || [];
    careSection.innerHTML = `
      <h2><span class="material-symbols-rounded" style="color: var(--accent);">medical_services</span> Cuidados de ${activePet.name}</h2>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        ${petTips.map(tip => `
          <div class="card" style="margin-bottom: 0; padding: 10px 12px; display: flex; gap: 12px; align-items: flex-start; background-color: rgba(255,255,255,0.01);">
            <span class="material-symbols-rounded" style="color: ${tip.type === 'vacuna' ? 'var(--primary)' : tip.type === 'desparasitacion' ? 'var(--secondary)' : 'var(--accent)'}; font-size: 20px;">
              ${tip.type === 'vacuna' ? 'vaccines' : tip.type === 'desparasitacion' ? 'bug_report' : 'lightbulb'}
            </span>
            <div style="flex: 1;">
              <h4 style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${tip.title}</h4>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${tip.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(careSection);

    // Recompra Inteligente Section
    const reorderSection = document.createElement('div');
    reorderSection.style.marginBottom = '1.5rem';
    container.appendChild(reorderSection);
    renderRecompra(reorderSection);

    // Ticket Scan Action Bar
    const actionBar = document.createElement('div');
    actionBar.className = 'glass-card';
    actionBar.style.textAlign = 'center';
    actionBar.innerHTML = `
      <h3 style="font-size: 0.95rem; margin-bottom: 4px;">¿Compraste en sucursal física?</h3>
      <p style="font-size: 0.8rem; margin-bottom: 1rem;">Escanea el código de barras de tu boleta para unificar tus puntos y tu historial de salud.</p>
      <button id="btn-scan-ticket" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.65rem 1.25rem;">
        <span class="material-symbols-rounded">qr_code_scanner</span>
        Escanear Boleta Física
      </button>
    `;
    container.appendChild(actionBar);

    // Floating AI Chat Button
    const floatAiBtn = document.createElement('button');
    floatAiBtn.id = 'float-ai-chat';
    floatAiBtn.className = 'btn btn-primary btn-icon';
    floatAiBtn.style.position = 'fixed';
    floatAiBtn.style.bottom = '80px';
    floatAiBtn.style.right = '20px';
    floatAiBtn.style.width = '52px';
    floatAiBtn.style.height = '52px';
    floatAiBtn.style.borderRadius = '50%';
    floatAiBtn.style.zIndex = '1500';
    floatAiBtn.innerHTML = `<span class="material-symbols-rounded" style="font-size: 26px;">chat_bubble</span>`;
    container.appendChild(floatAiBtn);

    // Event listeners
    document.getElementById('btn-reset-profile').addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas reiniciar tu perfil? Esto borrará tus datos y tus mascotas.')) {
        indexedDB.deleteDatabase('petone_db');
        window.location.reload();
      }
    });

    document.getElementById('btn-scan-ticket').addEventListener('click', () => openScanModal());
    document.getElementById('btn-start-scan-go').addEventListener('click', () => openScanGoModal());
    floatAiBtn.addEventListener('click', () => navigateTo('ai'));
    document.getElementById('btn-goto-health').addEventListener('click', () => navigateTo('health', activePet.id));
    document.getElementById('btn-goto-health-feedback').addEventListener('click', () => navigateTo('health', activePet.id));
  }

  // Render the Smart Reorder block
  function renderRecompra(parent) {
    parent.innerHTML = `<h2><span class="material-symbols-rounded" style="color: var(--primary);">autorenew</span> Recompra Inteligente</h2>`;
    
    if (purchases.length === 0) {
      parent.innerHTML += `
        <div class="card" style="text-align: center; padding: 1.5rem 1rem;">
          <span class="material-symbols-rounded" style="font-size: 36px; color: var(--text-muted); margin-bottom: 0.5rem;">history</span>
          <h4 style="font-size: 0.9rem; color: var(--text-secondary);">Sin historial de compras</h4>
          <p style="font-size: 0.75rem; margin-top: 4px; margin-bottom: 12px;">Agrega tu primera compra desde el catálogo para iniciar la predicción de recompra.</p>
          <button id="btn-goto-catalog" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 1rem; width: auto;">Ir al Catálogo</button>
        </div>
      `;
      
      setTimeout(() => {
        document.getElementById('btn-goto-catalog')?.addEventListener('click', () => navigateTo('catalog'));
      }, 50);
      return;
    }

    const lastPurchase = purchases[0];
    const purchaseDate = new Date(lastPurchase.date);
    const exhaustionDate = new Date(purchaseDate);
    exhaustionDate.setDate(exhaustionDate.getDate() + 30);
    
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((exhaustionDate - today) / (1000 * 60 * 60 * 24)));
    
    let statusText = `${daysRemaining} días restantes`;
    let statusColor = 'var(--secondary)';
    if (daysRemaining <= 5) {
      statusText = '¡Casi agotado!';
      statusColor = 'var(--accent)';
    }
    if (daysRemaining === 0) {
      statusText = 'Agotado';
      statusColor = 'var(--danger)';
    }

    parent.innerHTML += `
      <div class="card" style="position: relative;">
        <div style="position: absolute; top: 1.25rem; right: 1.25rem; font-size: 0.75rem; font-weight: bold; padding: 4px 10px; border-radius: 50px; background-color: rgba(255,255,255,0.04); color: ${statusColor}; border: 1px solid ${statusColor}">
          ${statusText}
        </div>
        
        <h4 style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Última compra (${lastPurchase.date}):</h4>
        <div style="margin-top: 10px;">
          ${lastPurchase.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 0.9rem;">${item.brand} - ${item.name}</span>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">$${item.price.toLocaleString('es-CL')}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 12px; font-size: 0.9rem;">
          <span style="color: var(--text-secondary);">Total Estimado:</span>
          <strong style="color: var(--primary); font-size: 1.05rem;">$${lastPurchase.total.toLocaleString('es-CL')}</strong>
        </div>

        <button id="btn-quick-reorder" class="btn btn-primary" style="margin-top: 12px; font-size: 0.85rem; padding: 0.65rem 1rem;">
          <span class="material-symbols-rounded" style="font-size: 18px;">shopping_cart</span>
          Recompra Rápida
        </button>
      </div>
    `;

    setTimeout(() => {
      document.getElementById('btn-quick-reorder')?.addEventListener('click', async () => {
        const reorderItem = {
          id: `purch-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          total: lastPurchase.total,
          items: lastPurchase.items.map(i => ({ ...i })),
          type: 'E-Commerce (Recompra Rápida)'
        };
        
        await addPurchase(reorderItem);
        
        profile.points = (profile.points || 0) + Math.round(lastPurchase.total * 0.05);
        await saveProfile(profile);
        
        showToast('¡Compra recurrente procesada con éxito!');
        navigateTo('dashboard');
      });
    }, 50);
  }

  // MODAL FOR SCANNING TICKET
  function openScanModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0;"><span class="material-symbols-rounded">qr_code_scanner</span> Escanear Boleta</h2>
          <button id="btn-close-modal" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>
        
        <div style="background-color: black; border-radius: 12px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; margin-bottom: 1.25rem;">
          <div class="scanner-laser" style="position: absolute; left: 0; right: 0; top: 50%; height: 2px; background-color: var(--danger); box-shadow: 0 0 8px var(--danger); animation: scannerAnim 2s ease-in-out infinite;"></div>
          <span class="material-symbols-rounded" style="font-size: 64px; color: #374151;">photo_camera</span>
          <span style="color: #6b7280; font-size: 0.8rem; margin-top: 8px;">Simulador de Cámara PetOne</span>
        </div>

        <div class="input-group">
          <label class="input-label">Monto de la Boleta ($)</label>
          <input type="number" id="ticket-amount" class="input-field" placeholder="Ej. 24990" value="24990">
        </div>
        
        <div class="input-group" style="margin-bottom: 1.5rem;">
          <label class="input-label">Nro de Boleta</label>
          <input type="text" id="ticket-number" class="input-field" placeholder="Ej. 104593" value="104593">
        </div>

        <button id="btn-process-scan" class="btn btn-primary">
          <span class="material-symbols-rounded">check</span>
          Procesar Escaneo
        </button>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'scan-anim-css';
    style.innerHTML = `
      @keyframes scannerAnim {
        0%, 100% { top: 10%; }
        50% { top: 90%; }
      }
    `;
    document.head.appendChild(style);

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      overlay.remove();
      document.getElementById('scan-anim-css')?.remove();
    });

    document.getElementById('btn-process-scan').addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('ticket-amount').value) || 0;
      const ticketNum = document.getElementById('ticket-number').value.trim();

      if (amount <= 0 || !ticketNum) {
        alert('Ingresa datos válidos de la boleta.');
        return;
      }

      const newTicket = {
        id: `ticket-${Date.now()}`,
        amount,
        ticketNumber: ticketNum
      };

      if (window.appState.isOnline) {
        await addPurchase({
          id: newTicket.id,
          date: new Date().toISOString().split('T')[0],
          total: amount,
          items: [
            { brand: 'Compra en Sucursal', name: `Boleta #${ticketNum}`, price: amount }
          ],
          type: 'Tienda Física (Escaneado)'
        });
        
        profile.points = (profile.points || 0) + Math.round(amount * 0.05);
        await saveProfile(profile);

        showToast('Boleta validada y puntos acumulados exitosamente.');
      } else {
        await addOfflineTicket(newTicket);
        showToast('Boleta guardada localmente sin conexión. Se sincronizará automáticamente apenas recuperes señal.');
      }

      overlay.remove();
      document.getElementById('scan-anim-css')?.remove();
      
      renderDashboard(container);
    });
  }

  // MODAL FOR SCAN & GO MOCK
  function openScanGoModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0;"><span class="material-symbols-rounded">qr_code_scanner</span> Scan & Go Móvil</h2>
          <button id="btn-close-scan-go" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div style="background-color: black; border-radius: 12px; height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; margin-bottom: 1rem;">
          <div class="scanner-laser" style="position: absolute; left: 0; right: 0; top: 50%; height: 2px; background-color: var(--secondary); box-shadow: 0 0 8px var(--secondary); animation: scannerAnim 2s ease-in-out infinite;"></div>
          <span class="material-symbols-rounded" style="font-size: 48px; color: #10b981;">photo_camera</span>
          <span style="color: #6b7280; font-size: 0.75rem; margin-top: 4px;">Apunte a la góndola de PetOne</span>
        </div>

        <div class="input-group">
          <label class="input-label">Selecciona el código de barras a escanear:</label>
          <select id="scango-product" class="input-field select-field">
            <option value="prod-8">Julius K9 Arnés Powerharness (Accesorios)</option>
            <option value="prod-1">Royal Canin Medium Adult 15kg (Alimentos)</option>
            <option value="prod-4">EasyClean Arena Bentonita (Higiene)</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 1.5rem;">
          <button id="btn-scango-simulate" class="btn btn-primary" style="flex: 2; background-color: var(--secondary); box-shadow: none;">Simular Escaneo</button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-scan-go').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-scango-simulate').addEventListener('click', () => {
      const prodId = document.getElementById('scango-product').value;
      overlay.remove();
      openScanGoDetailModal(prodId);
    });
  }

  // SCAN & GO DETAIL DIALOG WITH BUY / ABANDON LOGGING
  function openScanGoDetailModal(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0;"><span class="material-symbols-rounded">sell</span> Detalle de Góndola</h2>
          <button id="btn-close-scango-detail" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; background-color: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
          <div style="width: 56px; height: 56px; border-radius: 8px; background: ${prod.imageBg}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
            ${prod.brand[0]}
          </div>
          <div>
            <h4 style="font-size: 0.9rem; font-weight: bold;">${prod.brand} - ${prod.name}</h4>
            <div style="font-size: 0.95rem; font-weight: bold; color: var(--secondary); margin-top: 2px;">$${prod.price.toLocaleString('es-CL')}</div>
          </div>
        </div>

        <div class="card" style="padding: 10px; background-color: rgba(255,255,255,0.01);">
          <div style="font-weight: 600; font-size: 0.8rem; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span class="material-symbols-rounded" style="color: var(--accent); font-size: 14px;">reviews</span>
            Opiniones de Clientes (${prod.rating} ★)
          </div>
          <p style="font-size: 0.75rem; font-style: italic; color: var(--text-secondary);">
            "Gran calidad. Lo he comprado 3 veces para mi perro y le encanta." - Juan P.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 1.25rem;">
          <button id="btn-scango-pay" class="btn btn-primary" style="background-color: var(--secondary); box-shadow: none;">
            <span class="material-symbols-rounded" style="font-size: 18px;">wallet</span>
            Pagar al Instante ($${prod.price.toLocaleString('es-CL')})
          </button>
          
          <button id="btn-scango-abandon" class="btn btn-secondary" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2);">
            Abandonar Compra
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-scango-detail').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-scango-pay').addEventListener('click', async () => {
      await addPurchase({
        id: `scango-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        total: prod.price,
        items: [{ brand: prod.brand, name: prod.name, price: prod.price }],
        type: 'Scan & Go (Sucursal)'
      });

      await addScanLog({
        id: `log-${Date.now()}`,
        productId: prod.id,
        brand: prod.brand,
        name: prod.name,
        timestamp: Date.now(),
        purchased: true,
        abandonReason: ''
      });

      profile.points = (profile.points || 0) + Math.round(prod.price * 0.05);
      await saveProfile(profile);

      showToast(`¡PAGO EXITOSO! Compra registrada en tienda física.`);
      overlay.remove();
      navigateTo('dashboard');
    });

    document.getElementById('btn-scango-abandon').addEventListener('click', () => {
      overlay.remove();
      openAbandonReasonModal(prod);
    });
  }

  // ABANDON REASON MODAL
  function openAbandonReasonModal(product) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content">
        <h3 style="margin-bottom: 8px;">¿Por qué decidiste no llevar el producto?</h3>
        <p style="font-size: 0.8rem; margin-bottom: 1.25rem; color: var(--text-secondary);">Tus respuestas nos ayudan a negociar mejores precios con el proveedor.</p>

        <div class="input-group">
          <select id="abandon-reason-select" class="input-field select-field">
            <option value="Precio muy alto">El precio es muy alto</option>
            <option value="Pocas reseñas">Tiene pocas reseñas / Dudas de calidad</option>
            <option value="Sin stock fisico">No encontré la talla/formato en góndola</option>
            <option value="Otro">Otro motivo</option>
          </select>
        </div>

        <button id="btn-save-abandon" class="btn btn-primary" style="margin-top: 1rem;">Enviar Comentario</button>
      </div>
    `;

    document.getElementById('btn-save-abandon').addEventListener('click', async () => {
      const reason = document.getElementById('abandon-reason-select').value;
      
      await addScanLog({
        id: `log-${Date.now()}`,
        productId: product.id,
        brand: product.brand,
        name: product.name,
        timestamp: Date.now(),
        purchased: false,
        abandonReason: reason
      });

      showToast('Comentario guardado. Agradecemos tu feedback.');
      overlay.remove();
      navigateTo('dashboard');
    });
  }

  // Initial load
  render();
}
