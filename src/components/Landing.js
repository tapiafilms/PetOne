import { navigateTo } from '../main.js';

export function renderLanding(container) {
  container.innerHTML = '';
  
  // Custom styles for Landing
  const styles = document.createElement('style');
  styles.id = 'landing-styles';
  styles.innerHTML = `
    .landing-wrapper {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      font-family: 'Outfit', sans-serif;
    }
    .landing-hero-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
      align-items: center;
      padding: 3rem 0;
    }
    @media(min-width: 868px) {
      .landing-hero-section {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }
    .landing-gradient-text {
      background: linear-gradient(135deg, #a855f7 0%, #4f46e5 50%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 900;
    }
    .landing-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-top: 2rem;
    }
    @media(min-width: 640px) {
      .landing-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media(min-width: 1024px) {
      .landing-grid {
        grid-template-columns: 1fr 1fr 1fr 1fr;
      }
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 24px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      border-color: var(--primary-glow);
      background: rgba(79, 70, 229, 0.02);
    }
    .demo-link-card {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%);
      border: 1px dashed var(--primary-glow);
      border-radius: 20px;
      padding: 24px;
      margin-top: 3rem;
      text-align: center;
    }
    
    /* Device Mockup Frame CSS */
    .mockup-wrapper {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
      aspect-ratio: 9 / 18.5;
      background: #1e293b;
      border: 12px solid #0f172a;
      border-radius: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .mockup-screen {
      flex: 1;
      background: #080c16;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: hidden;
      position: relative;
    }
    .mockup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .mockup-stories {
      display: flex;
      gap: 8px;
      overflow-x: hidden;
    }
    .mockup-story-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid #a855f7;
      padding: 2px;
      flex-shrink: 0;
    }
    .mockup-story-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #10b981);
    }
    .mockup-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 12px;
      font-size: 0.7rem;
    }
  `;
  document.head.appendChild(styles);

  // Layout structure
  const content = document.createElement('div');
  content.className = 'landing-wrapper';
  content.innerHTML = `
    <!-- Top B2B Navigation -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="/logo-petone.png" alt="PetOne" style="height: 28px; width: auto; filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.4));">
        <span style="font-size: 1.15rem; font-weight: 900; letter-spacing: -0.5px; color: white;">PetOne <span style="font-weight: 300; color: #a855f7;">SaaS</span></span>
      </div>
      <button id="btn-top-admin" class="btn btn-secondary" style="width: auto; padding: 6px 14px; font-size: 0.75rem;">
        <span class="material-symbols-rounded" style="font-size: 14px; vertical-align: text-bottom; margin-right: 4px;">admin_panel_settings</span>
        Acceso Socio
      </button>
    </div>

    <!-- Hero split screen Section -->
    <div class="landing-hero-section">
      <!-- Left Info Block -->
      <div style="text-align: left;">
        <span style="display: inline-block; font-size: 0.65rem; color: #a855f7; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; background: rgba(168, 85, 247, 0.08); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(168, 85, 247, 0.15); margin-bottom: 1rem;">
          🚀 Plataforma SaaS Multi-Tenant
        </span>
        <h1 style="font-size: 2.5rem; line-height: 1.15; font-weight: 900; letter-spacing: -1px; color: white; margin-bottom: 1.25rem;">
          La Plataforma <span class="landing-gradient-text">Marca Blanca</span> para tu Negocio de Mascotas
        </h1>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 2rem;">
          Convierte tu veterinaria o pet shop local en un ecosistema móvil de vanguardia. Ofrece Click & Collect dinámico sin costes de pasarela, Scan & Go interactivo en góndolas, retratos virales creados por IA y un canal Retail Media premium para negociar publicidad B2B con tus marcas proveedoras.
        </p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
          <button id="btn-landing-admin" class="btn btn-primary" style="width: auto; padding: 14px 24px; font-weight: bold; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);">
            <span class="material-symbols-rounded" style="vertical-align: text-bottom; margin-right: 6px; font-size: 18px;">admin_panel_settings</span>
            Consola del Administrador
          </button>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">
            Clave Demo: <strong style="color: white; font-family: monospace; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">admin123</strong>
          </div>
        </div>
      </div>

      <!-- Right Mockup Device Block -->
      <div style="display: flex; justify-content: center;">
        <div class="mockup-wrapper">
          <!-- Notch -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 110px; height: 18px; background: #0f172a; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; z-index: 100;"></div>
          
          <div class="mockup-screen">
            <!-- Simulated App Bar -->
            <div class="mockup-header">
              <span style="font-weight: 800; font-size: 0.65rem; color: #ea580c;">🧡 SuperZoo</span>
              <span style="font-size: 0.5rem; color: var(--text-muted);">powered by PetOne</span>
            </div>
            
            <!-- Simulated Stories -->
            <div class="mockup-stories">
              <div class="mockup-story-circle"><div class="mockup-story-inner" style="background: linear-gradient(135deg, #ea580c, #ca8a04);"></div></div>
              <div class="mockup-story-circle"><div class="mockup-story-inner"></div></div>
              <div class="mockup-story-circle"><div class="mockup-story-inner" style="background: #4f46e5;"></div></div>
              <div class="mockup-story-circle"><div class="mockup-story-inner"></div></div>
            </div>

            <!-- Simulated Welcome -->
            <div style="font-size: 0.8rem; font-weight: bold; color: white;">¡Hola, Pablo! 👋</div>

            <!-- Simulated Pet Card -->
            <div class="mockup-card" style="border-left: 3px solid #ea580c; display: flex; gap: 8px; align-items: center;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #ea580c; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.6rem;">R</div>
              <div>
                <div style="font-weight: bold; color: white;">Ragnar</div>
                <div style="color: var(--text-muted); font-size: 0.6rem;">Golden Retriever • 2 años</div>
              </div>
            </div>

            <!-- Simulated Promo Banner -->
            <div class="mockup-card" style="background: linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(202, 138, 4, 0.1) 100%); border: 1px solid rgba(234, 88, 12, 0.2); position: relative;">
              <div style="font-weight: bold; color: #ea580c; font-size: 0.65rem;">Retail Media Banner</div>
              <p style="font-size: 0.55rem; color: var(--text-secondary); margin: 2px 0 0 0;">15% OFF en Juguetes KONG este mes.</p>
            </div>
            
            <!-- Bottom menu mockup -->
            <div style="margin-top: auto; display: flex; justify-content: space-around; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
              <span class="material-symbols-rounded" style="font-size: 16px; color: #ea580c;">home</span>
              <span class="material-symbols-rounded" style="font-size: 16px; color: var(--text-muted);">shopping_basket</span>
              <span class="material-symbols-rounded" style="font-size: 16px; color: var(--text-muted);">menu_book</span>
              <span class="material-symbols-rounded" style="font-size: 16px; color: var(--text-muted);">account_circle</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div style="margin-top: 2rem;">
      <h3 style="font-size: 1.3rem; font-weight: 800; text-align: center; color: white; margin-bottom: 0.5rem;">Potencia tu Tienda Física y Digital</h3>
      <p style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; max-width: 500px; margin: 0 auto 2rem auto;">
        Tecnología de punta adaptada para resolver los dolores de stock, cobro y fidelización en locales veterinarios.
      </p>
      
      <div class="landing-grid">
        <!-- Feature 1 -->
        <div class="feature-card">
          <span class="material-symbols-rounded" style="font-size: 28px; color: var(--secondary);">storefront</span>
          <h4 style="font-size: 0.9rem; font-weight: bold; color: white; margin-top: 4px;">Click & Collect</h4>
          <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
            Los clientes eligen múltiples productos y crean retiros físicos con códigos QR/código de barra CSS para pagar en caja. Cero comisiones por pasarela digital.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="feature-card">
          <span class="material-symbols-rounded" style="font-size: 28px; color: var(--primary);">barcode_scanner</span>
          <h4 style="font-size: 0.9rem; font-weight: bold; color: white; margin-top: 4px;">Scan & Go Físico</h4>
          <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
            Tus clientes escanean códigos de barra directamente desde el estante con su cámara, acumulando productos en su cesta y evitando cuellos de botella en la caja.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="feature-card">
          <span class="material-symbols-rounded" style="font-size: 28px; color: #a855f7;">auto_awesome</span>
          <h4 style="font-size: 0.9rem; font-weight: bold; color: white; margin-top: 4px;">Retratos IA Mágicos</h4>
          <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
            Fusión avanzada de fotos que junta al tutor y a la mascota en hermosas pinturas generativas, incentivando la interacción diaria comunitaria.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="feature-card">
          <span class="material-symbols-rounded" style="font-size: 28px; color: var(--accent);">troubleshoot</span>
          <h4 style="font-size: 0.9rem; font-weight: bold; color: white; margin-top: 4px;">Fricción de Góndola</h4>
          <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
            Captura el feedback de abandono de tus clientes al escanear stock. Herramienta de oro corporativa para negociar precios y tallas con tus proveedores B2B.
          </p>
        </div>
      </div>
    </div>

    <!-- Whitelabel Demo Selector -->
    <div class="demo-link-card">
      <h3 style="margin-top: 0; font-size: 1.1rem; color: white; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <span class="material-symbols-rounded" style="color: var(--secondary);">devices</span>
        Simulador de PWA Cliente (Marca Blanca)
      </h3>
      <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto;">
        Revisa la PWA desde la perspectiva del tutor final. La app cambiará dinámicamente sus colores, logotipos y sucursales en caliente:
      </p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
        <button id="lnk-demo-superzoo" class="btn btn-secondary" style="width: auto; padding: 10px 20px; font-size: 0.8rem; border-color: rgba(234, 88, 12, 0.3); color: #ea580c; background-color: rgba(234, 88, 12, 0.02);">
          🧡 Demo SuperZoo PWA ➔
        </button>
        <button id="lnk-demo-petcity" class="btn btn-secondary" style="width: auto; padding: 10px 20px; font-size: 0.8rem; border-color: rgba(244, 63, 94, 0.3); color: #f43f5e; background-color: rgba(244, 63, 94, 0.02);">
          🏙️ Demo PetCity PWA ➔
        </button>
      </div>
    </div>
  `;
  container.appendChild(content);

  // Add event listeners
  document.getElementById('lnk-demo-superzoo').addEventListener('click', () => {
    history.pushState({}, '', '/superzoo');
    window.location.reload();
  });

  document.getElementById('lnk-demo-petcity').addEventListener('click', () => {
    history.pushState({}, '', '/petcity');
    window.location.reload();
  });

  document.getElementById('btn-landing-admin').addEventListener('click', () => openAdminLoginModal());
  document.getElementById('btn-top-admin').addEventListener('click', () => openAdminLoginModal());
  
  // ADMIN ACCESS MODAL
  function openAdminLoginModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '5000';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 350px; background: #111827; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.15rem; color: white; display: flex; align-items: center; gap: 8px;"><span class="material-symbols-rounded" style="color: var(--primary);">admin_panel_settings</span> Acceso Socio</h2>
          <button id="btn-close-login" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div class="input-group" style="margin-bottom: 12px;">
          <label class="input-label" for="login-tenant-select">Selecciona Inquilino (SaaS):</label>
          <select id="login-tenant-select" class="input-field select-field" style="background-color: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.08);">
            <option value="superzoo">SuperZoo (Consola)</option>
            <option value="petcity">PetCity (Consola)</option>
            <option value="default">PetOne Default (Consola)</option>
          </select>
        </div>

        <div class="input-group" style="margin-bottom: 1.5rem;">
          <label class="input-label" for="login-passcode">Contraseña Corporativa:</label>
          <input type="password" id="login-passcode" class="input-field" placeholder="Clave demo: admin123" style="background-color: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.08);">
        </div>

        <button id="btn-confirm-login" class="btn btn-primary" style="padding: 12px; font-weight: bold;">
          Validar e Ingresar a Consola
        </button>
      </div>
    `;

    document.getElementById('btn-close-login').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-confirm-login').addEventListener('click', () => {
      const passcode = document.getElementById('login-passcode').value;
      const selectedTenant = document.getElementById('login-tenant-select').value;
      
      if (passcode === 'admin123') {
        overlay.remove();
        history.pushState({}, '', `/${selectedTenant}`);
        
        const styleTag = document.getElementById('landing-styles');
        if (styleTag) styleTag.remove();
        
        navigateTo('admin-portal');
      } else {
        alert('Contraseña incorrecta. Pista: admin123');
      }
    });
  }
}
