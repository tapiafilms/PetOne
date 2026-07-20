import './css/index.css';
import { getProfile, getOfflineTickets, clearOfflineTickets, addPurchase } from './utils/db.js';
import { renderOnboarding } from './components/Onboarding.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderCatalog } from './components/Catalog.js';
import { renderStoreLocator } from './components/StoreLocator.js';
import { renderServices } from './components/Services.js';
import { renderSubscriptions } from './components/Subscriptions.js';
import { renderHealthTracker } from './components/HealthTracker.js';
import { renderAIAssistant } from './components/AIAssistant.js';
import { renderAnalytics } from './components/Analytics.js';
import { renderCommunity } from './components/Community.js';
import { renderProfile } from './components/Profile.js';
import { renderFotoJuntos } from './components/FotoJuntos.js';

// Global State
window.appState = {
  currentView: 'dashboard', // dashboard, catalog, services, stores, subscriptions, health, ai, analytics, community
  isOnline: navigator.onLine
};

// Toast notification helper
export function showToast(message, duration = 4000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-rounded">check_circle</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideDownToast 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Router function to load different screens
export async function navigateTo(view, extraData = null) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  window.appState.currentView = view;
  
  // Highlight active bottom nav item (only for main shell views)
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.dataset.view === view) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  const viewBody = document.getElementById('view-body');
  if (!viewBody) return;
  
  viewBody.innerHTML = '';
  
  const pageContainer = document.createElement('div');
  pageContainer.className = 'page';
  viewBody.appendChild(pageContainer);
  
  if (view === 'dashboard') {
    await renderDashboard(pageContainer);
  } else if (view === 'catalog') {
    await renderCatalog(pageContainer);
  } else if (view === 'services') {
    await renderServices(pageContainer);
  } else if (view === 'stores') {
    await renderStoreLocator(pageContainer);
  } else if (view === 'subscriptions') {
    await renderSubscriptions(pageContainer);
  } else if (view === 'health') {
    await renderHealthTracker(pageContainer, extraData);
  } else if (view === 'ai') {
    await renderAIAssistant(pageContainer);
  } else if (view === 'analytics') {
    await renderAnalytics(pageContainer);
  } else if (view === 'community') {
    await renderCommunity(pageContainer);
  } else if (view === 'profile') {
    await renderProfile(pageContainer);
  } else if (view === 'juntos') {
    await renderFotoJuntos(pageContainer);
  }
}

// Render the application shell
function renderAppShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- Top Header Bar -->
    <header class="header-bar" style="border-bottom: 1px solid var(--border-color); background: rgba(17, 24, 39, 0.4); padding-bottom: 12px; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 32px; font-weight: bold;">pets</span>
        <h1 style="margin: 0; font-size: 1.5rem; letter-spacing: -0.5px;">PetOne</h1>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button id="btn-header-community" class="btn btn-secondary btn-icon" title="Guías de Cuidado" style="width: 32px; height: 32px; background: none; border: none;">
          <span class="material-symbols-rounded" style="font-size: 22px; color: var(--text-secondary);">menu_book</span>
        </button>
        <button id="btn-header-analytics" class="btn btn-secondary btn-icon" title="Consola de Analíticas" style="width: 32px; height: 32px; background: none; border: none;">
          <span class="material-symbols-rounded" style="font-size: 22px; color: var(--text-secondary);">bar_chart</span>
        </button>
        <button id="btn-header-profile" class="btn btn-secondary btn-icon" title="Mi Cuenta" style="width: 32px; height: 32px; background: none; border: none;">
          <span class="material-symbols-rounded" style="font-size: 22px; color: var(--text-secondary);">account_circle</span>
        </button>
        <div id="network-status" style="display: flex; align-items: center;"></div>
      </div>
    </header>

    <!-- Main Dynamic Content Container -->
    <main id="view-body" style="flex: 1; display: flex; flex-direction: column; overflow-y: auto;"></main>

    <!-- Bottom Navigation Bar (4 Items in Phase 2/3) -->
    <nav class="bottom-nav">
      <div class="nav-item active" data-view="dashboard">
        <span class="material-symbols-rounded">home</span>
        <span>Inicio</span>
      </div>
      <div class="nav-item" data-view="catalog">
        <span class="material-symbols-rounded">shopping_bag</span>
        <span>Catálogo</span>
      </div>
      <div class="nav-item" data-view="services">
        <span class="material-symbols-rounded">content_cut</span>
        <span>Servicios</span>
      </div>
      <div class="nav-item" data-view="stores">
        <span class="material-symbols-rounded">store</span>
        <span>Tiendas</span>
      </div>
    </nav>
  `;

  // Attach nav event listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.view);
    });
  });

  // Attach header action listeners
  document.getElementById('btn-header-community').addEventListener('click', () => {
    navigateTo('community');
  });

  document.getElementById('btn-header-analytics').addEventListener('click', () => {
    navigateTo('analytics');
  });

  document.getElementById('btn-header-profile').addEventListener('click', () => {
    navigateTo('profile');
  });

  updateNetworkUI();
}

// Update Network Status Badge
function updateNetworkUI() {
  const container = document.getElementById('network-status');
  if (!container) return;
  
  if (window.appState.isOnline) {
    container.innerHTML = '';
  } else {
    container.innerHTML = `
      <span class="offline-badge" style="margin-left: 0;">
        <span class="material-symbols-rounded" style="font-size: 14px;">cloud_off</span>
        Offline
      </span>
    `;
  }
}

// Sincronizar boletas offline guardadas localmente
async function syncOfflineTickets() {
  if (!window.appState.isOnline) return;
  
  const tickets = await getOfflineTickets();
  if (tickets.length === 0) return;
  
  console.log(`[App] Sincronizando ${tickets.length} boleta(s) pendientes de subir...`);
  
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-tickets');
    } catch (err) {
      console.warn('Fallo registro SyncManager, sincronizando por API ordinaria:', err);
      await performDirectSync(tickets);
    }
  } else {
    await performDirectSync(tickets);
  }
}

async function performDirectSync(tickets) {
  for (const ticket of tickets) {
    await addPurchase({
      id: ticket.id,
      date: new Date().toISOString().split('T')[0],
      total: ticket.amount,
      items: [
        { brand: 'Compra en Sucursal', name: `Boleta #${ticket.ticketNumber}`, price: ticket.amount }
      ],
      type: 'Tienda Física (Escaneado)'
    });
  }
  
  await clearOfflineTickets();
  showToast('Boletas registradas sin conexión sincronizadas exitosamente.');
  
  if (window.appState.currentView === 'dashboard') {
    navigateTo('dashboard');
  }
}

// Network state listeners
window.addEventListener('online', () => {
  window.appState.isOnline = true;
  updateNetworkUI();
  syncOfflineTickets();
});

window.addEventListener('offline', () => {
  window.appState.isOnline = false;
  updateNetworkUI();
});

// App Initialization
async function init() {
  const profile = await getProfile();
  
  if (!profile) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    const pageContainer = document.createElement('div');
    pageContainer.className = 'page';
    app.appendChild(pageContainer);
    
    renderOnboarding(pageContainer);
  } else {
    renderAppShell();
    navigateTo('dashboard');
    syncOfflineTickets();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registrado con éxito: ', registration.scope);
      })
      .catch(err => {
        console.error('Fallo en el registro de ServiceWorker: ', err);
      });
  });

  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'SYNC_COMPLETE') {
      const tickets = await getOfflineTickets();
      await performDirectSync(tickets);
    }
  });
}

init();
