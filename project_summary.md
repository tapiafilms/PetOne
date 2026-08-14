# Memoria del Proyecto: PWA Cumpland (Coordinador de Cumpleaños)

Este documento sirve como registro y memoria técnica del proyecto para continuar el desarrollo directamente desde este estado.

---

## 1. Contexto General y Propósito
**Cumpland** es una PWA (Progressive Web App) para coordinar cumpleaños infantiles con enfoque en **seguridad, privacidad y simplicidad**.
*   **Fricción Cero:** Los invitados acceden mediante enlaces/tokens únicos sin crear cuentas de usuario tradicionales.
*   **Características Clave:**
    *   **Auto-Registro (RSVP):** Confirmar/declinar, declarar alergias críticas y personas autorizadas a retiro.
    *   **Check-Out de Puerta Seguro:** El anfitrión marca la salida de un menor y se envía una notificación push inmediata al padre.
    *   **Onboarding PC a Móvil (QR):** Código QR generado al crear el evento para escanear y transferir la sesión de administración al teléfono celular de forma instantánea.
    *   **Itinerario en Tiempo Real:** Timeline interactivo y banner consolidado de alergias en el panel admin.
    *   **Álbum Compartido:** Galería de fotos (Supabase Storage).
    *   **Directorio de Proveedores:** Curado, con contacto directo wa.me prellenado.

---

## 2. Estado de la Implementación (Código Listo)

El proyecto está estructurado con **React 18 + Vite + Tailwind CSS v4 + Supabase + Vercel**. Todo compila con éxito mediante `pnpm run build`.

### Componentes y Páginas Construidas:
1.  **Enrutador SPA ([App.jsx](file:///Users/pablo/Public/Genofy/CumpLand/src/App.jsx)):** Cambia de página detectando la query URL:
    *   `/` (sin parámetros) $\rightarrow$ `LandingPage`.
    *   `?e={id}&t={host_token}` $\rightarrow$ `HostAdmin` (Panel de control del anfitrión).
    *   `?e={id}&t={guest_token}` $\rightarrow$ `RsvpPage` (Auto-registro de invitados).
    *   `?e={id}&t={personal_token}` $\rightarrow$ `EventBoard` (Tablero del invitado).
2.  **Base de Datos ([supabase/schema.sql](file:///Users/pablo/Public/Genofy/CumpLand/supabase/schema.sql)):** Tablas PostgreSQL relacionales (`events`, `guests`, `providers`). Políticas RLS robustas basadas en cabeceras HTTP custom (`x-event-token`, `x-guest-token`).
3.  **Cliente Dinámico ([supabaseClient.js](file:///Users/pablo/Public/Genofy/CumpLand/src/lib/supabaseClient.js)):** Genera instancias con headers específicos para evadir RLS de forma segura en las consultas.
4.  **Hook Realtime ([useEventData.js](file:///Users/pablo/Public/Genofy/CumpLand/src/hooks/useEventData.js)):** Escucha en tiempo real cambios de Firestore/Supabase.
5.  **PWA e Instalador ([InstallPrompt.jsx](file:///Users/pablo/Public/Genofy/CumpLand/src/components/InstallPrompt.jsx) y [service-worker.js](file:///Users/pablo/Public/Genofy/CumpLand/src/sw/service-worker.js)):** Soporta cache local y receptor de Web Push.
6.  **Serverless Web Push ([api/send-push.js](file:///Users/pablo/Public/Genofy/CumpLand/api/send-push.js)):** Endpoint en Node.js que procesa y firma las notificaciones push usando la librería `web-push` y llaves VAPID.
7.  **Galería ([PhotoGallery.jsx](file:///Users/pablo/Public/Genofy/CumpLand/src/components/PhotoGallery.jsx)):** Subida y visualización de fotos con fallback offline.

---

## 3. Modo Demo Local (Offline Fallback)
Si las llaves reales de Supabase no están en el archivo **[.env](file:///Users/pablo/Public/Genofy/CumpLand/.env)**, la aplicación se autoconfigura en **LOCAL DEMO MODE**:
*   Guarda los cumpleaños e invitados en el `localStorage` del navegador.
*   **Sincronización en Tiempo Real Offline:** Escucha cambios del evento `storage` de JavaScript. Si tienes el Panel Admin en una ventana y el Tablero del Invitado en otra, los cambios (como marcar salida o actualizar autorizados) se sincronizan instantáneamente en ambas pestañas sin servidor.

---

## 4. Llaves Web Push Generadas (VAPID Keys)
Claves de par de llaves generadas para el envío de notificaciones push:
*   **Public Key (VAPID):** `BA3A-HmXHY4Px8spax4x9Pj80mn-7JMgyWZztxbKuG0uC6IMoW_a3FEsP3h0N4lBf_ZgpbtyZDM362NWCM-naXE`
*   **Private Key (VAPID):** `xEhr_5Ex9mvi2gLdYEyxcs9dYEt5jO7CyORbFxKz-dk`

*Nota: La Public Key ya está guardada en tu archivo `.env` local.*

---

## 5. Tareas Pendientes para Mañana
1.  **Crear el proyecto real en Supabase** y pegar la URL y la Anon Key en el archivo **[.env](file:///Users/pablo/Public/Genofy/CumpLand/.env)**.
2.  **Correr el script SQL** de **[schema.sql](file:///Users/pablo/Public/Genofy/CumpLand/supabase/schema.sql)** en el editor de Supabase.
3.  **Configurar Variables de Entorno en Vercel** para el despliegue de las API Routes (incluyendo las VAPID Keys y la `SUPABASE_SERVICE_ROLE_KEY`).
