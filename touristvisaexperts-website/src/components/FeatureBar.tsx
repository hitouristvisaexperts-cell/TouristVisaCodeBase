import styles from './FeatureBar.module.css'

const FEATURES = [
  {
    bg: '#EEF2FF',
    icon: (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="18" stroke="#4F46E5" strokeWidth="2.5" fill="none"/>
        <line x1="14" y1="32" x2="50" y2="32" stroke="#4F46E5" strokeWidth="2.5"/>
        <ellipse cx="32" cy="32" rx="10" ry="18" stroke="#4F46E5" strokeWidth="2.5" fill="none"/>
        <circle cx="44" cy="20" r="5" fill="#4F46E5"/>
        <polyline points="42,20 44,22 47,18" stroke="#fff" strokeWidth="1.8" fill="none"/>
      </svg>
    ),
    title: 'Global Expertise',
    desc: 'Years of experience in handling visas to 50+ countries.',
  },
  {
    bg: '#F0FDF4',
    icon: (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="16" width="32" height="38" rx="3" stroke="#16A34A" strokeWidth="2.5" fill="none"/>
        <line x1="19" y1="26" x2="37" y2="26" stroke="#16A34A" strokeWidth="2"/>
        <line x1="19" y1="33" x2="37" y2="33" stroke="#16A34A" strokeWidth="2"/>
        <line x1="19" y1="40" x2="30" y2="40" stroke="#16A34A" strokeWidth="2"/>
        <circle cx="46" cy="44" r="10" fill="#16A34A"/>
        <polyline points="40,44 44,48 52,40" stroke="#fff" strokeWidth="2.2" fill="none"/>
      </svg>
    ),
    title: 'Hassle-Free Process',
    desc: 'Simple steps and expert guidance at every stage.',
  },
  {
    bg: '#FFF7ED',
    icon: (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <path d="M32 8 L48 14 L48 32 C48 42 32 52 32 52 C32 52 16 42 16 32 L16 14 Z" stroke="#F97316" strokeWidth="2.5" fill="none"/>
        <polyline points="24,32 30,38 42,26" stroke="#F97316" strokeWidth="2.5" fill="none"/>
        <circle cx="48" cy="18" r="7" fill="#F97316"/>
        <polyline points="44,18 47,21 52,15" stroke="#fff" strokeWidth="2" fill="none"/>
      </svg>
    ),
    title: 'Trusted & Reliable',
    desc: 'Thousands of successful applications every year.',
  },
  {
    bg: '#F5F3FF',
    icon: (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <path d="M20 48 L20 38 A14 14 0 0 1 44 38 L44 48" stroke="#7C3AED" strokeWidth="2.5" fill="none"/>
        <path d="M44 46 L48 46 A4 4 0 0 1 48 54 L44 54 L44 46 Z" stroke="#7C3AED" strokeWidth="2.5" fill="none"/>
        <path d="M20 46 L16 46 A4 4 0 0 0 16 54 L20 54 L20 46 Z" stroke="#7C3AED" strokeWidth="2.5" fill="none"/>
        <circle cx="32" cy="22" r="8" stroke="#7C3AED" strokeWidth="2.5" fill="none"/>
        <line x1="32" y1="54" x2="32" y2="58" stroke="#7C3AED" strokeWidth="2.5"/>
        <line x1="26" y1="58" x2="38" y2="58" stroke="#7C3AED" strokeWidth="2.5"/>
      </svg>
    ),
    title: 'Customer First',
    desc: 'Personalized support whenever you need it.',
  },
]

export default function FeatureBar() {
  return (
    <section className={styles.bar}>
      <div className={styles.inner}>
        {FEATURES.map((f, i) => (
          <div key={f.title} className={styles.item}>
            <div className={styles.iconBox} style={{ background: f.bg }}>
              {f.icon}
            </div>
            <div>
              <div className={styles.title}>{f.title}</div>
              <div className={styles.desc}>{f.desc}</div>
            </div>
            {i < FEATURES.length - 1 && <div className={styles.sep} />}
          </div>
        ))}
      </div>
    </section>
  )
}
