// AIAssistant Component for simulated conversational AI chat with RAG products mapping
import { navigateTo } from '../main.js';

export function renderAIAssistant(container) {
  const conversation = [
    { sender: 'bot', text: '¡Hola! Soy el asistente virtual de PetOne. ¿En qué puedo ayudarte hoy con el cuidado de tus mascotas?' }
  ];

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '1rem';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="btn-back-to-dash-ai" class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; border-radius: 50%;">
          <span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span>
        </button>
        <h2 style="margin: 0;">Asistente de IA</h2>
      </div>
      <p style="font-size: 0.8rem; margin-left: 40px;">Preguntas sobre nutrición, accesorios y consejos de salud.</p>
    `;
    container.appendChild(header);

    document.getElementById('btn-back-to-dash-ai').addEventListener('click', () => navigateTo('dashboard'));

    // Chat Area Container
    const chatContainer = document.createElement('div');
    chatContainer.style.flex = '1';
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.border = '1px solid var(--border-color)';
    chatContainer.style.borderRadius = '16px';
    chatContainer.style.background = 'rgba(255, 255, 255, 0.01)';
    chatContainer.style.overflow = 'hidden';
    chatContainer.style.height = '350px';
    container.appendChild(chatContainer);

    // Messages Log
    const messagesLog = document.createElement('div');
    messagesLog.style.flex = '1';
    messagesLog.style.overflowY = 'auto';
    messagesLog.style.padding = '12px';
    messagesLog.style.display = 'flex';
    messagesLog.style.flexDirection = 'column';
    messagesLog.style.gap = '10px';
    chatContainer.appendChild(messagesLog);

    // Input message area
    const inputArea = document.createElement('div');
    inputArea.style.display = 'flex';
    inputArea.style.borderTop = '1px solid var(--border-color)';
    inputArea.style.padding = '8px';
    inputArea.style.backgroundColor = 'var(--bg-secondary)';
    inputArea.innerHTML = `
      <input type="text" id="ai-chat-input" class="input-field" placeholder="Escribe tu consulta aquí..." style="margin-bottom: 0; flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0;">
      <button id="ai-chat-send" class="btn btn-primary" style="width: auto; border-top-left-radius: 0; border-bottom-left-radius: 0; padding: 0 16px;">
        <span class="material-symbols-rounded">send</span>
      </button>
    `;
    chatContainer.appendChild(inputArea);

    function updateMessages() {
      messagesLog.innerHTML = conversation.map(msg => `
        <div style="display: flex; justify-content: ${msg.sender === 'user' ? 'flex-end' : 'flex-start'};">
          <div style="max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 0.85rem; line-height: 1.4; 
                      ${msg.sender === 'user' 
                        ? 'background-color: var(--primary); color: white; border-bottom-right-radius: 2px;' 
                        : 'background-color: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-bottom-left-radius: 2px;'
                      }">
            ${msg.text}
          </div>
        </div>
      `).join('');
      
      messagesLog.scrollTop = messagesLog.scrollHeight;

      // Handle interactive links generated in bot messages
      messagesLog.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetHref = link.getAttribute('href');
          
          if (targetHref.includes('prod-8')) {
            navigateTo('catalog'); // redirect to catalog
            showToast('Mostrando KONG Classic en el Catálogo de Juguetes.');
          } else if (targetHref.includes('prod-5')) {
            navigateTo('catalog');
            showToast('Mostrando Champú Oster en el Catálogo de Higiene.');
          } else if (targetHref.includes('alimentos')) {
            navigateTo('catalog');
          } else {
            navigateTo('services');
            showToast('Redirigiendo a agendamiento de Servicios.');
          }
        });
      });
    }

    updateMessages();

    // Send click / Enter keys
    const sendBtn = document.getElementById('ai-chat-send');
    const chatInput = document.getElementById('ai-chat-input');

    const handleSend = () => {
      const text = chatInput.value.trim();
      if (!text) return;

      conversation.push({ sender: 'user', text });
      chatInput.value = '';
      updateMessages();

      // Bot thinking time simulation
      setTimeout(() => {
        const botResponse = getMockBotResponse(text);
        conversation.push({ sender: 'bot', text: botResponse });
        updateMessages();
      }, 700);
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  function getMockBotResponse(query) {
    const text = query.toLowerCase();
    
    if (text.includes('sarro') || text.includes('dientes') || text.includes('dental')) {
      return `El cuidado dental en mascotas es vital para evitar problemas renales. Te recomiendo el **KONG Classic** (juguete de caucho súper duradero) que al morderlo ayuda a limpiar el sarro mecánicamente. Puedes conseguirlo en la sección Juguetes del <a href="#prod-8" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Catálogo PetOne</a>.`;
    }
    if (text.includes('piel') || text.includes('alergia') || text.includes('reseca') || text.includes('caspa')) {
      return `Para problemas de descamación o piel seca, es aconsejable usar un champú calmante natural. Te sugiero el **Champú Oster de Avena y Coco**. Puedes adquirirlo en el <a href="#prod-5" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Catálogo de Higiene</a>. Adicionalmente, evalúa un alimento hipoalergénico.`;
    }
    if (text.includes('comida') || text.includes('alimento') || text.includes('croquetas') || text.includes('pienso')) {
      return `Contamos con alimentos premium multimarca para perros y gatos (Royal Canin, Pro Plan, Acana). Puedes revisar todas las opciones, compararlas y suscribirte con 10% de descuento en el <a href="#alimentos" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Catálogo de Alimentos</a>.`;
    }
    if (text.includes('veterinario') || text.includes('vacuna') || text.includes('peluqueria') || text.includes('baño')) {
      return `Para atención profesional, te sugiero agendar una cita directamente. Ofrecemos baño, corte y atención veterinaria con excelentes especialistas en nuestra sección de <a href="#servicios" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Servicios en Sucursal</a>.`;
    }
    if (text.includes('hola') || text.includes('buenos dias') || text.includes('buenas tardes')) {
      return `¡Hola! Soy tu asistente PetOne. Estoy listo para ayudarte a elegir el mejor alimento, recordarte vacunas, o asesorarte en juguetes y accesorios para tu mascota. ¿De quién hablaremos hoy?`;
    }
    
    return `Interesante consulta. Para casos específicos de salud o cambios de dieta radicales, te sugiero agendar una **Consulta Veterinaria** en la sucursal más cercana. Puedes programarla ahora mismo desde la sección de <a href="#servicios" style="color: var(--primary); font-weight: bold; text-decoration: underline;">Servicios</a>.`;
  }

  // Initial load
  render();
}
