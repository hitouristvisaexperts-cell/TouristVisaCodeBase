// Mirror of backend SOP workflow (TVE Case Management Guide v1.0).
// Single source of truth for stage names + task labels across admin/team/client UIs.

export const INTERNAL_STAGES = [
  { key: 'STAGE_1_WELCOME_SETUP',          order: 1,  name: 'Welcome & Setup' },
  { key: 'STAGE_2_DEEP_DIVE_CONSULTATION', order: 2,  name: 'The Deep Dive Consultation' },
  { key: 'STAGE_3_DOCUMENT_COLLECTION',    order: 3,  name: 'Document Collection' },
  { key: 'STAGE_4_DOCUMENT_VERIFICATION',  order: 4,  name: 'Document Verification (Quality Check)' },
  { key: 'STAGE_5_FORM_FILLING_APPROVAL',  order: 5,  name: 'Form Filling & Client Approval' },
  { key: 'STAGE_6_WRITING_LETTERS',        order: 6,  name: 'Writing the Letters' },
  { key: 'STAGE_7_FINAL_DOUBLE_CHECK',     order: 7,  name: 'Final Double-Check Before Appointment' },
  { key: 'STAGE_8_APPOINTMENT_DAY',        order: 8,  name: 'The Appointment Day' },
  { key: 'STAGE_9_EMBASSY_PROCESSING',     order: 9,  name: 'Embassy Processing' },
  { key: 'STAGE_10_MARKETING_REVIEWS',     order: 10, name: 'Marketing & Reviews' },
  { key: 'STAGE_11_CLOSING_CASE',          order: 11, name: 'Closing the Case' },
]

export const STAGE_COUNT = INTERNAL_STAGES.length

export const STAGE_NAME = INTERNAL_STAGES.reduce((m, s) => { m[s.key] = s.name; return m }, {})

export const APPOINTMENT_MODULE = {
  key: 'APPOINTMENT_MODULE',
  name: 'Appointment Booking',
  goal: 'Book the embassy/VFS appointment. Can start the moment the client pays — runs in parallel with the numbered stages.',
  note: 'If a slot is lost or cancelled, track the rebooking process here.',
}

