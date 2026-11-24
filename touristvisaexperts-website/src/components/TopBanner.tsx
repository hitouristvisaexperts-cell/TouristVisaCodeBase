import styles from './TopBanner.module.css'

export default function TopBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.item}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F97316"><path d="M13 2L4.09 12.97 12 12l-1 10 8.91-10.97L12 12l1-10z"/></svg>
          Fast &amp; Easy Process
        </span>
        <span className={styles.divider}>|</span>
        <span className={styles.item}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          100% Secure &amp; Confidential
        </span>
        <span className={styles.divider}>|</span>
        <span className={styles.item}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F97316"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Rated 4.9★ by Customers
        </span>
      </div>
      <div className={styles.right}>
        <span className={styles.item}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
          +91 98765 43210
        </span>
        <span className={styles.divider}>|</span>
        <span className={styles.item}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
          Dedicated Expert Support
        </span>
        <span className={styles.divider}>|</span>
        <span className={styles.item}>
          <span className={styles.flag}>🇬🇧</span>
          EN
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
    </div>
  )
}
