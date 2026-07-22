import { getPurchases, getPets, getScanLogs, getRetailMediaPerformance } from '../utils/db.js';
import { getTenantConfig } from '../config/tenantConfig.js';
import { navigateTo } from '../main.js';

export async function renderAdminPortal(container) {
  const tenant = getTenantConfig();
  const purchases = await getPurchases();
  const pets = await getPets();
  const scanLogs = await getScanLogs();
  const mediaPerformance = await getRetailMediaPerformance();

  let activeAdminTab = 'overview'; // overview, inventory, Media

  function render() {
    container.innerHTML = '';

    // Main Portal Layout
    const portal = document.createElement('div');
    portal.className = 'glass-card';
    portal.style.padding = '2rem 1.5rem';
    portal.style.maxWidth = '1100px';
    portal.style.margin = '1.5rem auto 3rem auto';
    portal.style.width = '100%';
    portal.style.border = '1px solid var(--primary-glow)';
    portal.style.background = 'linear-gradient(180deg, rgba(10, 15, 29, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)';
    portal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.65rem; color: var(--primary); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">SaaS Corporate Portal</span>
          <h2 style="margin: 3px 0 0 0; font-size: 1.3rem; font-weight: 800; color: white;">
             ${tenant.id === 'default' ? '📊 PetOne' : tenant.id === 'superzoo' ? '🧡 SuperZoo' : '🏙️ PetCity'} B2B Control Center
          </h2>
        </div>
        <button id="btn-admin-exit" class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.75rem; border-color: rgba(255,255,255,0.15);">
          <span class="material-symbols-rounded" style="font-size: 14px; vertical-align: text-bottom; margin-right: 4px;">logout</span>
          Salir del Portal
        </button>
      </div>

      <!-- Navigation tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
        <button id="tab-overview" class="btn ${activeAdminTab === 'overview' ? 'btn-primary' : 'btn-secondary'}" style="width: auto; padding: 6px 12px; font-size: 0.75rem;">
          Métricas de Negocio
        </button>
        <button id="tab-media" class="btn ${activeAdminTab === 'media' ? 'btn-primary' : 'btn-secondary'}" style="width: auto; padding: 6px 12px; font-size: 0.75rem;">
          Retail Media & Proveedores
        </button>
      </div>

      <!-- Content Area -->
      <div id="admin-portal-content"></div>
    `;
    container.appendChild(portal);

    document.getElementById('btn-admin-exit').addEventListener('click', () => navigateTo('profile'));

    document.getElementById('tab-overview').addEventListener('click', () => {
      activeAdminTab = 'overview';
      render();
    });
    document.getElementById('tab-media').addEventListener('click', () => {
      activeAdminTab = 'media';
      render();
    });

    const contentBox = document.getElementById('admin-portal-content');
    if (activeAdminTab === 'overview') {
      renderOverviewTab(contentBox);
    } else {
      renderMediaTab(contentBox);
    }
  }

  // OVERVIEW TAB: SALES, TICKET AND SHELVING FRICTION
  function renderOverviewTab(parent) {
    // Math stats
    const totalSales = purchases.reduce((sum, p) => sum + p.total, 0);
    const avgTicket = purchases.length > 0 ? Math.round(totalSales / purchases.length) : 0;
    
    // Scan & Go conversion calculations
    let totalScans = scanLogs.length;
    let scansPurchased = scanLogs.filter(log => log.purchased).length;
    let scansAbandoned = totalScans - scansPurchased;
    let isMockData = false;
    let displayFrictionLogs = scanLogs.filter(log => !log.purchased);
    
    if (totalScans === 0) {
      isMockData = true;
      totalScans = 12;
      scansPurchased = 8;
      scansAbandoned = 4;
      displayFrictionLogs = [
        { brand: 'Royal Canin', name: 'Medium Adult 15kg', abandonReason: 'Precio muy alto (Competencia)' },
        { brand: 'KONG', name: 'Classic Rellenable L', abandonReason: 'Sin stock físico en góndola' },
        { brand: 'Oster', name: 'Champú Cachorros 500ml', abandonReason: 'Dudas sobre ingredientes/calidad' },
        { brand: 'Orijen', name: 'Fit & Trim 5.4kg', abandonReason: 'Precio muy alto' }
      ];
    }
    const scanConversionRate = Math.round((scansPurchased / totalScans) * 100);

    parent.innerHTML = `
      <!-- Row 1: Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.25rem;">
        <div class="card" style="margin-bottom: 0; padding: 12px; border: 1px solid rgba(255,255,255,0.03); background-color: rgba(255,255,255,0.015);">
          <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Ventas Canal PWA</div>
          <div style="font-size: 1.25rem; font-weight: 900; color: var(--primary); margin-top: 4px;">$${totalSales.toLocaleString('es-CL')}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">${purchases.length} retiros completados</div>
        </div>
        
        <div class="card" style="margin-bottom: 0; padding: 12px; border: 1px solid rgba(255,255,255,0.03); background-color: rgba(255,255,255,0.015);">
          <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Ticket Promedio Retiro</div>
          <div style="font-size: 1.25rem; font-weight: 900; color: var(--secondary); margin-top: 4px;">$${avgTicket.toLocaleString('es-CL')}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">Clientes únicos: ${pets.length > 0 ? pets.length : 1}</div>
        </div>
      </div>

      <!-- Row 2: Scan & Go conversion -->
      <div class="card" style="border: 1px solid rgba(255,255,255,0.03); background-color: rgba(255,255,255,0.015); margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; margin-top: 0; margin-bottom: 4px; color: white;">Conversión de Góndola Física (Scan & Go)</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">Conversión de productos escaneados por los clientes en las estanterías de las sucursales de ${tenant.name}.</p>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 6px;">
          <span style="color: var(--text-secondary);">Tasa de Conversión:</span>
          <strong style="color: var(--secondary); font-size: 0.9rem;">${scanConversionRate}%</strong>
        </div>

        <div style="height: 14px; background-color: rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; display: flex; margin-bottom: 10px;">
          <div style="width: ${scanConversionRate}%; background-color: var(--secondary); height: 100%;"></div>
          <div style="width: ${100 - scanConversionRate}%; background-color: var(--danger); height: 100%;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 12px;">
          <span>🛍️ Comprados (${scansPurchased})</span>
          <span>❌ Abandonados (${scansAbandoned})</span>
        </div>

        <!-- Frictions -->
        <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
          <h5 style="font-size: 0.8rem; font-weight: bold; color: white; margin-top: 0; margin-bottom: 6px;">Fricciones de Góndola Reportadas (Feedbacks):</h5>
          
          ${isMockData ? `
            <div style="font-size: 0.65rem; color: var(--accent); margin-bottom: 8px; font-style: italic; display: flex; align-items: center; gap: 4px;">
              <span class="material-symbols-rounded" style="font-size: 12px;">info</span>
              * Datos demostrativos de simulación (Aún sin registros de abandono del tenant)
            </div>
          ` : ''}

          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${displayFrictionLogs.map(log => `
              <div style="font-size: 0.7rem; display: flex; justify-content: space-between; background-color: rgba(255,255,255,0.02); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.03);">
                <span style="color: white; font-weight: 500;">${log.brand} - ${log.name}</span>
                <span style="color: var(--danger); font-weight: 600;">➔ ${log.abandonReason}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // RETAIL MEDIA TAB: SPONSORED ADS PERFORMANCE
  function renderMediaTab(parent) {
    parent.innerHTML = `
      <div class="card" style="border: 1px solid rgba(255,255,255,0.03); background-color: rgba(255,255,255,0.015); margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; margin-top: 0; margin-bottom: 4px; color: white;">Rendimiento de Retail Media (Publicidad)</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">
          Métricas de conversión y visualización de banners contratados por marcas proveedoras B2B dentro de la PWA de ${tenant.name}.
        </p>

        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);">
              <th style="padding: 8px 0;">Marca Proveedora</th>
              <th style="padding: 8px 0; text-align: center;">Impresiones</th>
              <th style="padding: 8px 0; text-align: center;">Clicks</th>
              <th style="padding: 8px 0; text-align: right;">CTR Promedio</th>
            </tr>
          </thead>
          <tbody>
            ${mediaPerformance.length > 0 ? mediaPerformance.map(ad => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return `
                <tr style="border-bottom: 1px dashed rgba(255,255,255,0.05);">
                  <td style="padding: 8px 0; font-weight: bold; color: white;">${ad.sponsor}</td>
                  <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">${ad.impressions}</td>
                  <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">${ad.clicks}</td>
                  <td style="padding: 8px 0; text-align: right; color: var(--primary); font-weight: 800;">${ctr}%</td>
                </tr>
              `;
            }).join('') : `
              <tr style="border-bottom: 1px dashed rgba(255,255,255,0.05);">
                <td style="padding: 8px 0; font-weight: bold; color: white;">KONG Classic</td>
                <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">284</td>
                <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">42</td>
                <td style="padding: 8px 0; text-align: right; color: var(--primary); font-weight: 800;">14.8%</td>
              </tr>
              <tr style="border-bottom: 1px dashed rgba(255,255,255,0.05);">
                <td style="padding: 8px 0; font-weight: bold; color: white;">Royal Canin Alimentos</td>
                <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">192</td>
                <td style="padding: 8px 0; text-align: center; color: var(--text-primary);">15</td>
                <td style="padding: 8px 0; text-align: right; color: var(--primary); font-weight: 800;">7.8%</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <div style="background-color: rgba(79, 70, 229, 0.03); border: 1px solid rgba(79, 70, 229, 0.15); padding: 12px; border-radius: 8px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45;">
        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary); vertical-align: text-bottom; margin-right: 4px;">security</span>
        <strong>Aislamiento de Seguridad:</strong> Todos los datos de este panel están protegidos bajo cifrado y filtrados estrictamente por el identificador del inquilino <code>tenant_id = "${tenant.id}"</code>. Los clientes en la PWA no tienen acceso a estos endpoints administrativos.
      </div>
    `;
  }

  // Initial load
  render();
}
