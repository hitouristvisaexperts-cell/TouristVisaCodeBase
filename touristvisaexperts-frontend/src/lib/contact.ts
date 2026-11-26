// Single source of truth for public contact details & social links.
// Update the values here and every page (footer, contact section, WhatsApp buttons) picks them up.

export const CONTACT = {
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  whatsappNumber: '919876543210', // country code + number, digits only
  email: 'hello@touristvisaexperts.com',
  address: '5-894, Netaji Subhash Chandra Bose Street, Santapeta, Chittoor, Andhra Pradesh 517004',
}

export const SOCIAL = {
  instagram: 'https://www.instagram.com/touristvisaexperts',
  facebook: 'https://www.facebook.com/touristvisaexperts3',
  x: 'https://x.com/touristvisaexp',
  linkedin: 'https://www.linkedin.com/company/touristvisaexperts',
}

const DEFAULT_WA_MESSAGE = "Hi Tourist Visa Experts, I'd like help with my visa application."

export const whatsappUrl = (message: string = DEFAULT_WA_MESSAGE) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`

/** Opens the WhatsApp chat directly (app on mobile, WhatsApp Web on desktop). */
export const openWhatsApp = (message?: string) => {
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
}
