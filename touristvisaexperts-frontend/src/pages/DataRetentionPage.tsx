import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

const SECTIONS: LegalSection[] = [
  {
    title: '1. What We Retain',
    content: 'During your case we hold the personal data and documents needed to deliver your service: identity and passport details, contact details, application forms and drafts, supporting documents (such as bank statements and employment letters), communications including WhatsApp messages, voice notes and call recordings, and payment records.',
  },
  {
    title: '2. How Long We Keep It',
    content: 'We retain data during the 1-year period for follow-up support (embassies sometimes come back with questions), reapplications and appeals, tracking and quality, dispute resolution, and legal compliance. We retain your data for our own records and tracking; we do not sell it or share it beyond what service delivery and law require.',
    listIntro: 'Retention periods by data type:',
    list: [
      'Case documents and application records — Up to 1 year after case closure',
      'Communications (email, WhatsApp, chatbot, voice notes, call recordings) — Up to 1 year after case closure',
      'Payment and invoice records — As required by Indian tax and company law (typically up to 8 years)',
      'Consent logs (checkbox acceptance records) — For as long as needed to evidence consent and defend claims',
      'Website usage / analytics data — Shorter periods, for analysis and security',
    ],
  },
  {
    title: '3. When We Keep Data Longer',
    content: 'Retention may extend beyond the standard period where: law requires it; a dispute, complaint, or chargeback is open; an application, appeal, or reapplication is ongoing; or fraud prevention requires it. In such cases, data is kept only as long as the reason exists.',
  },
  {
    title: '4. Deletion Requests',
    content: 'You may request deletion of your data at any time by writing to support@touristvisaexperts.com (copy hitouristvisaexperts@gmail.com). We will act on valid requests within the timelines required by law, except where law requires retention, or an ongoing case, dispute, or chargeback exists. After retention ends, data is securely deleted or anonymised.\n\nYou are responsible for keeping copies of your own original documents. We are not a permanent document repository.',
  },
  {
    title: '5. Where Data Lives',
    content: 'Data may be held in our website and internal CRM and in supporting tools including Google Drive, OneDrive, Google Forms, and WhatsApp, as described in our Privacy Policy. Tools may change at any time without notice, and we may introduce new technologies and cloud platforms while maintaining substantially similar privacy and security standards. This Policy applies regardless of the tool used.',
  },
]

export default function DataRetentionPage() {
  return (
    <LegalPageLayout
      title="Data Retention Policy"
      intro={'"Tourist Visa Experts" operates this website and provides visa consultancy services. This Policy explains how long we keep your data and why. It should be read with our Privacy Policy.'}
      sections={SECTIONS}
    />
  )
}
