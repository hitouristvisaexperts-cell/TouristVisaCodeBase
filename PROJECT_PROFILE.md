# ANARAV TECHNOLOGIES / PROJECT PROFILE
# TOURIST VISA EXPERTS | Project Profile

## TOURIST VISA EXPERTS
### End-to-End Visa Case Management & Client Onboarding Platform

---

### Project Overview
Tourist Visa Experts (TVE) is a centralized, full-stack visa case management and client onboarding platform designed to digitize and automate the tourist visa lifecycle. The platform streamlines client onboarding, secure document collection, an 11-stage internal Standard Operating Procedure (SOP) workflow, dual-verification payment processing, and real-time client status tracking across international travel destinations.

---

### Project Team & Professional Bios

**Ravi Kumar | Project Architect**  
Project architecture, data privacy governance, security standards, and technical direction.

**Pradeep Barigala | Full-Stack Developer**  
Full-stack developer focused on React and Node.js architecture, role-based portals, payment workflows, refund management, and platform reliability.

**Rohit | Developer**  
Software developer focused on secure document processing, automated background cron jobs, and third-party webhook integrations.

---

### Technology Stack

| Component | Technology |
| :--- | :--- |
| **Client & Marketing Website** | React.js, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **Admin & Client Portal** | React.js, Vite, Lucide Icons, Socket.io-client |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Cloud Storage & Security** | AWS S3 / Cloudflare R2, AES-256 Encryption, Pre-signed URLs |
| **Payments & Invoicing** | Razorpay (Dual Webhook Verification), Stripe |
| **Automation & Compliance** | Node-cron (DPDP 30-day auto-purge), Nodemailer, Socket.io |

---

### Core Modules
11-stage SOP workflow engine • Secure cloud document vault • DPDP Act 2023 compliance & auto-purge • Dual-verification payment & refund management • Real-time client tracking timeline • Abandoned checkout recovery & WhatsApp concierge • Multi-role access control (Admin, Manager, Team, Client) • Audit logs & internal escalation workflows

---

### Problem Statement

**Fragmented Visa Processing & Document Loss**  
Traditional visa consultancies manage sensitive client travel documents across fragmented email and WhatsApp threads. This leads to lost paperwork, untracked caseworker updates, missed consulate appointment windows, and human errors.

**Data Privacy & Statutory Compliance Risks (DPDP Act 2023)**  
Holding passports, financial records, and national IDs on local hard drives or unsecured servers exposes consultancies to severe statutory penalties under India's Digital Personal Data Protection (DPDP) Act 2023.

**High Checkout Drop-Offs & Payment Reconciliation Delays**  
Prospective travelers frequently abandon applications mid-checkout without automated follow-up. Manual payment verification between bank receipts and case files delays onboarding by days.

---

### Tourist Visa Experts Solution

**Structured 11-Stage SOP Case Lifecycle**  
The platform enforces a standardized 11-stage internal SOP workflow—from initial welcome and deep-dive consultation to document review, appointment scheduling, and post-approval handoff—ensuring complete accountability for every file.

**Encrypted Cloud Document Vault with DPDP Compliance**  
Replaced local storage with an enterprise S3/R2 encrypted cloud vault using 15-minute temporary pre-signed access URLs, UIDAI Aadhaar redaction warnings, and an automated 30-day statutory document auto-purge background cron.

**Dual-Verification Payments & Abandoned Lead Concierge**  
Integrates Razorpay and Stripe with browser redirection and server-to-server webhook verification (`payment.captured`, `order.paid`). Unfinished checkouts automatically capture lead details for rapid, 1-click WhatsApp concierge outreach.

---

### Current Client Usage
The platform is in active operation, managing multi-country visa applications (Schengen, UK, US, Canada, Australia) with zero data integrity issues, instant webhook payment reconciliations, and positive caseworker adoption across all active files.

---

### Business Impact
Significant reduction in case turnaround time, complete elimination of lost or misplaced documents, guaranteed compliance with national data privacy regulations, higher checkout conversion rates, and unified executive visibility into revenue, GMV, and refund KPIs.

---

### Business Use Cases and Customer Problems Solved

Tourist Visa Experts addresses real-world operational bottlenecks across visa consultancies, travel firms, and customer-facing case management teams.

| Business Use Case | Customer Problem | TVE Solution |
| :--- | :--- | :--- |
| **Client Onboarding & Intake** | High drop-off, manual back-and-forth communication, and missing preliminary travel details. | Frictionless digital onboarding, upfront travel intent capture, and automated instant case initialization. |
| **Document Vault & Security** | Unsecured email/chat exchanges, tampering risks, and lack of file access control. | AES-256 cloud encryption with 15-minute temporary pre-signed URLs and role-based view-only restrictions. |
| **Data Protection (DPDP Act 2023)** | Legal vulnerability and regulatory risks from indefinitely storing government identity proofs. | Built-in DPDP statutory compliance with automated 30-day document auto-purge and Aadhaar masking alerts. |
| **Case Lifecycle & SOP Tracking** | Disorganized spreadsheets, unassigned cases, and missed consulate appointment windows. | Standardized 11-stage SOP pipeline with a dedicated parallel appointment tracking module. |
| **Payments & Financial Tracking** | Disputed payments, manual receipt generation, and untracked client refunds. | Dual webhook payment verification, automated invoice generation, and refund KPI analytics. |
| **Lead Recovery & Sales Outreach** | Prospective clients abandoning the booking funnel without team awareness. | Background lead capture for dropped checkouts with 1-click WhatsApp concierge follow-up. |
| **Client Transparency & Trust** | Constant anxiety from applicants and endless repetitive status calls to caseworkers. | Dedicated client portal featuring a visual milestone progress tracker and real-time Socket.io notifications. |
| **Team Governance & Oversight** | Siloed staff performance, lack of accountability, and unmonitored stalled files. | Multi-tier RBAC (Admin, Manager, Team, Client), granular audit logging, and internal case escalations. |

---

### Expected Customer Value
Substantial reduction in manual administrative effort, 100% visibility into caseworker productivity, faster application turnaround times, complete regulatory peace of mind regarding data privacy, and a seamless digital experience that directly drives client referrals and repeat bookings.
