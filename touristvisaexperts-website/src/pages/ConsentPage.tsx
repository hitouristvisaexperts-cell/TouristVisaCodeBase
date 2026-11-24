import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

// TODO: replace with real Document Upload, AI & Chatbot Consent policy text once doc 05 is provided
const SECTIONS: LegalSection[] = [
  {
    title: 'Placeholder Notice',
    content: 'This page is a placeholder. The full Document Upload, AI & Chatbot Consent policy will be published here shortly. For questions in the meantime, please contact support@touristvisaexperts.com.',
  },
]

export default function ConsentPage() {
  return <LegalPageLayout title="Document Upload, AI & Chatbot Consent" sections={SECTIONS} />
}
