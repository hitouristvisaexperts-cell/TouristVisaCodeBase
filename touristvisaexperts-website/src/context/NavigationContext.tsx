import { createContext, useContext } from 'react'

export type CheckoutData = { visaCountry: string; fromCountry: string; travellers: number; rejectedTier?: 'standard' | 'guarantee' | null; previouslyRejected?: boolean | null }

export interface ArticleData {
  _id: string; title: string; tag: string; tagColor: string
  excerpt: string; imageUrl: string; date: string; readTime: string; content: string
}

type NavContextType = {
  navigateTo: (target: string) => void
  openVisaAssistance: () => void
  openConsultation: () => void
  openFlightReservation: () => void
  openCheckout: (visaCountry: string, fromCountry: string, travellers?: number, rejectedTier?: 'standard' | 'guarantee' | null, previouslyRejected?: boolean | null) => void
  openClientPortal: () => void
  openRejectedVisa: (prefill?: { country?: string; travellers?: number }) => void
  openCheckoutWithRejectedTier: (tier: 'standard' | 'guarantee') => void
  openVisaDetails: (to: string, toFlag: string) => void
  openAllDestinations: () => void
  openArticle: (article: ArticleData) => void
}

export const NavigationContext = createContext<NavContextType>({
  navigateTo: () => {},
  openVisaAssistance: () => {},
  openConsultation: () => {},
  openFlightReservation: () => {},
  openCheckout: () => {},
  openClientPortal: () => {},
  openRejectedVisa: () => {},
  openCheckoutWithRejectedTier: () => {},
  openVisaDetails: () => {},
  openAllDestinations: () => {},
  openArticle: () => {},
})

export const useNavigation = () => useContext(NavigationContext)
