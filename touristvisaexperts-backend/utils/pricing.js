// Single source of truth for prices and coupons on the server.
// All prices are INR and INCLUDE 18% GST. Admins can override them in the portal
// (Admin → Pricing → Prices, stored in Settings key "prices"); these are the defaults.
const Settings = require('../models/Settings');

const DEFAULT_PRICES = {
  visaUSA: 25000,            // first-time visa assistance, USA
  visaEurope: 15000,         // first-time, Schengen / Europe
  visaOther: 10000,          // first-time, UK and every other country
  reapplication: 15000,      // visa rejected before — Specialist Re-application (per person)
  reapplicationGuarantee: 25000, // visa rejected before — Guarantee Re-application with service-fee refund (per person)
  flightPerPassenger: 999,   // embassy-ready flight reservation
  consultation: 999,         // 1-on-1 consultation session
  addMember: 10000,          // adding a co-applicant to an existing case (portal)
};

// Schengen countries offered for re-application (client list, Oct 2026)
const SCHENGEN_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
  'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
];
const EUROPE_DESTINATIONS = new Set([...SCHENGEN_COUNTRIES, 'Schengen', 'Europe', 'Cyprus', 'Ireland']);
const REAPPLICATION_COUNTRIES = new Set([...SCHENGEN_COUNTRIES, 'Schengen', 'UK', 'Australia', 'New Zealand', 'USA', 'Canada']);

let cache = { at: 0, prices: null };
const CACHE_MS = 30 * 1000;

function sanitizePrices(input) {
  const out = { ...DEFAULT_PRICES };
  if (input && typeof input === 'object') {
    for (const key of Object.keys(DEFAULT_PRICES)) {
      const v = Number(input[key]);
      if (Number.isFinite(v) && v >= 1 && v <= 1000000) out[key] = Math.round(v);
    }
  }
  return out;
}

async function getPrices() {
  if (cache.prices && Date.now() - cache.at < CACHE_MS) return cache.prices;
  let saved = null;
  try {
    const doc = await Settings.findOne({ key: 'prices' }).lean();
    if (doc?.value) saved = JSON.parse(doc.value);
  } catch { /* fall back to defaults */ }
  cache = { at: Date.now(), prices: sanitizePrices(saved) };
  return cache.prices;
}

function invalidatePrices() { cache = { at: 0, prices: null }; }

function firstTimeVisaPrice(prices, destinationCountry) {
  if (destinationCountry === 'USA') return prices.visaUSA;
  if (EUROPE_DESTINATIONS.has(destinationCountry)) return prices.visaEurope;
  return prices.visaOther;
}

/** Per-person visa price in rupees for a destination + rejected-before answer (+ re-application plan). */
function visaPerPerson(prices, { destinationCountry, previouslyRejected, plan }) {
  if (!previouslyRejected) return firstTimeVisaPrice(prices, destinationCountry);
  return plan === 'guarantee' ? prices.reapplicationGuarantee : prices.reapplication;
}

const isReapplicationCountry = (c) => REAPPLICATION_COUNTRIES.has(c);

// ─── Coupons ────────────────────────────────────────────────────────────────
// Admin coupons live in Settings key "coupons" (portal → Pricing → Coupons):
//   [{ code, discountType: 'percent' | 'flat_inr', discountValue, active, services }]
// `services` says where a code works — visa packages, the ₹999 consultation and/or flight
// tickets — so a code made for one service is refused by the others. Coupons saved before
// this existed count as visa-only. Codes are matched case-insensitively.
const COUPON_SERVICES = ['visa', 'consultation', 'flight'];
const LEGACY_COUPONS = { PRXFR10000: { type: 'nominalFirstApplicant', services: ['visa'] } };
const MIN_CHARGE_PAISE = 100; // Razorpay minimum order amount is ₹1

function normalizeCode(code) { return String(code || '').trim().toUpperCase(); }

function sanitizeCoupons(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const code = normalizeCode(c?.code).replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
    if (!code || seen.has(code)) continue;
    // Only ₹ coupons exist now: percent, flat ₹, or "full" (charges the ₹1 minimum — for test payments).
    // Old £/$ coupon types are dropped rather than misread as a percentage.
    let type = c?.discountType;
    let value = Number(c?.discountValue);
    if (type === 'full') { type = 'percent'; value = 100; }
    if (type !== 'percent' && type !== 'flat_inr') continue;
    if (!Number.isFinite(value) || value <= 0) continue;
    value = type === 'percent' ? Math.min(100, Math.round(value * 100) / 100) : Math.min(1000000, Math.round(value));
    const services = Array.isArray(c?.services) ? COUPON_SERVICES.filter(s => c.services.includes(s)) : [];
    seen.add(code);
    out.push({ code, discountType: type, discountValue: value, active: c?.active !== false, services: services.length ? services : ['visa'] });
  }
  return out;
}

/** The active coupon for `code` that works on `service` ('visa' | 'consultation' | 'flight'), or null. */
async function findCoupon(code, service = 'visa') {
  const c = normalizeCode(code);
  if (!c) return null;
  if (LEGACY_COUPONS[c]) return LEGACY_COUPONS[c].services.includes(service) ? { code: c, type: LEGACY_COUPONS[c].type } : null;
  let list = [];
  try {
    const doc = await Settings.findOne({ key: 'coupons' }).lean();
    list = sanitizeCoupons(JSON.parse(doc?.value || '[]'));
  } catch { list = []; }
  const m = list.find(x => x.active && x.code === c && x.services.includes(service));
  if (!m) return null;
  return { code: c, type: m.discountType, value: m.discountValue };
}

/** Total in paise after a coupon. Never below ₹1 and never above the full price. */
function applyCoupon(coupon, perPersonPaise, applicants = 1) {
  const full = perPersonPaise * applicants;
  if (!coupon) return full;
  let total = full;
  if (coupon.type === 'nominalFirstApplicant') total = MIN_CHARGE_PAISE + perPersonPaise * (applicants - 1);
  else if (coupon.type === 'percent') total = Math.round(full * (100 - coupon.value) / 100);
  else if (coupon.type === 'flat_inr') total = full - Math.round(coupon.value * 100);
  return Math.max(MIN_CHARGE_PAISE, Math.min(full, total));
}

const clampApplicants = (n) => Math.max(1, Math.min(20, parseInt(n, 10) || 1));

module.exports = {
  DEFAULT_PRICES, getPrices, invalidatePrices, sanitizePrices,
  firstTimeVisaPrice, visaPerPerson, isReapplicationCountry, REAPPLICATION_COUNTRIES,
  findCoupon, applyCoupon, sanitizeCoupons, clampApplicants, MIN_CHARGE_PAISE, COUPON_SERVICES,
};
