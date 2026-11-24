// Premium line icons for document categories — inline SVG, no dependency.
// Each accepts { size, color } and renders a clean 24x24 stroke icon.

const base = (size = 22, color = 'currentColor') => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export const PassportIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <circle cx="12" cy="9" r="3" />
    <path d="M9.5 13.5h5" />
  </svg>
)

export const BankIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M3 10 12 4l9 6" />
    <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
    <path d="M3 21h18" />
    <path d="M4 18h16" />
  </svg>
)

export const BriefcaseIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M2 13h20" />
  </svg>
)

export const ShieldIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const PlaneIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 4.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  </svg>
)

export const HotelIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M3 21V7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v14" />
    <path d="M16 11h4a1 1 0 0 1 1 1v9" />
    <path d="M2 21h20" />
    <path d="M6 9h2M6 13h2M11 9h2M11 13h2" />
    <path d="M9 21v-3a1 1 0 0 1 1-1 1 1 0 0 1 1 1v3" />
  </svg>
)

export const LetterIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const FormIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
    <path d="M9 7h6M9 11h6M9 15h3" />
    <path d="M16 2v3a1 1 0 0 0 1 1h3" opacity="0" />
  </svg>
)

export const FileIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h6" />
  </svg>
)

export const PaperclipIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M21.4 11.1 12.3 20.2a5 5 0 0 1-7-7l9.2-9.2a3.3 3.3 0 1 1 4.7 4.7l-9.2 9.1a1.7 1.7 0 0 1-2.3-2.3l8.5-8.5" />
  </svg>
)

export const UsersIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const StampIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M7 21h10" />
    <path d="M9 17v4M15 17v4" />
    <circle cx="12" cy="10" r="3.5" />
  </svg>
)

export const HomeIcon = ({ size, color }) => (
  <svg {...base(size, color)}>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
)

// Category → icon component map
export const DOC_ICONS = {
  passport:             PassportIcon,
  bank_statement:       BankIcon,
  employment:           BriefcaseIcon,
  travel_insurance:     ShieldIcon,
  flight_ticket:        PlaneIcon,
  hotel_booking:        HotelIcon,
  cover_letter:         LetterIcon,
  application_form:     FormIcon,
  sponsor_documents:    UsersIcon,
  previous_visa_stamps: StampIcon,
  property_funds:       HomeIcon,
  other:                FileIcon,
  custom:               PaperclipIcon,
}

export function DocIcon({ category, size = 22, color = 'currentColor' }) {
  const Cmp = DOC_ICONS[category] || FileIcon
  return <Cmp size={size} color={color} />
}
