# ✈️ Tourist Visa Experts — Unified Monorepo

Welcome to the unified full-stack codebase for **Tourist Visa Experts**. This repository consolidates the entire platform (public marketing website, client & admin portal, and backend API) into a single, cohesive repository for rapid development and AI-assisted engineering.

---

## 📁 Repository Structure

```text
.
├── touristvisaexperts-backend/       # Node.js / Express API, MongoDB, S3/R2 Storage, Razorpay Webhooks
├── touristvisaexperts-portal/        # React + Vite Admin & Client Portal (Tailwind CSS)
├── touristvisaexperts-website/       # React + Vite Marketing & Checkout Website
├── package.json                      # Root workspace scripts
├── .gitignore                        # Global ignore configuration
└── README.md                         # Monorepo architecture & setup guide
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
You can install dependencies for all three projects with one command from the repository root:
```bash
npm run install:all
```

### 2. Configure Environment Files
Create `.env` files in each project by copying the provided `.env.example`:
* **Backend:** `cp touristvisaexperts-backend/.env.example touristvisaexperts-backend/.env`
* **Portal:** `cp touristvisaexperts-portal/.env.example touristvisaexperts-portal/.env` (or configure `VITE_API_URL=http://localhost:5000/api`)
* **Website:** `cp touristvisaexperts-website/.env.example touristvisaexperts-website/.env` (or configure `VITE_API_URL=http://localhost:5000/api`)

### 3. Run Development Servers
From the root directory:
```bash
# Run Backend API (Port 5000)
npm run dev:backend

# Run Client & Admin Portal (Port 5173)
npm run dev:portal

# Run Public Marketing Website (Port 5174)
npm run dev:website
```

---

## ☁️ Production Deployment Guide

Deploying from this monorepo is seamless. Both Railway and Vercel natively support monorepos using their **Root Directory** setting:

### 1. Backend API (`touristvisaexperts-backend`) $\rightarrow$ Railway
1. In [Railway](https://railway.app), create a new project and connect this repository.
2. Under **Service Settings** $\rightarrow$ **Source**:
   * **Root Directory:** Set to `touristvisaexperts-backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
3. Add production environment variables (`MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `S3_BUCKET`, etc.).
4. Attach your custom domain: `api.touristvisaexperts.com`.

### 2. Marketing Website (`touristvisaexperts-website`) $\rightarrow$ Vercel
1. In [Vercel](https://vercel.com), import this repository.
2. Under **Project Settings** $\rightarrow$ **General**:
   * **Root Directory:** Set to `touristvisaexperts-website`
   * **Framework Preset:** Vite
3. Set environment variable: `VITE_API_URL=https://api.touristvisaexperts.com/api`
4. Attach custom domain: `touristvisaexperts.com`.

### 3. Admin & Client Portal (`touristvisaexperts-portal`) $\rightarrow$ Vercel
1. In [Vercel](https://vercel.com), add a second project from this same repository.
2. Under **Project Settings** $\rightarrow$ **General**:
   * **Root Directory:** Set to `touristvisaexperts-portal`
   * **Framework Preset:** Vite
3. Set environment variables:
   * `VITE_API_URL=https://api.touristvisaexperts.com/api`
   * `VITE_SOCKET_URL=https://api.touristvisaexperts.com`
   * `VITE_MARKETING_URL=https://touristvisaexperts.com`
   * `VITE_PORTAL_URL=https://portal.touristvisaexperts.com`
4. Attach custom domain: `portal.touristvisaexperts.com`.

---

## 🛡️ Key Platform Capabilities
* **Cloud Storage (S3 / R2):** Replaced insecure local `/uploads` writes with AES-256 cloud encryption and 15-minute temporary pre-signed URLs.
* **Dual Razorpay Verification:** Browser redirect verification + server-to-server webhook verification (`payment.captured`, `order.paid`).
* **DPDP Act 2023 Compliance:** Statutory 30-day document auto-purge cron, UIDAI Aadhaar warnings, and purpose-bound encryption.
* **Executive Admin Dashboard:** Real-time GMV revenue analytics, 11-stage SOP pipeline funnel, and country distributions.
* **Abandoned Checkout Recovery:** Background lead capture with 1-click WhatsApp concierge outreach.
* **Client Trust & Onboarding:** First-login onboarding card, DPDP privacy guarantee banner, and 1-click WhatsApp consultant floating button.
