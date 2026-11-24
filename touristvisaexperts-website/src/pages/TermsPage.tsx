import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

const SECTIONS: LegalSection[] = [
  {
    title: '1. Website Ownership',
    content: `The domain touristvisaexperts.com is owned and operated by Tourist Visa Experts.

Access to the website and its services is granted to users subject to acceptance of these terms and conditions without modification. By using the website, you acknowledge that you have read, understood, and agreed to these terms.

Tourist Visa Experts reserves the right to modify or update this agreement at any time without prior notice.`,
  },
  {
    title: '2. Website Usage',
    content: 'The Tourist Visa Experts website is intended for personal and non commercial use only.',
    list: [
      'Modifying or copying website content',
      'Distributing or transmitting website materials',
      'Reproducing, publishing, licensing, or selling information from the website',
      'Creating derivative works from website content',
      'Using website materials for commercial purposes without written permission',
    ],
    listIntro: 'Users are prohibited from:',
    after: 'All website content including text, software, services, and materials remains the property of Tourist Visa Experts or its licensors.',
  },
  {
    title: '3. Online Booking Services',
    content: 'Tourist Visa Experts provides an online platform that allows users to request visa related services.',
    list: [
      'Service availability',
      'Pricing',
      'Document requirements',
    ],
    listIntro: 'Submitting a request through the website does not automatically confirm a booking. All requests are subject to verification of:',
    after: 'A booking is confirmed only after payment has been successfully processed and confirmation has been issued by Tourist Visa Experts.\n\nAny preliminary communication does not constitute acceptance of the booking.',
  },
  {
    title: '4. Booking Conditions',
    content: 'Availability of services offered through the website is determined solely by Tourist Visa Experts and its service partners.',
    list: [
      'Full name',
      'Contact number',
      'Email address',
      'Residential address',
      'Passport information',
      'Travel related information',
    ],
    listIntro: 'Users must provide accurate and complete information during the booking process including:',
    after: 'Failure to provide correct information may result in cancellation of the booking. Any losses resulting from incorrect information are the responsibility of the user.\n\nTourist Visa Experts reserves the right to determine acceptable payment methods including debit cards, credit cards, and other approved payment gateways.',
  },
  {
    title: '5. Third Party Links',
    content: `The website may contain links to external third party websites.

These links are provided for convenience only. Tourist Visa Experts does not control or take responsibility for the content, policies, or services of third party websites.

Users access external websites at their own risk.`,
  },
  {
    title: '6. Prohibited Activities',
    content: '',
    list: [
      'Illegal activities',
      'Fraudulent transactions',
      'Providing false or misleading information',
      'Violating applicable laws or regulations',
    ],
    listIntro: 'Users agree not to use the website for:',
    after: 'Tourist Visa Experts reserves the right to restrict access, suspend accounts, or remove user information if such activities are detected.',
  },
  {
    title: '7. Visa Application Disclaimer',
    content: `Tourist Visa Experts provides visa consultancy and application assistance services.

Our responsibility is limited to preparing and submitting visa applications based on the information provided by the applicant.

The decision to approve or reject a visa application lies solely with the respective embassy, consulate, or immigration authority.`,
    list: [
      'Request additional documentation',
      'Delay application processing',
      'Reject applications without providing reasons',
    ],
    listIntro: 'These authorities may:',
    after: 'Tourist Visa Experts has no control over these decisions.',
  },
  {
    title: '8. Accuracy of Application Information',
    content: `Tourist Visa Experts relies on the information and documents provided by applicants.

We do not independently verify the accuracy or completeness of submitted information.`,
    list: [
      'Incorrect information',
      'Incomplete documentation',
      'Misrepresentation of facts',
    ],
    listIntro: 'Tourist Visa Experts is not responsible for visa refusals, delays, or complications caused by:',
  },
  {
    title: '9. Cancellation of Applications',
    content: '',
    list: [
      'Eligibility requirements are not met',
      'False information is provided',
      'Fraudulent or unlawful activity is detected',
    ],
    listIntro: 'Tourist Visa Experts reserves the right to cancel registrations or discontinue services if:',
    after: 'In such cases the Company may remove associated user data and terminate access to services.',
  },
  {
    title: '10. Visa Decisions and External Factors',
    content: `Visa approvals, rejections, and processing timelines are determined solely by immigration authorities.

Tourist Visa Experts is not responsible for visa refusals or delays caused by factors beyond our control.

Immigration authorities are not obligated to provide explanations for visa decisions.`,
  },
  {
    title: '11. Applicant Expenses',
    content: '',
    list: [
      'Travel bookings',
      'Accommodation reservations',
      'Insurance purchases',
      'Employment leave or loss of income',
    ],
    listIntro: 'Applicants may incur costs such as:',
    after: 'Tourist Visa Experts will not be responsible for financial losses or expenses incurred if a visa application is delayed or rejected.',
  },
  {
    title: '12. Embassy Discretion',
    content: `Embassies and immigration authorities may review applications in different locations or request additional verification.

Such decisions may extend processing times and are beyond the control of Tourist Visa Experts.`,
  },
  {
    title: '13. Visa Issuing Authority',
    content: `Tourist Visa Experts is a private visa consultancy service and does not have authority to grant visas.

Only the relevant embassy or immigration authority can issue visas.`,
  },
  {
    title: '14. Immigration Authority Decisions',
    content: '',
    list: [
      'Visa approval or rejection',
      'Requests for additional documents',
      'Visa processing timelines',
      'Visa validity period',
    ],
    listIntro: 'Tourist Visa Experts cannot influence immigration authorities regarding:',
    after: 'All such decisions are made solely by the issuing authority.',
  },
  {
    title: '15. Visa Terms',
    content: `Visa validity, entry permissions, and activation dates are determined by immigration authorities.

Tourist Visa Experts has no control over these conditions.`,
  },
  {
    title: '16. Advisory Services',
    content: `Tourist Visa Experts provides visa guidance based on information available at the time of application.

Immigration rules and policies may change without public notice. Tourist Visa Experts is not responsible for discrepancies caused by such regulatory updates.`,
  },
  {
    title: '17. Client Responsibilities',
    content: `**Providing Documents**
Applicants must provide all required documents and information necessary for visa processing. This may include documents from third parties such as employers, educational institutions, sponsors, and family members. Tourist Visa Experts may delay or suspend processing until all required documents are received.

**Submission Deadlines**
If immigration authorities request additional documentation, applicants must provide the required documents promptly and no later than 48 hours before the official deadline. Failure to do so may result in delays or application rejection.

**Information Accuracy**
Applicants are responsible for ensuring that all submitted forms and documents are accurate and complete. Tourist Visa Experts will not be liable for delays, refusals, or additional costs resulting from inaccurate information.`,
  },
  {
    title: '18. Refund Policy',
    content: 'Service fees paid to Tourist Visa Experts are non refundable once the visa application has been submitted to immigration authorities, regardless of application outcome or withdrawal reason.',
  },
  {
    title: '19. Visa Error Notification',
    content: `Applicants must review issued visas immediately after receiving them.

If any error or discrepancy is identified, the applicant must notify Tourist Visa Experts within 24 hours of receiving the visa.

Requests submitted after this period may not be accepted, and Tourist Visa Experts will not be responsible for issues arising from delayed reporting.`,
  },
]

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="User Agreement"
      intro={'This User Agreement governs the use of services provided through touristvisaexperts.com (referred to as "Tourist Visa Experts", "Company", "We", "Us", or "Our").\n\nBy accessing or using this website and its services, you agree to comply with the terms and conditions described in this agreement.'}
      sections={SECTIONS}
    />
  )
}
