/**
 * Genera un enlace wa.me para enviar un mensaje directo de WhatsApp.
 * @param {string} phone - Teléfono con formato (ej: +56 9 1234 5678)
 * @param {string} text - Mensaje de texto a pre-llenar
 */
export function generateWhatsAppLink(phone, text) {
  if (!phone) return ''
  
  // Limpiar el teléfono para dejar solo números (manteniendo el código de país opcionalmente si es necesario)
  // Pero wa.me requiere código de país sin el signo '+' ni espacios
  const cleanPhone = phone.replace(/[^\d]/g, '')
  
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}
