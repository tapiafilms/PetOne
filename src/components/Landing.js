import { navigateTo } from '../main.js';

export function renderLanding(container) {
  container.innerHTML = '';
  
  // Custom styles for Landing
  const styles = document.createElement('style');
  styles.id = 'landing-styles';
  styles.innerHTML = `
    .landing-hero {
      background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.15) 0%, transparent 60%);
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .landing-gradient-text {
      background: linear-gradient(135deg, #a855f7 0%, #4f46e5 50%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 800;
    }
    .landing-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 1.5rem;
    }
    @media(min-width: 600px) {
      .landing-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary-glow);
    }
    .demo-link-card {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
      border: 1px dashed var(--primary-glow);
      border-radius: 16px;
      padding: 20px;
      margin: 1.5rem;
      text-align: center;
    }
  `;
  document.head.appendChild(styles);

  // Layout structure
  const content = document.createElement('div');
  content.style.maxWidth = '800px';
  content.style.margin = '0 auto';
  content.style.paddingBottom = '3rem';
  content.innerHTML = `
    <!-- Hero Header -->
    <div class="landing-hero">
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 1.5rem;">
        <img src="/logo-petone.png" alt="PetOne" style="height: 38px; width: auto; filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.4));">
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; color: white;">PetOne <span style="font-weight: 300; color: #a855f7;">SaaS</span></h1>
      </div>
      <h2 style="font-size: 1.6rem; line-height: 1.25; margin-bottom: 1rem; color: #f8fafc;">
        La Plataforma <span class="landing-gradient-text">Marca Blanca</span> para tu Negocio de Mascotas
      </h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 540px; margin: 0 auto 2rem auto; line-height: 1.5;">
        Fideliza a tus clientes, vende sin filas con Click & Collect local, ofrece retratos interactivos con IA y accede a datos de comportamiento de compra en tienda física.
      </p>
      
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; max-width: 320px; margin: 0 auto;">
        <button id="btn-landing-admin" class="btn btn-primary" style="padding: 14px; font-weight: bold; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);">
          <span class="material-symbols-rounded" style="vertical-align: text-bottom; margin-right: 6px; font-size: 18px;">admin_panel_settings</span>
          Entrar a Consola Administrador
        </button>
        <div style="font-size: 0.7rem; color: var(--text-muted);">Accede al panel de control de tu tienda (Clave demo: <strong>admin123</strong>)</div>
      </div>
    </div>

    <!-- Whitelabel Demo Selector -->
    <div class="demo-link-card">
      <h3 style="margin-top: 0; font-size: 1.05rem; color: white; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <span class="material-symbols-rounded" style="color: var(--secondary);">devices</span>
        Simulador de PWA Cliente (Marca Blanca)
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        Revisa cómo se vería la PWA de cara al tutor final para cada una de las marcas licenciadas:
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <button id="lnk-demo-superzoo" class="btn btn-secondary" style="font-size: 0.75rem; padding: 10px;">
          🧡 Demo SuperZoo PWA ➔
        </button>
        <button id="lnk-demo-petcity" class="btn btn-secondary" style="font-size: 0.75rem; padding: 10px;">
          🏙️ Demo PetCity PWA ➔
        </button>
      </div>
    </div>

    <!-- Features Section -->
    <div style="padding: 0 1.5rem;">
      <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; text-align: center; color: white;">Características Principales</h3>
    </div>
    
    <div class="landing-grid">
      <!-- Feature 1 -->
      <div class="feature-card">
        <span class="material-symbols-rounded" style="font-size: 32px; color: var(--secondary);">storefront</span>
        <h4 style="font-size: 0.95rem; font-weight: bold; margin: 10px 0 6px 0; color: white;">Cesta de Retiro (Click & Collect)</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
          Tus clientes arman pedidos offline y retiran físicamente en tu sucursal. Ideal para tiendas locales que evitan pasarelas de pago y logística de delivery.
        </p>
      </div>

      <!-- Feature 2 -->
      <div class="feature-card">
        <span class="material-symbols-rounded" style="font-size: 32px; color: var(--primary);">barcode_scanner</span>
        <h4 style="font-size: 0.95rem; font-weight: bold; margin: 10px 0 6px 0; color: white;">Scan & Go de Góndola</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
          Permite a tus usuarios escanear productos físicos en la góndola con su cámara, sumarlos a la cesta y pagar rápidamente en la salida con su boucher digital.
        </p>
      </div>

      <!-- Feature 3 -->
      <div class="feature-card">
        <span class="material-symbols-rounded" style="font-size: 32px; color: #a855f7;">auto_awesome</span>
        <h4 style="font-size: 0.95rem; font-weight: bold; margin: 10px 0 6px 0; color: white;">Retrato IA "Foto Juntos"</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
          Herramienta viral que une las selfies de los tutores con las fotos de sus mascotas en paisajes divertidos para incentivar visitas recurrentes diarias a la PWA.
        </p>
      </div>

      <!-- Feature 4 -->
      <div class="feature-card">
        <span class="material-symbols-rounded" style="font-size: 32px; color: var(--accent);">troubleshoot</span>
        <h4 style="font-size: 0.95rem; font-weight: bold; margin: 10px 0 6px 0; color: white;">Fricciones de Góndola</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45; margin: 0;">
          Datos de oro consolidados en tiempo real. Entiende con precisión por qué tus clientes escaneas productos y deciden no llevarlos (precios, stock, reseñas).
        </p>
      </div>
    </div>
  `;
  container.appendChild(content);

  // Add event listeners
  document.getElementById('lnk-demo-superzoo').addEventListener('click', () => {
    // Modify URL path/query to simulate superzoo tenant
    history.pushState({}, '', '/superzoo');
    window.location.reload();
  });

  document.getElementById('lnk-demo-petcity').addEventListener('click', () => {
    history.pushState({}, '', '/petcity');
    window.location.reload();
  });

  document.getElementById('btn-landing-admin').addEventListener('click', () => openAdminLoginModal());
  
  // ADMIN ACCESS MODAL
  function openAdminLoginModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 340px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="margin: 0; font-size: 1.15rem; color: white;"><span class="material-symbols-rounded" style="color: var(--primary); vertical-align: text-bottom;">admin_panel_settings</span> Acceso Administrativo</h2>
          <button id="btn-close-login" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div class="input-group" style="margin-bottom: 12px;">
          <label class="input-label" for="login-tenant-select">Selecciona Tienda:</label>
          <select id="login-tenant-select" class="input-field select-field">
            <option value="superzoo">SuperZoo (Consola)</option>
            <option value="petcity">PetCity (Consola)</option>
            <option value="default">PetOne Default (Consola)</option>
          </select>
        </div>

        <div class="input-group" style="margin-bottom: 1.5rem;">
          <label class="input-label" for="login-passcode">Contraseña Corporativa:</label>
          <input type="password" id="login-passcode" class="input-field" placeholder="Ingresa clave...">
        </div>

        <button id="btn-confirm-login" class="btn btn-primary">
          Validar e Ingresar
        </button>
      </div>
    `;

    document.getElementById('btn-close-login').addEventListener('click', () => overlay.remove());

    document.getElementById('btn-confirm-login').addEventListener('click', () => {
      const passcode = document.getElementById('login-passcode').value;
      const selectedTenant = document.getElementById('login-tenant-select').value;
      
      if (passcode === 'admin123') {
        overlay.remove();
        // Redirect to admin portal and update path to match tenant
        history.pushState({}, '', `/${selectedTenant}`);
        
        // Remove style tag first to reload fresh tenant styling on route
        const styleTag = document.getElementById('landing-styles');
        if (styleTag) styleTag.remove();
        
        navigateTo('admin-portal');
      } else {
        alert('Contraseña incorrecta. Pista: admin123');
      }
    });
  }
}
