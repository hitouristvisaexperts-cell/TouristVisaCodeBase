// Shared look for the Login and Register pages: soft peach wave background,
// brand column on the left (logo, heading, features) and a white card on the right.

const ORANGE = '#F97316'

const ICONS = {
  passport: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><circle cx="12" cy="10" r="3.2" /><path d="M8.8 10h6.4M12 6.8c-1 1-1 5.4 0 6.4M12 6.8c1 1 1 5.4 0 6.4" /><path d="M9 17h6" /></>,
  shield: <><path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.3 7.5 10 4.3-1.7 7.5-5.4 7.5-10v-6z" /><path d="m8.8 12 2.2 2.2 4.4-4.4" /></>,
  chat: <><path d="M20.5 11.5a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.5-4.6a8.4 8.4 0 1 1 15.5-4.4z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" /></>,
}
const FEATURES = [
  ['passport', 'Expert visa guidance'],
  ['shield', 'Secure document management'],
  ['chat', 'Direct consultant communication'],
]

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      {/* ── Brand column ── */}
      <section className="auth-brand">
        <img src="/logo.png" alt="Tourist Visa Experts" className="auth-logo" />

        <div className="auth-copy">
          <span className="auth-badge"><span className="auth-dot" />Trusted Visa Consultancy</span>
          <h1 className="auth-title">
            Your visa journey,<br />
            <span style={{ color: ORANGE }}>expertly guided.</span>
          </h1>
          <p className="auth-lead">
            Plan, apply, and track your visa with expert support, secure document management,
            and real-time updates — all in one place.
          </p>
          <ul className="auth-features">
            {FEATURES.map(([icon, text]) => (
              <li key={text}>
                <span className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[icon]}</svg>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Card ── */}
      <section className="auth-side">
        <div className="auth-card">{children}</div>
      </section>

      <style>{`
        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center; gap: 48px;
          padding: 48px clamp(20px, 6vw, 110px);
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #fff url('/auth-bg.jpg') center / cover no-repeat fixed;
        }
        /* stays in view (vertically centred) while the longer sign-up card scrolls */
        .auth-brand { flex: 1 1 0; max-width: 620px; align-self: flex-start; position: sticky; top: max(40px, calc(50vh - 330px)); }
        .auth-logo { height: clamp(64px, 7vw, 104px); width: auto; display: block; object-fit: contain; }
        .auth-copy { margin-top: clamp(28px, 4vw, 52px); }
        .auth-badge {
          display: inline-flex; align-items: center; gap: 9px; padding: 8px 18px; border-radius: 99px;
          background: #fde7d6; color: #0A1628; font-size: 15px; font-weight: 700;
        }
        .auth-dot { width: 9px; height: 9px; border-radius: 50%; background: ${ORANGE}; }
        .auth-title {
          margin: 26px 0 18px; color: #0A1628; font-weight: 800; letter-spacing: -0.035em; line-height: 1.06;
          font-size: clamp(36px, 4.2vw, 62px);
        }
        .auth-lead { margin: 0; max-width: 560px; color: #64748b; font-size: clamp(15.5px, 1.25vw, 19px); line-height: 1.65; }
        .auth-features { list-style: none; padding: 0; margin: 30px 0 0; display: flex; flex-direction: column; gap: 14px; }
        .auth-features li { display: flex; align-items: center; gap: 16px; color: #0A1628; font-size: clamp(15px, 1.2vw, 18px); font-weight: 500; }
        .auth-feature-icon {
          width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; background: #fde7d6;
        }
        .auth-side { flex: 0 1 600px; display: flex; justify-content: center; }
        .auth-card {
          width: 100%; max-width: 600px; background: #fff; border-radius: 30px;
          padding: clamp(34px, 3.4vw, 52px) clamp(24px, 3.4vw, 56px) clamp(28px, 2.6vw, 40px);
          border: 1px solid #f1ece6;
          box-shadow: 0 30px 70px -24px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.04);
        }
        .auth-mobile-logo { display: none; justify-content: center; margin-bottom: 24px; }
        @media (max-width: 960px) {
          .auth-page { flex-direction: column; gap: 22px; padding: 24px 16px 32px; background-attachment: scroll; }
          .auth-brand { max-width: 600px; width: 100%; display: flex; justify-content: center; position: static; align-self: center; }
          .auth-logo { height: 58px; }
          .auth-copy { display: none; }
          .auth-side { width: 100%; flex: none; }
        }
        @media (max-width: 480px) {
          .auth-card { border-radius: 22px; padding: 28px 18px 24px; }
        }
      `}</style>
    </div>
  )
}
