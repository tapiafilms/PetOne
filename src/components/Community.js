// Community Component for educational guides and content with cross-selling linkages
import { PRODUCTS } from '../data/mockData.js';
import { getProfile, saveProfile, addPurchase } from '../utils/db.js';
import { showToast, navigateTo } from '../main.js';

export async function renderCommunity(container) {
  const profile = await getProfile();

  const GUIDES = [
    {
      id: 'guide-1',
      title: 'Higiene de Mascotas con Piel Sensible',
      readTime: '3 min lectura',
      desc: 'El baño y el cuidado del pelaje son fundamentales en mascotas propensas a dermatitis. Los champús con extractos naturales como avena y coco calman la picazón y previenen infecciones.',
      relatedProductId: 'prod-5' // Oster Champú Avena y Coco
    },
    {
      id: 'guide-2',
      title: 'Cómo prevenir el sarro en perros medianos y grandes',
      readTime: '4 min lectura',
      desc: 'El sarro dental no solo causa mal aliento, sino que puede migrar a infecciones renales graves. Juguetes interactivos fabricados con caucho natural grueso ejercen una fricción mecánica óptima que limpia la dentadura mientras juegan.',
      relatedProductId: 'prod-8' // Kong Classic Juguete
    },
    {
      id: 'guide-3',
      title: 'Nutrición Hipoalergénica: ¿Cuándo cambiar el alimento?',
      readTime: '5 min lectura',
      desc: 'Si tu perro o gato presenta rasquidos frecuentes, pelaje opaco u diarreas blandas recurrentes, podría estar desarrollando alergia alimentaria. Las dietas con fuentes alternativas de proteínas y ácidos grasos ayudan notablemente.',
      relatedProductId: 'prod-2' // Pro Plan OptiDerma
    }
  ];

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <button id="btn-back-to-dash-com" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Guías y Comunidad</h2>
      </div>
      <p style="font-size: 0.8rem; margin-left: 40px;">Consejos de expertos para mejorar el bienestar de tus mascotas.</p>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-com').addEventListener('click', () => navigateTo('dashboard'));

    // Guides Feed
    const feed = document.createElement('div');
    feed.style.display = 'flex';
    feed.style.flexDirection = 'column';
    feed.style.gap = '14px';
    container.appendChild(feed);

    feed.innerHTML = GUIDES.map(guide => {
      const prod = PRODUCTS.find(p => p.id === guide.relatedProductId);
      return `
        <div class="card" style="margin-bottom: 0; padding: 14px; background-color: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="pill" style="font-size: 0.65rem; padding: 2px 6px;">${guide.readTime}</span>
            <span style="font-size: 0.65rem; color: var(--primary); font-weight: bold; text-transform: uppercase;">Consejo PetOne</span>
          </div>
          <h3 style="font-size: 1.05rem; margin-bottom: 8px; color: var(--text-primary); font-weight: 700;">${guide.title}</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">${guide.desc}</p>
          
          <!-- Cross-selling related product integration -->
          ${prod ? `
            <div style="background-color: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; gap: 8px; align-items: center; max-width: 70%;">
                <span class="material-symbols-rounded" style="color: var(--secondary); font-size: 20px;">shopping_bag</span>
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem;">
                  <strong style="color: var(--text-primary);">${prod.brand}</strong> - ${prod.name}
                </div>
              </div>
              <button class="btn btn-primary btn-buy-guide" data-id="${prod.id}" style="width: auto; padding: 4px 10px; font-size: 0.7rem;">
                Comprar $${prod.price.toLocaleString('es-CL')}
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach buy listeners
    feed.querySelectorAll('.btn-buy-guide').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prod = PRODUCTS.find(p => p.id === btn.dataset.id);
        if (prod) {
          await simulatePurchase(prod);
        }
      });
    });
  }

  async function simulatePurchase(product) {
    const purchase = {
      id: `purch-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      total: product.price,
      items: [
        { brand: product.brand, name: product.name, price: product.price }
      ],
      type: 'E-Commerce (Vínculo de Comunidad)'
    };

    await addPurchase(purchase);

    // Update points
    profile.points = (profile.points || 0) + Math.round(product.price * 0.05);
    await saveProfile(profile);

    showToast(`¡Compraste ${product.brand} con éxito! Puntos acumulados.`);
    navigateTo('dashboard');
  }

  // Initial load
  render();
}
