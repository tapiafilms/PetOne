// Services Component for booking veterinary/grooming services and simulating staff diagnosis reports
import { SERVICES, STAFF, STORES } from '../data/mockData.js';
import { getPets, addAppointment, getAppointments, addPet } from '../utils/db.js';
import { showToast, navigateTo } from '../main.js';

export async function renderServices(container) {
  const pets = await getPets();
  const appointments = await getAppointments();
  
  let selectedServiceType = 'peluqueria'; // peluqueria, veterinaria
  let isStaffMode = false;

  function render() {
    container.innerHTML = '';

    // Title / Switch Mode
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '1.25rem';
    topBar.innerHTML = `
      <h2 style="margin: 0;"><span class="material-symbols-rounded" style="color: var(--primary);">content_cut</span> Servicios en Tienda</h2>
      <button id="btn-toggle-staff" class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.75rem; border-color: ${isStaffMode ? 'var(--danger)' : 'var(--border-color)'}; color: ${isStaffMode ? 'var(--danger)' : 'var(--text-secondary)'};">
        ${isStaffMode ? 'Salir Modo Staff' : 'Modo Staff ⚙️'}
      </button>
    `;
    container.appendChild(topBar);

    document.getElementById('btn-toggle-staff').addEventListener('click', () => {
      isStaffMode = !isStaffMode;
      render();
    });

    if (isStaffMode) {
      renderStaffMode();
    } else {
      renderCustomerMode();
    }
  }

  // CUSTOMER VIEW
  function renderCustomerMode() {
    // 1. Navigation Tabs (Peluqueria / Veterinaria)
    const tabs = document.createElement('div');
    tabs.style.display = 'flex';
    tabs.style.gap = '10px';
    tabs.style.marginBottom = '1.25rem';
    tabs.innerHTML = `
      <button id="tab-grooming" class="btn ${selectedServiceType === 'peluqueria' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 0.5rem;">Peluquería</button>
      <button id="tab-vet" class="btn ${selectedServiceType === 'veterinaria' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 0.5rem;">Veterinaria</button>
    `;
    container.appendChild(tabs);

    document.getElementById('tab-grooming').addEventListener('click', () => {
      selectedServiceType = 'peluqueria';
      render();
    });
    document.getElementById('tab-vet').addEventListener('click', () => {
      selectedServiceType = 'veterinaria';
      render();
    });

    // 2. Booking Form Card
    const bookingCard = document.createElement('div');
    bookingCard.className = 'glass-card';
    bookingCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: var(--primary);">Reservar Nueva Cita</h3>
      
      <div class="input-group">
        <label class="input-label">Mascota</label>
        <select id="appt-pet" class="input-field select-field">
          ${pets.map(p => `<option value="${p.id}">${p.name} (${p.species === 'perro' ? 'Perro' : 'Gato'})</option>`).join('')}
        </select>
      </div>

      <div class="input-group">
        <label class="input-label">Servicio</label>
        <select id="appt-service" class="input-field select-field">
          ${SERVICES.filter(s => s.type === selectedServiceType).map(s => `<option value="${s.id}">${s.name} ($${s.price.toLocaleString('es-CL')})</option>`).join('')}
        </select>
      </div>

      <div class="input-group">
        <label class="input-label">Sucursal de Retiro</label>
        <select id="appt-store" class="input-field select-field">
          ${STORES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>

      <div class="input-group">
        <label class="input-label">Profesional</label>
        <select id="appt-staff" class="input-field select-field">
          ${STAFF.filter(s => selectedServiceType === 'veterinaria' ? s.specialty === 'Veterinaria' : s.specialty.includes('Estilista')).map(s => `<option value="${s.id}">${s.name} (★ ${s.rating})</option>`).join('')}
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-bottom: 1.5rem;">
        <div class="input-group" style="margin-bottom: 0;">
          <label class="input-label">Fecha</label>
          <input type="date" id="appt-date" class="input-field" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="input-group" style="margin-bottom: 0;">
          <label class="input-label">Hora</label>
          <select id="appt-time" class="input-field select-field">
            <option value="10:00">10:00 AM</option>
            <option value="11:30">11:30 AM</option>
            <option value="14:00">02:00 PM</option>
            <option value="15:30">03:30 PM</option>
            <option value="17:00">05:00 PM</option>
          </select>
        </div>
      </div>

      <button id="btn-confirm-appt" class="btn btn-primary">Agendar Cita en Tienda</button>
    `;
    container.appendChild(bookingCard);

    // 3. Appointments list
    const historyHeader = document.createElement('h2');
    historyHeader.style.marginTop = '1.5rem';
    historyHeader.innerHTML = `<span class="material-symbols-rounded" style="color: var(--secondary);">calendar_month</span> Citas Agendadas`;
    container.appendChild(historyHeader);

    const apptList = document.createElement('div');
    apptList.style.display = 'flex';
    apptList.style.flexDirection = 'column';
    apptList.style.gap = '10px';
    apptList.style.marginTop = '8px';
    container.appendChild(apptList);

    if (appointments.length === 0) {
      apptList.innerHTML = `<p style="font-style: italic; color: var(--text-muted); text-align: center; padding: 1rem 0;">Aún no tienes citas agendadas.</p>`;
    } else {
      apptList.innerHTML = appointments.map(appt => {
        const pet = pets.find(p => p.id === appt.petId);
        const srv = SERVICES.find(s => s.id === appt.serviceId);
        const store = STORES.find(s => s.id === appt.storeId);
        const prof = STAFF.find(s => s.id === appt.staffId);
        
        return `
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">${srv?.name || 'Servicio'}</strong>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                  Mascota: <strong>${pet?.name || 'Mascota'}</strong> | Profesional: ${prof?.name || 'Personal'}
                </p>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: var(--text-muted); margin-top: 6px;">
                  <span class="material-symbols-rounded" style="font-size: 14px;">location_on</span>
                  <span>${store?.name || 'Sucursal'}</span>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.8rem; font-weight: bold; color: var(--primary);">${appt.date}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${appt.time}</div>
              </div>
            </div>
            ${appt.diagnosis ? `
              <div style="background-color: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.15); padding: 8px; border-radius: 6px; margin-top: 10px; font-size: 0.75rem;">
                <strong style="color: var(--danger);">Notas/Diagnóstico del profesional:</strong>
                <div style="color: var(--text-primary); margin-top: 2px;">"${appt.diagnosis}"</div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    // Confirm Appointment click
    document.getElementById('btn-confirm-appt').addEventListener('click', async () => {
      const petId = document.getElementById('appt-pet').value;
      const serviceId = document.getElementById('appt-service').value;
      const storeId = document.getElementById('appt-store').value;
      const staffId = document.getElementById('appt-staff').value;
      const date = document.getElementById('appt-date').value;
      const time = document.getElementById('appt-time').value;

      if (!date) {
        alert('Por favor, selecciona una fecha válida.');
        return;
      }

      const newAppt = {
        id: `appt-${Date.now()}`,
        petId,
        serviceId,
        storeId,
        staffId,
        date,
        time,
        diagnosis: '', // initially empty
        diagnosisStaff: ''
      };

      await addAppointment(newAppt);
      showToast('¡Cita agendada exitosamente en la sucursal!');
      navigateTo('services');
    });
  }

  // STAFF VIEW (To simulate veterinary/grooming reports and product conversions)
  function renderStaffMode() {
    const staffPanel = document.createElement('div');
    staffPanel.className = 'glass-card';
    staffPanel.style.border = '1px solid var(--danger)';
    staffPanel.innerHTML = `
      <h3 style="color: var(--danger); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <span class="material-symbols-rounded">engineering</span>
        PetOne Staff - Panel de Control
      </h3>
      <p style="font-size: 0.8rem; margin-bottom: 1.25rem;">
        Utiliza esta consola interna para simular diagnósticos reales sobre las citas agendadas por el usuario. Esto disparará cupones de conversión inteligente en su Dashboard.
      </p>
    `;
    container.appendChild(staffPanel);

    const appointmentsContainer = document.createElement('div');
    appointmentsContainer.style.display = 'flex';
    appointmentsContainer.style.flexDirection = 'column';
    appointmentsContainer.style.gap = '12px';
    container.appendChild(appointmentsContainer);

    if (appointments.length === 0) {
      appointmentsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 1.5rem 1rem;">
          <p style="font-size: 0.8rem; font-style: italic; color: var(--text-muted);">
            No hay citas agendadas para atender. Registra una cita en el modo cliente primero.
          </p>
        </div>
      `;
      return;
    }

    appointmentsContainer.innerHTML = appointments.map((appt, idx) => {
      const pet = pets.find(p => p.id === appt.petId);
      const srv = SERVICES.find(s => s.id === appt.serviceId);
      const prof = STAFF.find(s => s.id === appt.staffId);
      
      return `
        <div class="card" style="margin-bottom: 0; padding: 12px; border-color: var(--danger);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <strong style="font-size: 0.9rem;">${srv?.name}</strong>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                Paciente: <strong>${pet?.name}</strong> (${pet?.breed})
              </p>
            </div>
            <div style="font-size: 0.75rem; text-align: right; color: var(--text-muted);">
              Cita #${idx + 1}
            </div>
          </div>
          
          <div class="input-group" style="margin-bottom: 10px;">
            <label class="input-label" style="font-size: 0.75rem; color: var(--text-primary);">Reportar Observación de Salud:</label>
            <select id="staff-diag-select-${appt.id}" class="input-field select-field" style="padding: 6px 10px; font-size: 0.8rem; height: auto;">
              <option value="">Seleccionar diagnóstico...</option>
              <option value="piel reseca y descamación" ${appt.diagnosis === 'piel reseca y descamación' ? 'selected' : ''}>Piel Reseca (Dispara Champú Avena)</option>
              <option value="acumulación de sarro dental" ${appt.diagnosis === 'acumulación de sarro dental' ? 'selected' : ''}>Sarro Dental (Dispara Juguete Kong)</option>
              <option value="presencia de pulgas leves" ${appt.diagnosis === 'presencia de pulgas leves' ? 'selected' : ''}>Pulgas Leves (Dispara Antiparasitario)</option>
            </select>
          </div>

          <button class="btn btn-primary btn-save-diagnosis" data-appt-id="${appt.id}" data-pet-id="${appt.petId}" data-staff-name="${prof?.name}" style="background-color: var(--danger); box-shadow: none; font-size: 0.75rem; padding: 6px 12px; width: auto; border-radius: 8px;">
            Guardar Observación
          </button>
        </div>
      `;
    }).join('');

    // Attach diagnostic handlers
    appointmentsContainer.querySelectorAll('.btn-save-diagnosis').forEach(btn => {
      btn.addEventListener('click', async () => {
        const apptId = btn.dataset.apptId;
        const petId = btn.dataset.petId;
        const staffName = btn.dataset.staffName;
        
        const diagSelect = document.getElementById(`staff-diag-select-${apptId}`);
        const diagnosisText = diagSelect.value;

        if (!diagnosisText) {
          alert('Por favor, selecciona un diagnóstico.');
          return;
        }

        // 1. Update the appointment with the diagnosis
        const targetAppt = appointments.find(a => a.id === apptId);
        if (targetAppt) {
          targetAppt.diagnosis = diagnosisText;
          targetAppt.diagnosisStaff = staffName;
          await addAppointment(targetAppt);
        }

        // 2. Update the Pet profile in local IndexedDB to trigger dashboard banner!
        const targetPet = pets.find(p => p.id === petId);
        if (targetPet) {
          targetPet.diagnosis = diagnosisText;
          targetPet.diagnosisStaff = staffName;
          await addPet(targetPet);
        }

        showToast('Diagnóstico registrado. La alerta y cupón se han activado en el Dashboard del cliente.');
        isStaffMode = false; // toggle back to client view
        navigateTo('dashboard');
      });
    });
  }

  // Initial load
  render();
}
