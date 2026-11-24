import LegalPageLayout, { type LegalSection } from '../components/legal/LegalPageLayout'

const SECTIONS: LegalSection[] = [
  {
    title: '1. Cancellation Procedure',
    content: `Visa service bookings can be cancelled by contacting our customer support team.

If you have booked multiple visas or group applications, you must clearly specify which visa application you want to cancel.

Cancellation requests are processed offline by our support team. After confirmation, eligible refunds will be issued to the original payment method after deducting applicable cancellation charges.`,
  },
  {
    title: '2. Cancellation Charges',
    content: 'Cancellation fees are applied per visa and per applicant.\n\nIf cancellation is requested within 24 hours of booking, the following charges apply:',
    list: [
      'Rs. 250 (including GST) for each online visa application that has not yet been processed.',
      'Rs. 500 (including GST) for each offline visa application.',
    ],
    after: 'These charges cover administrative and processing costs.',
  },
  {
    title: '3. Non Refundable Situations',
    content: 'Refunds will not be issued in the following cases:',
    list: [
      'Cancellation requested after 24 hours of booking.',
      'Cancellation requested after the agent has completed the document verification visit.',
      'Cancellation requested after documents or passport have been submitted to the embassy or processing authority.',
    ],
    after: 'Once the application process has moved forward, administrative and service costs cannot be reversed.',
  },
  {
    title: '4. Rescheduling and Additional Visits',
    content: 'We provide one complimentary rescheduling for the document verification visit.\n\nIf additional rescheduling is required, the following charges apply:',
    list: [
      'Rs. 250 (including GST) per visa for each additional rescheduling.',
    ],
    after: 'If further document preparation or verification is required after the initial visit, Rs. 250 (including GST) per visa will be charged for every additional visit.',
  },
  {
    title: '5. Applications Processed Through VFS Global',
    content: `For visa applications processed through agencies such as VFS Global, their official policies apply to administrative fees, rescheduling, and no show appointments.

Tourist Visa Experts may assist with rescheduling once the applicable agency fee has been paid. These charges vary depending on the country of visa application and the visa application centre location.`,
  },
  {
    title: '6. Refund Processing Time',
    content: `Approved refunds are processed within 48 to 72 hours.

Refunds are credited to the original payment method used during booking.

Actual credit time may vary depending on the payment provider or bank processing timelines.`,
  },
  {
    title: '7. Policy Changes',
    content: `Tourist Visa Experts reserves the right to modify or update this Cancellation and Refund Policy at any time.

Any updates will be published on the website and will take effect immediately upon posting.`,
  },
]

export default function CancellationPage() {
  return (
    <LegalPageLayout
      title="Refund and Cancellation Policy"
      intro={'This Cancellation and Refund Policy explains the terms under which cancellations and refunds are processed for services provided by Tourist Visa Experts (touristvisaexperts.com).\n\nBy using our services, you agree to the terms described in this policy.'}
      sections={SECTIONS}
    />
  )
}
