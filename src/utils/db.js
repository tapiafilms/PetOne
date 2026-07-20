// IndexedDB Local Database Wrapper for PetOne PWA - Version 3 (with Supabase sync)
import { supabase } from './supabaseClient.js';

const DB_NAME = 'petone_db';
const DB_VERSION = 4;

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Version 1 stores
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pets')) {
          db.createObjectStore('pets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('purchases')) {
          db.createObjectStore('purchases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlineTickets')) {
          db.createObjectStore('offlineTickets', { keyPath: 'id' });
        }
      }
      
      // Version 2 stores
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('healthLogs')) {
          db.createObjectStore('healthLogs', { keyPath: 'id' });
        }
      }

      // Version 3 stores
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('scanLogs')) {
          db.createObjectStore('scanLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('retailMedia')) {
          db.createObjectStore('retailMedia', { keyPath: 'id' });
        }
      }

      // Version 4 stores
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains('aiPhotos')) {
          db.createObjectStore('aiPhotos', { keyPath: 'id' });
        }
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB Error:', event.target.error);
      reject(event.target.error);
    };
  });
  
  return dbPromise;
}

// Global cloud synchronization wrapper
async function syncToCloud(tableName, record) {
  if (!supabase || !navigator.onLine) return;
  
  try {
    console.log(`[Supabase Sync] Sincronizando registro en tabla '${tableName}'...`);
    const { error } = await supabase.from(tableName).upsert(record);
    if (error) {
      console.error(`[Supabase Error] Fallo al subir datos a '${tableName}':`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Offline] Error de red. Queda guardado localmente:`, err);
  }
}

// PROFILE OPERATIONS
export async function getProfile() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('profile', 'readonly');
    const store = transaction.objectStore('profile');
    const request = store.get('user');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function saveProfile(profileData) {
  const db = await getDB();
  const record = { id: 'user', ...profileData };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('profile', 'readwrite');
    const store = transaction.objectStore('profile');
    const request = store.put(record);
    request.onsuccess = () => {
      syncToCloud('profiles', record);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// PETS OPERATIONS
export async function getPets() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('pets', 'readonly');
    const store = transaction.objectStore('pets');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function addPet(pet) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readwrite');
    const store = transaction.objectStore('pets');
    const request = store.put(pet);
    request.onsuccess = () => {
      syncToCloud('pets', pet);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deletePet(petId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readwrite');
    const store = transaction.objectStore('pets');
    const request = store.delete(petId);
    request.onsuccess = async () => {
      if (supabase && navigator.onLine) {
        await supabase.from('pets').delete().eq('id', petId);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// PURCHASES OPERATIONS
export async function getPurchases() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('purchases', 'readonly');
    const store = transaction.objectStore('purchases');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      resolve(results);
    };
    request.onerror = () => resolve([]);
  });
}

export async function addPurchase(purchase) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('purchases', 'readwrite');
    const store = transaction.objectStore('purchases');
    const request = store.put(purchase);
    request.onsuccess = () => {
      syncToCloud('purchases', purchase);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// OFFLINE TICKETS OPERATIONS
export async function getOfflineTickets() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('offlineTickets', 'readonly');
    const store = transaction.objectStore('offlineTickets');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function addOfflineTicket(ticket) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineTickets', 'readwrite');
    const store = transaction.objectStore('offlineTickets');
    const request = store.put(ticket);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineTickets() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineTickets', 'readwrite');
    const store = transaction.objectStore('offlineTickets');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// SUBSCRIPTIONS
export async function getSubscriptions() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('subscriptions', 'readonly');
    const store = transaction.objectStore('subscriptions');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function addSubscription(sub) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptions', 'readwrite');
    const store = transaction.objectStore('subscriptions');
    const request = store.put(sub);
    request.onsuccess = () => {
      // Map to Supabase matching columns naming
      const mappedRecord = {
        id: sub.id,
        product_id: sub.productId,
        brand: sub.brand,
        name: sub.name,
        price: sub.price,
        frequency: sub.frequency,
        next_delivery_date: sub.nextDeliveryDate,
        status: sub.status
      };
      syncToCloud('subscriptions', mappedRecord);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSubscription(subId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptions', 'readwrite');
    const store = transaction.objectStore('subscriptions');
    const request = store.delete(subId);
    request.onsuccess = async () => {
      if (supabase && navigator.onLine) {
        await supabase.from('subscriptions').delete().eq('id', subId);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// APPOINTMENTS (SERVICES)
export async function getAppointments() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('appointments', 'readonly');
    const store = transaction.objectStore('appointments');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
      resolve(results);
    };
    request.onerror = () => resolve([]);
  });
}

export async function addAppointment(appt) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('appointments', 'readwrite');
    const store = transaction.objectStore('appointments');
    const request = store.put(appt);
    request.onsuccess = () => {
      const mappedRecord = {
        id: appt.id,
        pet_id: appt.petId,
        service_id: appt.serviceId,
        store_id: appt.storeId,
        staff_id: appt.staffId,
        date: appt.date,
        time: appt.time,
        diagnosis: appt.diagnosis,
        diagnosis_staff: appt.diagnosisStaff
      };
      syncToCloud('appointments', mappedRecord);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// HEALTH LOGS
export async function getHealthLogs(petId) {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('healthLogs', 'readonly');
    const store = transaction.objectStore('healthLogs');
    const request = store.getAll();
    request.onsuccess = () => {
      const allLogs = request.result || [];
      const petLogs = allLogs.filter(log => log.petId === petId);
      petLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
      resolve(petLogs);
    };
    request.onerror = () => resolve([]);
  });
}

export async function addHealthLog(log) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('healthLogs', 'readwrite');
    const store = transaction.objectStore('healthLogs');
    const request = store.put(log);
    request.onsuccess = () => {
      // Note healthLogs is not mapped to Supabase in sql for MVP size but synced if table created.
      // We can sync to a 'health_logs' table if desired. Let's keep it local or optionally try to sync.
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// SCAN LOGS
export async function getScanLogs() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('scanLogs', 'readonly');
    const store = transaction.objectStore('scanLogs');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function addScanLog(log) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('scanLogs', 'readwrite');
    const store = transaction.objectStore('scanLogs');
    const request = store.put(log);
    request.onsuccess = () => {
      const mappedRecord = {
        id: log.id,
        product_id: log.productId,
        brand: log.brand,
        name: log.name,
        timestamp: log.timestamp,
        purchased: log.purchased,
        abandon_reason: log.abandonReason
      };
      syncToCloud('scan_logs', mappedRecord);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// RETAIL MEDIA PERFORMANCE LOGS
export async function getRetailMediaPerformance() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('retailMedia', 'readonly');
    const store = transaction.objectStore('retailMedia');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function saveRetailMediaPerformance(mediaLog) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('retailMedia', 'readwrite');
    const store = transaction.objectStore('retailMedia');
    const request = store.put(mediaLog);
    request.onsuccess = () => {
      const mappedRecord = {
        id: mediaLog.id,
        sponsor: mediaLog.sponsor,
        impressions: mediaLog.impressions,
        clicks: mediaLog.clicks
      };
      syncToCloud('retail_media_logs', mappedRecord);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// AI PHOTOS OPERATIONS
export async function getAiPhotos() {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('aiPhotos', 'readonly');
    const store = transaction.objectStore('aiPhotos');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => resolve([]);
  });
}

export async function addAiPhoto(photo) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('aiPhotos', 'readwrite');
    const store = transaction.objectStore('aiPhotos');
    const request = store.put(photo);
    request.onsuccess = () => {
      const mappedRecord = {
        id: photo.id,
        pet_id: photo.petId,
        image_url: photo.imageUrl
      };
      syncToCloud('ai_photos', mappedRecord);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAiPhoto(photoId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('aiPhotos', 'readwrite');
    const store = transaction.objectStore('aiPhotos');
    const request = store.delete(photoId);
    request.onsuccess = async () => {
      if (supabase && navigator.onLine) {
        await supabase.from('ai_photos').delete().eq('id', photoId);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
