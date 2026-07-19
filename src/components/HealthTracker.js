// HealthTracker Component for tracking pet weight, displaying CSS weight charts, and recording digestive/coat health logs
import { getPets, addPet, addHealthLog, getHealthLogs } from '../utils/db.js';
import { showToast, navigateTo } from '../main.js';

export async function renderHealthTracker(container, petId) {
  const pets = await getPets();
  
  // Find current pet
  const activePet = pets.find(p => p.id === petId) || pets[0];
  if (!activePet) {
    container.innerHTML = `<p>Error: No se encontró la mascota seleccionada.</p>`;
    return;
  }

  let healthLogs = await getHealthLogs(activePet.id);
  
  // Seed initial mock weight logs if empty so that the chart renders beautifully initially!
  if (healthLogs.length === 0) {
    const seedLogs = [
      { id: 'log-1', petId: activePet.id, date: '2026-04-10', weight: activePet.weight - 1.5, note: 'Inicial' },
      { id: 'log-2', petId: activePet.id, date: '2026-05-12', weight: activePet.weight - 0.8, note: 'Control de vacunas' },
      { id: 'log-3', petId: activePet.id, date: '2026-06-15', weight: activePet.weight - 0.2, note: 'Peluquería' },
      { id: 'log-4', petId: activePet.id, date: new Date().toISOString().split('T')[0], weight: activePet.weight, note: 'Control actual' }
    ];
    for (const log of seedLogs) {
      await addHealthLog(log);
    }
    healthLogs = await getHealthLogs(activePet.id);
  }

  function render() {
    container.innerHTML = '';

    // Header navigation
    const header = document.createElement('div');
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <button id="btn-back-to-dash-health" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Diario de Salud</h2>
      </div>
      <p style="font-size: 0.8rem; margin-left: 40px;">Seguimiento médico, curva de peso y digestión para <strong>${activePet.name}</strong>.</p>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-health').addEventListener('click', () => navigateTo('dashboard'));

    // 1. Interactive Custom CSS Weight Chart
    renderChart();

    // 2. Add New Weight Form
    const weightForm = document.createElement('div');
    weightForm.className = 'glass-card';
    weightForm.style.marginBottom = '1.25rem';
    weightForm.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        <span class="material-symbols-rounded">monitor_weight</span> Registrar Nuevo Peso
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: flex-end;">
        <div class="input-group" style="margin-bottom: 0;">
          <label class="input-label">Peso (kg)</label>
          <input type="number" id="new-weight" class="input-field" step="0.1" min="0" placeholder="Ej. 18.5" value="${activePet.weight}">
        </div>
        <button id="btn-save-weight" class="btn btn-primary" style="height: 46px;">Guardar Peso</button>
      </div>
    `;
    container.appendChild(weightForm);

    document.getElementById('btn-save-weight').addEventListener('click', async () => {
      const weightVal = parseFloat(document.getElementById('new-weight').value);
      if (!weightVal || weightVal <= 0) {
        alert('Ingresa un peso válido.');
        return;
      }

      // Add log
      const newLog = {
        id: `log-${Date.now()}`,
        petId: activePet.id,
        date: new Date().toISOString().split('T')[0],
        weight: weightVal,
        note: 'Registro Manual'
      };

      await addHealthLog(newLog);

      // Update pet current weight
      activePet.weight = weightVal;
      await addPet(activePet);

      showToast('Registro de peso guardado correctamente.');
      renderHealthTracker(container, activePet.id);
    });

    // 3. Digestión y Pelaje Tracker Form (Voz del Cliente)
    const digestionCard = document.createElement('div');
    digestionCard.className = 'glass-card';
    digestionCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: var(--secondary); display: flex; align-items: center; gap: 6px;">
        <span class="material-symbols-rounded">spa</span> Evaluación Digestiva y Pelaje
      </h3>
      <p style="font-size: 0.8rem; margin-bottom: 1rem; color: var(--text-secondary);">
        Registra observaciones periódicas para ayudarnos a detectar alergias o sugerir un cambio de alimento adecuado.
      </p>

      <div class="input-group">
        <label class="input-label">Estado Digestivo (Calidad de Deposiciones)</label>
        <select id="health-digestion" class="input-field select-field">
          <option value="Excelente" ${activePet.digestionState === 'Excelente' ? 'selected' : ''}>Excelente (Firmes y normales)</option>
          <option value="Media" ${activePet.digestionState === 'Media' ? 'selected' : ''}>Media (A veces blandas)</option>
          <option value="Critica" ${activePet.digestionState === 'Critica' ? 'selected' : ''}>Sensible (Diarrhea o flatulencias recurrentes)</option>
        </select>
      </div>

      <div class="input-group" style="margin-bottom: 1.5rem;">
        <label class="input-label">Calidad de Pelaje</label>
        <select id="health-coat" class="input-field select-field">
          <option value="Brillante" ${activePet.coatState === 'Brillante' ? 'selected' : ''}>Brillante y abundante</option>
          <option value="Normal" ${activePet.coatState === 'Normal' ? 'selected' : ''}>Normal</option>
          <option value="Opaco" ${activePet.coatState === 'Opaco' ? 'selected' : ''}>Opaco o caída excesiva de pelo</option>
        </select>
      </div>

      <button id="btn-save-digestion" class="btn btn-primary" style="background: var(--secondary); box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
        Guardar Evaluación
      </button>
    `;
    container.appendChild(digestionCard);

    document.getElementById('btn-save-digestion').addEventListener('click', async () => {
      const digestion = document.getElementById('health-digestion').value;
      const coat = document.getElementById('health-coat').value;

      activePet.digestionState = digestion;
      activePet.coatState = coat;

      // If digestion is critical, automatically flag for sensitive skin/diet in allergies
      if (digestion === 'Critica') {
        activePet.allergies = 'Sensibilidad Digestiva (Detectada)';
      }

      await addPet(activePet);
      showToast('Evaluación nutricional registrada con éxito.');
      navigateTo('dashboard');
    });
  }

  // Draw Weight Chart with CSS Grid/Flexbox
  function renderChart() {
    const chartCard = document.createElement('div');
    chartCard.className = 'card';
    chartCard.style.padding = '1.25rem';
    chartCard.style.marginBottom = '1.25rem';
    container.appendChild(chartCard);

    chartCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Historial de Peso (Curva de Crecimiento)</h3>`;

    const weights = healthLogs.map(log => log.weight);
    const maxWeight = Math.max(...weights, 10);
    const minWeight = Math.min(...weights, 0);
    const range = maxWeight - minWeight || 1;

    const chartWrapper = document.createElement('div');
    chartWrapper.style.display = 'flex';
    chartWrapper.style.height = '140px';
    chartWrapper.style.alignItems = 'flex-end';
    chartWrapper.style.justifyContent = 'space-around';
    chartWrapper.style.padding = '10px 0 20px 0';
    chartWrapper.style.position = 'relative';
    chartWrapper.style.borderBottom = '1px solid var(--border-color)';
    chartCard.appendChild(chartWrapper);

    // Render bars
    healthLogs.forEach(log => {
      const heightPercent = Math.max(10, Math.min(100, ((log.weight - minWeight) / range) * 80 + 20));
      
      const barContainer = document.createElement('div');
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';
      barContainer.style.height = '100%';
      barContainer.style.justifyContent = 'flex-end';
      barContainer.style.width = '45px';
      
      barContainer.innerHTML = `
        <!-- Weight Tag hovering on bar -->
        <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">${log.weight}kg</span>
        
        <!-- Interactive Color Bar -->
        <div style="height: ${heightPercent}%; background: linear-gradient(to top, var(--primary) 0%, #818cf8 100%); width: 20px; border-radius: 6px 6px 0 0; box-shadow: 0 0 10px var(--primary-glow);"></div>
        
        <!-- Short Date Label -->
        <span style="font-size: 0.65rem; color: var(--text-muted); position: absolute; bottom: -18px; white-space: nowrap;">
          ${log.date.split('-').slice(1).join('/')}
        </span>
      `;
      chartWrapper.appendChild(barContainer);
    });
  }

  // Initial load
  render();
}