export const TASK_LABELS = {
  // Stage 1
  CLIENT_WHATSAPP_GROUP_CREATED: 'Create the Client WhatsApp Group',
  WELCOME_MESSAGE_SENT: 'Send the Welcome Message',
  INTRODUCTION_CALL_ATTEMPTED: 'Try calling for a quick introduction',
  TVE_TEAM_INTRODUCED: 'Introduce the TVE Team in the group',
  WHATSAPP_GROUP_PURPOSE_EXPLAINED: 'Explain what the WhatsApp group is for',
  VISA_PROCESS_BRIEFLY_EXPLAINED: 'Briefly explain the visa process and next steps',
  DESTINATION_AND_DATES_CONFIRMED: 'Confirm destination and travel dates',
  BASIC_DOCUMENT_LIST_SHARED: 'Share the basic document list for their country',
  CONSULTATION_AVAILABILITY_ASKED: 'Ask when they are free for a detailed meeting',
  CONSULTATION_MEETING_SCHEDULED: 'Schedule the Consultation Meeting and send the invite',
  // Stage 2
  CLIENT_JOINED_MEETING: 'Client joined the meeting',
  TRAVEL_PURPOSE_AND_HISTORY_DISCUSSED: 'Discuss travel purpose and past travel history',
  PREVIOUS_REFUSALS_CHECKED: 'Ask if they have EVER had a visa refused before',
  FINANCIAL_SITUATION_DISCUSSED: 'Discuss job, business, and financial situation',
  FAMILY_SPONSORS_COMPANIONS_DISCUSSED: 'Discuss family, sponsors, and travel companions',
  REQUIRED_DOCUMENTS_EXPLAINED: 'Explain exactly what documents they need to give us',
  EARLY_UPLOAD_IMPORTANCE_EXPLAINED: 'Explain why they need to upload documents early',
  WAIT_AND_PROCESSING_TIMES_EXPLAINED: 'Tell them current appointment wait & processing times',
  EXPECTATIONS_SET: 'Set clear expectations (client vs. TVE responsibilities)',
  MEETING_NOTES_SAVED: 'Save your meeting notes in the system',
  WHATSAPP_SUMMARY_SHARED: 'Share a quick summary in the WhatsApp group',
  // Stage 3
  FINAL_DOCUMENT_CHECKLIST_SHARED: 'Share the final Document Checklist with the client',
  CLIENT_STARTED_UPLOADING: 'Client started uploading documents',
  FOLLOWUP_1_SENT: 'Send Follow-up 1 (if slow)',
  FOLLOWUP_2_SENT: 'Send Follow-up 2 (if slow)',
  FOLLOWUP_3_SENT: 'Send Follow-up 3 (if slow)',
  REUPLOAD_REQUESTED: 'Ask for missing or blurry documents to be re-uploaded',
  NEEDS_ATTENTION_FLAGGED: 'Flag for manager attention',
  ALL_DOCUMENTS_RECEIVED: 'All required documents received',
  REVIEW_CALL_DONE: '(Optional) Quick call to review what they sent',
  // Stage 4
  PASSPORT_CHECKED: 'Check Passport',
  BANK_STATEMENTS_CHECKED: 'Check Bank Statements',
  EMPLOYMENT_BUSINESS_PROOF_CHECKED: 'Check Employment / Business Proof',
  TAX_PROPERTY_DOCUMENTS_CHECKED: 'Check Tax & Property Documents',
  SPONSOR_LEAVE_LETTERS_CHECKED: 'Check Sponsor & Leave Letters',
  CIVIL_CERTIFICATES_CHECKED: 'Check Marriage / School certificates',
  READABILITY_AND_VALIDITY_CONFIRMED: 'Documents are readable, complete, and valid',
  NAME_AND_DOB_CONSISTENCY_CONFIRMED: 'Name and date of birth match everywhere',
  FINANCIALS_MATCH_DECLARED_INCOME: 'Bank statement matches declared income',
  PRIMARY_CHECK_COMPLETED: 'Primary check completed by you',
  SECONDARY_REVIEW_COMPLETED: 'Secondary review completed by a teammate',
  // Stage 5
  APPLICATION_FORM_FILLED: 'Fill out the Application Form',
  FORM_MATCHES_DOCUMENTS_CHECKED: 'Check the form matches their documents perfectly',
  DRAFT_SHARED_WITH_CLIENT: 'Share the draft application with the client',
  CLIENT_CORRECTIONS_APPLIED: 'Apply any corrections the client asks for',
  FINAL_VERSION_SHARED: 'Share the final version',
  CLIENT_TYPED_APPROVED: 'Get the client to type "Approved" in WhatsApp',
  APPROVAL_SAVED_IN_SYSTEM: 'Save the approval in the system',
  // Stage 6
  COVER_LETTER_DRAFTED_AND_REVIEWED: 'Draft the Cover Letter (and get it reviewed)',
  EXPLANATION_LETTERS_WRITTEN: 'Write explanation letters (Sponsor, Employment gap, etc.)',
  FLIGHT_ITINERARY_PREPARED: 'Prepare Flight Itinerary',
  HOTEL_BOOKING_PREPARED: 'Prepare Hotel Booking',
  TRAVEL_INSURANCE_PREPARED: 'Prepare Travel Insurance',
  WHATSAPP_UPDATED_ALL_READY: 'Update the WhatsApp group that everything is ready',
  // Stage 7
  FILE_COMPARED_AGAINST_EMBASSY_CHECKLIST: 'Compare our file against the official Embassy Checklist',
  SECOND_STAFF_VERIFIED_ALL: 'Second staff verified Passport, Form, Cover Letter, Bookings, Financials',
  FINAL_INSTRUCTIONS_SENT: 'Send the final instructions to the client',
  CLIENT_CONFIRMED_INSTRUCTIONS: 'Client confirmed they understand the instructions',
  // Stage 8
  CLIENT_ATTENDED_AND_BIOMETRICS_DONE: 'Client attended appointment and did biometrics',
  PASSPORT_SUBMITTED_RECEIPT_RECEIVED: 'Client submitted passport and sent us the receipt',
  CLIENT_FEEDBACK_RECORDED: 'Ask how it went and record their feedback',
  // Stage 9
  APPLICATION_STATUS_TRACKED: 'Track the application status online',
  EMBASSY_QUERY_HANDLED: 'If embassy asks for more info: tell client & flag for attention',
  DECISION_RECEIVED: 'Decision received',
  DECISION_COPY_UPLOADED: 'Upload a copy of the decision to the system',
  VISA_APPROVED: 'Mark as Approved',
  VISA_DECLINED: 'Mark as Declined',
  // Stage 10
  GOOGLE_REVIEW_OR_TESTIMONIAL_REQUESTED: 'Ask for a Google Review / Video Testimonial',
  SOCIAL_MEDIA_PERMISSION_OBTAINED: 'Get permission to post success on TVE Social Media',
  // Stage 11
  CASE_SUMMARY_WRITTEN: 'Write a quick summary (challenges & learnings)',
  DOCUMENTS_ARCHIVED: 'Archive all documents safely',
  CASE_MARKED_CLOSED: 'Mark Case as Closed (only a Manager can reopen)',
  // Appointment module
  PASSPORT_EMAIL_MOBILE_VERIFIED: 'Passport, Email, and Mobile verified',
  SLOT_SEARCH_STARTED: 'Started searching for an appointment slot',
  SLOT_FOUND_AND_PROPOSED: 'Found a slot and asked the client if the date works',
  CLIENT_CONFIRMED_DATE: 'Client said yes to the date',
  APPOINTMENT_BOOKED_AND_SHARED: 'Appointment booked and confirmation shared',
  APPOINTMENT_POLICY_ACCEPTED: 'Explained Appointment Policy and client accepted responsibility',
}

export function taskLabel(key) {
  return TASK_LABELS[key] || (key || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function stageName(key) {
  return STAGE_NAME[key] || (key || '').replace(/_/g, ' ')
}
