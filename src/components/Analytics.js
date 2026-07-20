// Analytics Component for the Owner Dashboard, B2B Supplier Portal, and Privacy Consent Settings (Phase 3 Upgrade)
import { getPurchases, getPets, getScanLogs, getRetailMediaPerformance, getProfile, saveProfile } from '../utils/db.js';
import { navigateTo, showToast } from '../main.js';

export async function renderAnalytics(container) {
  const purchases = await getPurchases();
  const pets = await getPets();
  const scanLogs = await getScanLogs();
  const mediaPerformance = await getRetailMediaPerformance();
  const profile = await getProfile();

  let activeTab = 'owner'; // owner, supplier, privacy
  let selectedSupplierBrand = 'KONG';

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-back-to-dash-an" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Centro de Analíticas y Privacidad</h2>
      </div>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-an').addEventListener('click', () => navigateTo('dashboard'));

    // Section Tabs
    const tabs = document.createElement('div');
    tabs.className = 'scroll-x';
    tabs.style.marginBottom = '1.25rem';
    tabs.innerHTML = `
      <div class="pill ${activeTab === 'owner' ? 'pill-active' : ''}" data-tab="owner" style="cursor: pointer;">Dueño Tienda</div>
      <div class="pill ${activeTab === 'supplier' ? 'pill-active' : ''}" data-tab="supplier" style="cursor: pointer;">Portal Proveedores</div>
      <div class="pill ${activeTab === 'privacy' ? 'pill-active' : ''}" data-tab="privacy" style="cursor: pointer;">Privacidad de Datos</div>
    `;
    container.appendChild(tabs);

    tabs.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeTab = pill.dataset.tab;
        render();
      });
    });

    const contentBox = document.createElement('div');
    container.appendChild(contentBox);

    if (activeTab === 'owner') {
      renderOwnerDashboard(contentBox);
    } else if (activeTab === 'supplier') {
      renderSupplierPortal(contentBox);
    } else if (activeTab === 'privacy') {
      renderPrivacySettings(contentBox);
    }
  }

  // 1. OWNER DASHBOARD VIEW
  function renderOwnerDashboard(parent) {
    // Basic stats calculation from IndexedDB!
    const totalSales = purchases.reduce((sum, p) => sum + p.total, 0);
    const avgTicket = purchases.length > 0 ? Math.round(totalSales / purchases.length) : 0;
    
    // Scan & Go calculations
    let totalScans = scanLogs.length;
    let scansPurchased = scanLogs.filter(log => log.purchased).length;
    let scansAbandoned = totalScans - scansPurchased;
    
    let isMockData = false;
    let displayFrictionLogs = scanLogs.filter(log => !log.purchased);
    
    if (totalScans === 0) {
      isMockData = true;
      totalScans = 10;
      scansPurchased = 7;
      scansAbandoned = 3;
      displayFrictionLogs = [
        { brand: 'Royal Canin', name: 'Medium Adult 15kg', abandonReason: 'Precio muy alto (Competencia)' },
        { brand: 'KONG', name: 'Classic Juguete Rellenable', abandonReason: 'Sin stock en góndola' },
        { brand: 'EasyClean', name: 'Arena Bentonita 4kg', abandonReason: 'Pocas reseñas de calidad' }
      ];
    }
    
    const scanConversionRate = totalScans > 0 ? Math.round((scansPurchased / totalScans) * 100) : 0;

    parent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.25rem;">
        <div class="card" style="margin-bottom: 0; text-align: center; padding: 10px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Ventas MVP Acumuladas</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--secondary); margin-top: 4px;">$${totalSales.toLocaleString('es-CL')}</div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">${purchases.length} transacciones</div>
        </div>
        <div class="card" style="margin-bottom: 0; text-align: center; padding: 10px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Ticket Promedio PWA</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-top: 4px;">$${avgTicket.toLocaleString('es-CL')}</div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">Hogares activos: ${pets.length > 0 ? 1 : 0}</div>
        </div>
      </div>

      <!-- Scan & Go Friction analysis widget (CSS Chart) -->
      <div class="card">
        <h3 style="font-size: 0.95rem; margin-bottom: 8px;">Scan & Go: Intención de Compra</h3>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">Analiza qué porcentaje de productos escaneados físicamente se compran versus se abandonan.</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 6px;">
          <span>Conversión de Escaneo:</span>
          <strong>${scanConversionRate}%</strong>
        </div>

        <!-- CSS Bar graph for conversion -->
        <div style="height: 16px; background-color: var(--border-color); border-radius: 8px; overflow: hidden; display: flex; margin-bottom: 12px;">
          <div style="width: ${scanConversionRate}%; background-color: var(--secondary); height: 100%;" title="Comprados: ${scansPurchased}"></div>
          <div style="width: ${100 - scanConversionRate}%; background-color: var(--danger); height: 100%;" title="Abandonados: ${scansAbandoned}"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 12px;">
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--secondary); border-radius: 50%; display: inline-block;"></span> Comprados (${scansPurchased})</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background: var(--danger); border-radius: 50%; display: inline-block;"></span> Abandonados (${scansAbandoned})</span>
        </div>

        <!-- List of Abandons friction feedback (Always visible) -->
        <div style="border-top: 1px dashed var(--border-color); padding-top: 10px;">
          <h4 style="font-size: 0.8rem; font-weight: bold; color: var(--text-primary); margin-bottom: 6px;">Fricciones de Compra Detectadas:</h4>
          
          ${isMockData ? `
            <div style="font-size: 0.65rem; color: var(--accent); margin-bottom: 8px; font-style: italic; display: flex; align-items: center; gap: 4px;">
              <span class="material-symbols-rounded" style="font-size: 12px;">info</span>
              * Datos demostrativos de simulación (Aún no tienes registros de abandono reales)
            </div>
          ` : ''}

          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${displayFrictionLogs.map(log => `
              <div style="font-size: 0.7rem; display: flex; justify-content: space-between; background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 5px 8px; border-radius: 6px;">
                <span style="color: var(--text-primary); font-weight: 500; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${log.brand} - ${log.name}</span>
                <span style="color: var(--danger); font-weight: 600;">➔ ${log.abandonReason}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>


      <!-- Retail Media Dashboard (Ads statistics) -->
      <div class="card">
        <h3 style="font-size: 0.95rem; margin-bottom: 8px;">Rendimiento de Retail Media</h3>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px;">Estadísticas de banners patrocinados y conversión de proveedores dentro de la PWA.</p>
        
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
              <th style="padding: 6px 0;">Campaña</th>
              <th style="padding: 6px 0; text-align: center;">Impresiones</th>
              <th style="padding: 6px 0; text-align: center;">Clics</th>
              <th style="padding: 6px 0; text-align: right;">CTR</th>
            </tr>
          </thead>
          <tbody>
            ${mediaPerformance.length > 0 ? mediaPerformance.map(ad => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return `
                <tr style="border-bottom: 1px dashed var(--border-color);">
                  <td style="padding: 6px 0; font-weight: 500; color: var(--text-primary);">${ad.sponsor}</td>
                  <td style="padding: 6px 0; text-align: center;">${ad.impressions}</td>
                  <td style="padding: 6px 0; text-align: center;">${ad.clicks}</td>
                  <td style="padding: 6px 0; text-align: right; color: var(--primary); font-weight: bold;">${ctr}%</td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="4" style="text-align: center; padding: 10px 0; color: var(--text-muted); font-style: italic;">Sin campañas activas registradas.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  }

  // 2. B2B SUPPLIER PORTAL VIEW
  function renderSupplierPortal(parent) {
    parent.innerHTML = `
      <div class="glass-card" style="margin-bottom: 1.25rem;">
        <label class="input-label" for="supplier-brand-select">Selecciona tu Marca (Portal Proveedor):</label>
        <select id="supplier-brand-select" class="input-field select-field">
          <option value="KONG" ${selectedSupplierBrand === 'KONG' ? 'selected' : ''}>KONG (Juguetes)</option>
          <option value="Royal Canin" ${selectedSupplierBrand === 'Royal Canin' ? 'selected' : ''}>Royal Canin (Alimentos)</option>
          <option value="Oster" ${selectedSupplierBrand === 'Oster' ? 'selected' : ''}>Oster (Higiene)</option>
          <option value="Julius K9" ${selectedSupplierBrand === 'Julius K9' ? 'selected' : ''}>Julius K9 (Accesorios)</option>
        </select>
      </div>
    `;

    // Mock brand analytics compiled B2B data
    const adData = mediaPerformance.find(ad => ad.sponsor.toLowerCase().includes(selectedSupplierBrand.toLowerCase())) || { impressions: 0, clicks: 0 };
    const ctr = adData.impressions > 0 ? ((adData.clicks / adData.impressions) * 100).toFixed(1) : '0.0';

    const brandStats = document.createElement('div');
    parent.appendChild(brandStats);

    brandStats.innerHTML = `
      <div class="card">
        <h3 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--primary);">Desempeño de ${selectedSupplierBrand}</h3>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">Datos agregados anonimizados sobre tu marca dentro de PetOne Retail.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div style="background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 8px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Share de Mercado</div>
            <div style="font-size: 1.15rem; font-weight: bold; color: var(--secondary); margin-top: 2px;">32%</div>
            <div style="font-size: 0.6rem; color: var(--text-secondary);">En su categoría</div>
          </div>
          <div style="background-color: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 8px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Evaluación NPS</div>
            <div style="font-size: 1.15rem; font-weight: bold; color: var(--accent); margin-top: 2px;">4.8 ★</div>
            <div style="font-size: 0.6rem; color: var(--text-secondary);">Promedio reseñas</div>
          </div>
        </div>

        <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 8px;">
          <h4 style="font-size: 0.8rem; font-weight: bold; margin-bottom: 6px;">Métricas Retail Media (Tus Campañas):</h4>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
            <span style="color: var(--text-secondary);">Impresiones en App:</span>
            <strong>${adData.impressions}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
            <span style="color: var(--text-secondary);">Clics en Ofertas:</span>
            <strong>${adData.clicks}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
            <span style="color: var(--text-secondary);">Tasa de Clics (CTR):</span>
            <strong style="color: var(--primary);">${ctr}%</strong>
          </div>
        </div>
      </div>

      <div style="background-color: rgba(79,70,229,0.02); border: 1px solid rgba(79,70,229,0.15); padding: 10px; border-radius: 8px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary); vertical-align: text-bottom; margin-right: 4px;">security</span>
        <em>Para cumplir con las normas de privacidad, todos los perfiles de hogares individuales están anonimizados y consolidados. Tu marca no tiene acceso a identidades directas de tutores.</em>
      </div>
    `;

    document.getElementById('supplier-brand-select').addEventListener('change', (e) => {
      selectedSupplierBrand = e.target.value;
      render();
    });
  }

  // 3. PRIVACY AND CONSENT SETTINGS VIEW
  function renderPrivacySettings(parent) {
    const consents = profile.consents || { shareAnon: true, tracking: false, pushPromo: true };

    parent.innerHTML = `
      <div class="glass-card">
        <h3 style="font-size: 0.95rem; margin-bottom: 10px; color: var(--primary); display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-rounded">shield_lock</span> Gobernanza de Datos
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Controla de manera granular cómo PetOne gestiona tus datos personales entre la tienda y las marcas proveedoras aliadas.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 1.5rem;">
          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="chk-share-anon" style="margin-top: 4px;" ${consents.shareAnon ? 'checked' : ''}>
            <div>
              <strong>Compartir perfil anonimizado del hogar</strong>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Permite que compartamos estadísticas agregadas del hogar (ej. tipo de mascota, frecuencia de compra) con las marcas aliadas para mejorar el stock.</p>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="chk-tracking" style="margin-top: 4px;" ${consents.tracking ? 'checked' : ''}>
            <div>
              <strong>Cookies de rastreo de marcas aliadas</strong>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Permite que marcas de alimentos registren cookies de comportamiento para publicidad dirigida.</p>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="chk-push-promo" style="margin-top: 4px;" ${consents.pushPromo ? 'checked' : ''}>
            <div>
              <strong>Notificaciones push promocionales</strong>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Permite notificaciones patrocinadas con cupones específicos de proveedores.</p>
            </div>
          </label>
        </div>

        <button id="btn-save-privacy" class="btn btn-primary">Guardar Preferencias de Privacidad</button>
      </div>
    `;

    document.getElementById('btn-save-privacy').addEventListener('click', async () => {
      const shareAnon = document.getElementById('chk-share-anon').checked;
      const tracking = document.getElementById('chk-tracking').checked;
      const pushPromo = document.getElementById('chk-push-promo').checked;

      profile.consents = { shareAnon, tracking, pushPromo };
      await saveProfile(profile);

      showToast('Preferencias de privacidad guardadas correctamente.');
      navigateTo('dashboard');
    });
  }

  // Initial load
  render();
}
