require('dotenv').config();
const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');

const faqs = [
  // Booking Appointment
  {
    category: 'Booking Appointment',
    question: 'Do we need to pay for the booking appointment?',
    answer: 'Yes, most embassies charge a fee to book an appointment slot. This fee varies by country and is separate from the visa fee. Our team will inform you of the exact amount for your destination before scheduling.',
    order: 1,
  },
  {
    category: 'Booking Appointment',
    question: 'If we cancel, can we get a complete refund?',
    answer: 'Refund eligibility depends on how early you cancel. Embassy appointment fees are generally non-refundable once booked. Our service fee refund policy is detailed in our Terms & Conditions — please review them or contact us for clarification.',
    order: 2,
  },
  {
    category: 'Booking Appointment',
    question: 'Does the booking appointment fee remain the same for all countries?',
    answer: 'No, the appointment fee varies from country to country. Some countries charge through VFS Global or BLS International at different rates, while others have their own portals. We will let you know the exact fee for your chosen destination.',
    order: 3,
  },
  {
    category: 'Booking Appointment',
    question: 'Which countries are providing free appointments?',
    answer: 'Several countries do not charge an appointment booking fee — the visa fee itself is the only mandatory payment. Countries frequently offering free appointment slots include Germany, France, Netherlands, and some others. Our team will confirm the current status for your destination.',
    order: 4,
  },

  // Travel Insurance
  {
    category: 'Travel Insurance',
    question: 'Is travel insurance included in your services or do I have to pay extra?',
    answer: 'Travel insurance is not included in our base package as it is a regulated product. However, we guide you to trusted providers where you can purchase the right policy. We also offer assistance in checking whether your policy meets embassy requirements.',
    order: 1,
  },
  {
    category: 'Travel Insurance',
    question: 'How much coverage is required if we purchase from another website?',
    answer: 'For most Schengen countries, a minimum coverage of €30,000 (approximately ₹27 lakhs) is mandatory. This must include emergency medical expenses and repatriation. If you are applying for a non-Schengen country, our team will advise you on the specific requirement.',
    order: 2,
  },
  {
    category: 'Travel Insurance',
    question: 'How much should be the validity of travel insurance?',
    answer: 'Your travel insurance must be valid for the entire duration of your trip, from the day you enter to the day you return. It is advisable to have a buffer of 1–2 extra days on both ends. The policy must cover all countries you plan to visit.',
    order: 3,
  },
  {
    category: 'Travel Insurance',
    question: 'Do we need to take a printout of all pages of the travel insurance?',
    answer: 'Yes, you should carry a complete printout of your travel insurance policy, including the certificate, schedule, and any terms summary. Embassies often ask for all pages, so do not submit only the first page.',
    order: 4,
  },

  // Flights
  {
    category: 'Flights',
    question: 'Can we actually travel on the tickets you provide?',
    answer: 'No. The flight tickets we provide are dummy itinerary tickets (also called confirmed flight itineraries) issued purely for visa application purposes. They confirm your intended travel route but cannot be used to board an actual flight. Once your visa is approved, you will book your real tickets separately.',
    order: 1,
  },
  {
    category: 'Flights',
    question: 'Do we have to pay extra for tickets or is it included in your package?',
    answer: 'Flight itinerary (dummy tickets) is included in our standard visa assistance package at no extra charge. If you need standalone flight itinerary without a full visa package, a separate fee applies.',
    order: 2,
  },
  {
    category: 'Flights',
    question: 'If we only require tickets, can you provide them and at what cost?',
    answer: 'Yes, we offer standalone dummy flight itinerary for ₹999 per passenger. These are embassy-accepted confirmed itineraries showing your complete travel route. You can order this directly through our portal.',
    order: 3,
  },
  {
    category: 'Flights',
    question: 'Will the tickets you provide be accepted by the embassy?',
    answer: 'Yes, the flight itineraries we provide are accepted by all major embassies and consulates, including Schengen countries, the UK, USA, Canada, and others. They are issued through recognized booking platforms and show confirmed PNR numbers.',
    order: 4,
  },
  {
    category: 'Flights',
    question: 'Do we need to carry printouts of flight tickets at the time of appointment?',
    answer: 'Yes, always carry printed copies of your flight itinerary to the appointment. Embassies generally do not accept documents shown on a phone screen. Print clearly on A4-size paper.',
    order: 5,
  },

  // Hotel Accommodation
  {
    category: 'Hotel Accommodation',
    question: 'Can we choose the "pay at property" option instead of free cancellation?',
    answer: 'No. Embassies require proof of confirmed accommodation, which means a booking with no upfront deduction. "Pay at property" bookings may not clearly show a confirmed reservation. We strongly recommend free cancellation bookings for visa purposes.',
    order: 1,
  },
  {
    category: 'Hotel Accommodation',
    question: 'Can you book accommodation on my behalf?',
    answer: 'Yes, we can arrange dummy hotel accommodation bookings (fully refundable/cancellable) as part of our visa service. These bookings are accepted by embassies and will be cancelled after your appointment.',
    order: 2,
  },
  {
    category: 'Hotel Accommodation',
    question: 'If we are traveling with family, is it okay to book a hostel or guest house?',
    answer: 'While not strictly prohibited, embassies generally prefer bookings at reputable hotels rather than hostels or guest houses, especially for family applications. We recommend booking a hotel with clear confirmation to avoid any issues during document scrutiny.',
    order: 3,
  },
  {
    category: 'Hotel Accommodation',
    question: 'Is it your responsibility if our payment gets deducted for accommodation?',
    answer: 'We provide dummy/provisional bookings that do not require any upfront payment or deduction. If you independently make a paid booking and are charged, that is outside our scope. Always confirm with us before making any direct payments for accommodation.',
    order: 4,
  },
  {
    category: 'Hotel Accommodation',
    question: 'If we are traveling to 4 countries, is it mandatory to book accommodation for all countries?',
    answer: 'Yes, for multi-country itineraries (especially Schengen), embassies require accommodation proof for each country on your travel plan. Our team will help you arrange bookings for all destinations included in your itinerary.',
    order: 5,
  },
  {
    category: 'Hotel Accommodation',
    question: 'Do we need to take printouts of all booking confirmations?',
    answer: 'Yes, carry printed copies of every hotel booking confirmation. This includes the hotel name, address, check-in/check-out dates, and your name. Digital copies on a phone are generally not accepted at the appointment counter.',
    order: 6,
  },

  // Before Appointment
  {
    category: 'Before Appointment',
    question: 'How much does your service cost?',
    answer: 'Our visa assistance packages start at ₹10,000 for standard applications. The exact cost depends on your destination country, number of applicants, and any add-on services. Contact us for a personalized quote.',
    order: 1,
  },
  {
    category: 'Before Appointment',
    question: 'What kind of visa services does your team provide?',
    answer: 'We provide end-to-end tourist visa assistance including document checklist preparation, dummy flight itineraries, hotel accommodation bookings, travel insurance guidance, application form filling, appointment scheduling, and pre-appointment briefing. We cover Schengen, UK, USA, Canada, Australia, and many other destinations.',
    order: 2,
  },
  {
    category: 'Before Appointment',
    question: 'Which countries provide longer duration visas?',
    answer: 'Countries like Germany, France, Netherlands, Finland, and Estonia are known for granting longer-duration Schengen visas for first-time applicants with strong profiles. However, visa duration depends heavily on your individual financial profile, travel history, and application strength.',
    order: 3,
  },
  {
    category: 'Before Appointment',
    question: 'Can we travel to other countries if we get a visa from a specific country?',
    answer: 'For a Schengen visa, yes — a visa from one Schengen member state allows you to travel freely across all 26 Schengen countries. For non-Schengen destinations (UK, USA, etc.), each country requires its own separate visa.',
    order: 4,
  },
  {
    category: 'Before Appointment',
    question: 'What is the minimum number of days a visa is typically granted?',
    answer: 'For most Schengen applications, the minimum granted duration is 15 days for a single trip. However, embassies typically grant visa validity matching your travel dates plus a few extra days. Multiple-entry visas can be granted for 6 months to 5 years for applicants with strong travel history.',
    order: 5,
  },
  {
    category: 'Before Appointment',
    question: 'How long does it take for the embassy to make a decision?',
    answer: 'Processing times vary by country. Schengen visas typically take 15–30 working days from the date of appointment. UK and USA visas may take 3–8 weeks. We recommend applying well in advance of your travel dates. Our team monitors your application status and keeps you informed.',
    order: 6,
  },
  {
    category: 'Before Appointment',
    question: 'How can we get a longer duration visa?',
    answer: 'A longer visa duration is influenced by a strong financial profile (healthy bank balance, stable income), prior international travel history, property ownership, and a well-prepared application. Our team specifically strategizes your application to maximize the chances of a longer-duration visa.',
    order: 7,
  },
  {
    category: 'Before Appointment',
    question: 'Do we have to pay extra at the time of appointment after paying for the slot?',
    answer: 'If your visa fee (embassy fee) is already included in your package, nothing extra is due at the appointment. However, if the package excludes the embassy/VFS fee, that will need to be paid at the time of submission. We will clearly communicate this before your appointment.',
    order: 8,
  },
  {
    category: 'Before Appointment',
    question: 'Why do you need to know our annual salary and bank balance?',
    answer: 'Embassies require proof that you can financially support yourself during your trip without working abroad. Your salary and bank balance help us assess your financial standing and prepare your ITR, bank statements, and cover letter in the strongest possible way to satisfy embassy requirements.',
    order: 9,
  },
  {
    category: 'Before Appointment',
    question: 'If our visa gets rejected, does it impact our profile?',
    answer: 'Yes, a visa rejection is recorded in your passport history and must be declared in future applications. However, a rejection does not permanently close the door. With the right improvements to your application — better financials, stronger documentation — many clients successfully reapply. Our team will advise you accordingly.',
    order: 10,
  },
  {
    category: 'Before Appointment',
    question: 'After how many days can I reapply if my visa is rejected?',
    answer: 'There is no mandatory waiting period specified by most embassies. However, we recommend waiting at least 3–6 months before reapplying, as reapplying too soon without addressing the rejection reason often leads to another rejection. Our team will help you understand the rejection and prepare a stronger application.',
    order: 11,
  },
  {
    category: 'Before Appointment',
    question: 'If my visa gets rejected, will the embassy and your team refund my money?',
    answer: 'Embassy visa fees are strictly non-refundable regardless of outcome — this is a universal policy. Regarding our service fee, please refer to our refund policy in the Terms & Conditions. In cases where the rejection is due to an error on our part, we will work with you to find a resolution.',
    order: 12,
  },

  // After Appointment
  {
    category: 'After Appointment',
    question: 'Can your team help me with a real itinerary after I get the visa?',
    answer: 'Yes! Once your visa is approved, our team can help you plan your actual travel itinerary including day-by-day plans, must-see attractions, local travel tips, and connecting you with trusted travel partners for real flight and hotel bookings.',
    order: 1,
  },
  {
    category: 'After Appointment',
    question: 'Can I cancel my bookings after the appointment?',
    answer: 'Yes. The dummy hotel and flight bookings we arrange are provisional and can be cancelled after your appointment submission. Our team will guide you on when and how to cancel them to avoid any charges.',
    order: 2,
  },
  {
    category: 'After Appointment',
    question: 'If something is missing from the checklist, will you provide a refund?',
    answer: 'We work diligently to ensure every document on the checklist is prepared and verified before submission. If a document was missed due to our oversight and it impacts your application, we will address it immediately. Please refer to our Terms & Conditions for the refund policy in such cases.',
    order: 3,
  },

  // Every Category
  {
    category: 'Every Category',
    question: 'Is it mandatory to sign your Terms and Conditions?',
    answer: 'Yes, signing our Terms & Conditions is mandatory before we begin processing your visa application. It outlines your rights, our responsibilities, refund policy, and data privacy practices. Please read it carefully and contact us if you have any questions.',
    order: 1,
  },
  {
    category: 'Every Category',
    question: 'How many copies of printouts do we have to take?',
    answer: 'We recommend carrying 2 sets of all documents: one to submit to the embassy and one to keep for your own records. Some embassies may ask for additional copies of specific documents. Our team will specify if more copies are needed for your destination.',
    order: 2,
  },
  {
    category: 'Every Category',
    question: 'Do we need to take color printouts of every document?',
    answer: 'Color printouts are required for certain documents such as your passport copy, photographs, travel insurance, hotel bookings, and flight itinerary. Black-and-white is acceptable for financial documents like bank statements and ITR. Our pre-appointment checklist will clearly mark which documents need color printing.',
    order: 3,
  },
  {
    category: 'Every Category',
    question: 'Is there a print booth or photo booth at the embassy office?',
    answer: 'Some VFS Global and BLS centers have printing and photo booths available, but availability is not guaranteed and queues can be long. We strongly advise you to carry all printed documents and passport-size photographs from home to avoid last-minute stress on the day of your appointment.',
    order: 4,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await FAQ.deleteMany({});
    await FAQ.insertMany(faqs);
    console.log(`Seeded ${faqs.length} FAQs successfully`);
    process.exit(0);
  } catch (err) {
    console.error('FAQ seed error:', err.message);
    process.exit(1);
  }
};

seed();
