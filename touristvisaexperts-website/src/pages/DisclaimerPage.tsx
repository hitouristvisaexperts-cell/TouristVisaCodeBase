import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

const SECTIONS: LegalSection[] = [
  {
    title: 'We are a consultancy — not an embassy',
    content: 'Tourist Visa Experts is a private visa assistance and consultancy service. We are not an embassy, consulate, visa application centre, or government authority, and we are not affiliated with any government. We cannot influence, expedite, guarantee, or predict the outcome of any visa application. All visa decisions rest solely with the relevant embassy, consulate, or immigration authority.',
  },
  {
    title: 'No guarantee of outcome',
    content: 'All services are provided on a best-efforts basis, based on our knowledge and experience of visa processes. Embassies may reject applications without reasons, request additional documents, delay processing, cancel appointments, or refuse entry at the border even after a visa is granted. We accept no liability for any such outcome.',
  },
  {
    title: 'Marketing content is not a promise',
    content: 'Success stories, testimonials, statistics, videos, reels, blogs, FAQs, and webinars describe past experiences and general information only. They are not a guarantee, approval rate, or prediction for any individual application. Previous approvals do not guarantee future approvals — every application is assessed independently by the relevant authority.',
  },
  {
    title: 'Rules change without notice',
    content: 'Visa rules, document and financial requirements, appointment systems, embassy and visa-centre fees, processing times, border rules, airline entry requirements, and immigration policies are set by governments and third parties and may change at any time without notice. We are not responsible for such changes or their consequences.',
  },
  {
    title: 'Information on this website',
    content: 'Content on this website — including guides, checklists, FAQs, and blog posts — is general information, not legal advice, and may become outdated as requirements change. It may also contain typographical, translation, or technical errors. Always confirm current requirements with the official embassy or visa centre. We are not a law firm and do not provide legal advice.',
  },
  {
    title: 'Chatbot and automated tools',
    content: 'Our website may include an automated chatbot and other AI-assisted tools. Their responses are generated automatically for convenience and may be inaccurate, incomplete, or outdated. Chatbot responses are not legal or visa advice, create no contractual obligation, cannot modify our Terms, and are not binding on us. Only written confirmation from our human team is authoritative.',
  },
  {
    title: 'Dummy flight reservations',
    content: 'A dummy flight reservation is a reservation document only — not a paid or confirmed ticket. Its validity, duration, and acceptance are entirely outside our control, and requirements differ by embassy. We accept no responsibility for the acceptance or consequences of any reservation document. Use of this service is at your own risk.',
  },
  {
    title: 'Third-party services',
    content: 'Any third party we recommend or refer — insurance providers, hotels, airlines, booking platforms, couriers, translators, cloud providers, or payment gateways — is independent of us. Your contract is with them. We are not responsible for their services, failures, cancellations, loss or damage of documents, refusals to refund, or any loss they cause you.',
  },
  {
    title: 'Estimated timelines',
    content: 'Any timeline, appointment availability, or processing estimate we share is indicative and based on current experience. It is not a commitment and may change without notice.',
  },
  {
    title: 'Limitation of liability',
    content: 'To the maximum extent permitted by law, our total liability for any claim is limited to the fees you actually paid us for the specific service concerned, as set out in our Terms & Conditions. Complaints must first be raised through our internal complaint process — email support@touristvisaexperts.com and hitouristvisaexperts@gmail.com, plus a call with our internal team — before any further action.',
  },
]

export default function DisclaimerPage() {
  return (
    <LegalPageLayout
      title="Disclaimer"
      intro={'"Tourist Visa Experts" is a brand and website operated by Namaste Travel Amigo Private Limited. This Disclaimer forms part of our Terms & Conditions.'}
      sections={SECTIONS}
    />
  )
}
