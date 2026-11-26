import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

const SECTIONS: LegalSection[] = [
  {
    title: '1. Definitions',
    content: `**Account** — A registered account created to access our services.

**Affiliate** — Any entity that controls, is controlled by, or is under common control with the Company. Control means ownership of at least 50 percent of voting shares or interests.

**Website / Application** — The website touristvisaexperts.com and related services.

**Company** — Tourist Visa Experts.

**Country** — India.

**Device** — Any device used to access the service including computer, mobile phone, or tablet.

**Personal Data** — Any information that identifies or can identify an individual.

**Service** — Visa consultancy and related assistance provided through the website.

**Service Provider** — Third party individuals or companies processing data on behalf of the Company.

**Third Party Social Media Service** — Platforms allowing users to sign in or interact with our service.

**Usage Data** — Information collected automatically when using the website.

**User / You** — Any individual or organisation using our services.`,
  },
  {
    title: '2. Information We Collect',
    content: '**2.1 Personal Information**\nTo provide visa assistance and related services, we may collect the following information:',
    list: [
      'Full name', 'Email address', 'Phone number', 'Gender', 'Date of birth',
      'Residential address including city, state and postal code', 'Passport details',
      'Travel details required for visa processing', 'Payment related information for service charges',
      'Information related to visa applications and travel history',
    ],
    after: `Publicly available information is not treated as sensitive. Providing certain information is necessary to access some services. If required data is not provided, we may not be able to process your request.

**2.2 Usage Data**
When you visit or interact with our website, we automatically collect certain technical information including IP address, browser type and version, pages visited, date and time of visit, time spent on pages, device identifiers, and diagnostic and performance data. For mobile users we may also collect mobile device type, unique device identifier, mobile operating system, mobile browser type, and mobile IP address.

**2.3 Device Permissions**
During the visa application process, you may upload documents through the website. For this purpose we may request permission to access your camera or photo gallery/storage. These permissions are only used for document upload purposes. Access can be managed through your device settings.`,
  },
  {
    title: '3. How We Use Your Information',
    content: 'Your information may be used for the following purposes:',
    list: [
      'Providing visa consultancy services',
      'Managing your account and registration',
      'Processing visa applications and related documentation',
      'Communicating updates related to your service requests',
      'Sending service notifications via email, SMS, or phone',
      'Providing offers, promotions, or relevant service updates',
      'Improving website functionality and user experience',
      'Conducting analytics and service performance analysis',
      'Ensuring security and preventing fraud',
      'Managing company operations including potential mergers or acquisitions',
    ],
  },
  {
    title: '4. Sharing of Information',
    content: `Your personal data may be shared in the following situations:

**Service Providers** — Third party vendors that assist in operating our services, payment processing, analytics, or communication systems.

**Government Authorities** — Embassies, consulates, visa processing agencies, or government authorities when required for visa processing.

**Affiliates and Partners** — Companies working with us to deliver services.

**Legal Compliance** — When required by law, court order, or government authority.

**Security and Fraud Prevention** — To detect or prevent fraud, abuse, or security threats.

**With Your Consent** — When you explicitly agree to share information.`,
  },
  {
    title: '5. Your Rights and Control Over Your Data',
    content: '',
    list: [
      'Request access to your personal data',
      'Request correction of incorrect data',
      'Request deletion of your data',
      'Withdraw consent for data processing',
    ],
    listIntro: 'You have the right to:',
    after: 'To submit a request, contact: support@touristvisaexperts.com\n\nIdentity verification may be required before processing requests.',
  },
  {
    title: '6. Data Retention',
    content: `We retain personal data only for as long as necessary to provide our services and comply with legal obligations.

Typically, personal data is retained for 180 days after account closure, unless a longer retention period is required by law or regulatory authorities.

Usage data may be retained longer for security and analytics purposes.`,
  },
  {
    title: '7. Data Transfer',
    content: `Your information may be processed or stored on servers located outside your state or country.

By using our services, you agree to the transfer and processing of your information in other jurisdictions where data protection laws may differ.

We ensure appropriate safeguards are implemented to protect your data.`,
  },
  {
    title: '8. Security of Information',
    content: 'We implement industry standard security measures including:',
    list: [
      'Data encryption',
      'Secure servers',
      'Access controls',
      'Monitoring systems',
    ],
    after: 'While we strive to protect your personal data, no online transmission or storage method can guarantee complete security.',
  },
  {
    title: '9. Third Party Analytics',
    content: `We may use analytics tools such as Google Analytics to understand website usage and improve services.

These services may collect information according to their own privacy policies.`,
  },
  {
    title: '10. Payments',
    content: `Payments for services are processed through secure third party payment gateways.

We do not store your debit card or credit card information on our servers.

Payment providers comply with PCI DSS security standards to ensure secure transactions.`,
  },
  {
    title: '11. Third Party Links',
    content: `Our website may contain links to third party websites.

We are not responsible for the privacy policies or content of external websites. Users should review their privacy policies before providing personal information.`,
  },
  {
    title: '12. Changes to This Privacy Policy',
    content: `We may update this Privacy Policy periodically.

Any changes will be published on this page with a revised Effective Date.

Continued use of our services after updates means you accept the revised policy.`,
  },
]

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro={'Tourist Visa Experts ("Company", "We", "Us", or "Our") operates the website touristvisaexperts.com and provides visa consultancy services. We respect your privacy and are committed to protecting your personal information.\n\nThis Privacy Policy explains how we collect, use, store, disclose, and protect your information when you use our website and services. This Policy forms part of our Terms of Use.\n\nBy accessing or using our website or services, you agree to the collection and use of information in accordance with this Privacy Policy.'}
      sections={SECTIONS}
    />
  )
}
