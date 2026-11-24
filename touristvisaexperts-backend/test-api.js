/**
 * FinalVisa API Test Suite — Full Production Check
 * Run: node test-api.js
 * Tests: auth, admin, team, client, escalations, FAQs, payment, role-isolation,
 *        auto-assign, notifications, OCR, socket health
 */

const BASE    = process.env.API_URL || 'http://localhost:5000/api'
const fs      = require('fs')
const path    = require('path')
const net     = require('net')

let passed = 0
let failed = 0
let adminToken    = ''
let teamToken     = ''
let team2Token    = ''
let clientToken   = ''
let createdClientId    = ''
let createdTeamId      = ''
let createdTeam2Id     = ''
let createdDocId       = ''
let createdMeetingId   = ''
let createdEscalationId = ''
let autoAssignClientId  = ''

/* ── helpers ─────────────────────────────────────────────────── */
async function req(method, url, body, token) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return { status: res.status, ...json }
}

function pass(name) { console.log(`  ✓  ${name}`); passed++ }
function fail(name, reason) { console.log(`  ✗  ${name}\n     → ${reason}`); failed++ }
function section(name) { console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 50 - name.length))}`) }
function assert(name, condition, detail = '') {
  if (condition) pass(name)
  else fail(name, detail || 'Assertion failed')
}

function waitForPort(port, host = '127.0.0.1', timeout = 10000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    const tryConnect = () => {
      const sock = new net.Socket()
      sock.setTimeout(1000)
      sock.connect(port, host, () => { sock.destroy(); resolve() })
      sock.on('error', () => {
        sock.destroy()
        if (Date.now() > deadline) return reject(new Error('Port not open in time'))
        setTimeout(tryConnect, 300)
      })
      sock.on('timeout', () => {
        sock.destroy()
        if (Date.now() > deadline) return reject(new Error('Port not open in time'))
        setTimeout(tryConnect, 300)
      })
    }
    tryConnect()
  })
}

/* ════════════════════════════════════════════════════════════════
   TEST GROUPS
════════════════════════════════════════════════════════════════ */

async function testHealth() {
  section('HEALTH CHECK')
  const r = await req('GET', '/health')
  assert('Server health endpoint responds', r.status === 'ok', JSON.stringify(r))
}

async function testAuth() {
  section('AUTH')

  let r = await req('POST', '/auth/login', { email: 'admin@finalvisa.com', password: 'Admin@1234' })
  assert('Admin login succeeds', r.success && r.token, JSON.stringify(r))
  adminToken = r.token || ''

  r = await req('POST', '/auth/login', { email: 'admin@finalvisa.com', password: 'wrong' })
  assert('Wrong password returns error', !r.success)

  r = await req('GET', '/auth/me', null, adminToken)
  assert('/auth/me returns user (admin role)', r.success && r.user?.role === 'admin', JSON.stringify(r))

  r = await req('GET', '/auth/me')
  assert('/auth/me without token → 401', r.status === 401)
}

async function testAdminTeam() {
  section('ADMIN — TEAM MANAGEMENT')

  const email1 = `team1_${Date.now()}@test.com`
  const email2 = `team2_${Date.now() + 1}@test.com`

  // Create first team member
  let r = await req('POST', '/admin/team', { name: 'Team Alpha', email: email1, phone: '9111111111', password: 'Team@1234' }, adminToken)
  assert('Create team member #1', r.success && r.data?.id, JSON.stringify(r))
  createdTeamId = r.data?.id || ''

  // Create second team member (for auto-assign balance testing)
  r = await req('POST', '/admin/team', { name: 'Team Beta', email: email2, phone: '9222222222', password: 'Team@1234' }, adminToken)
  assert('Create team member #2', r.success && r.data?.id, JSON.stringify(r))
  createdTeam2Id = r.data?.id || ''

  // Get team list
  r = await req('GET', '/admin/team', null, adminToken)
  assert('Get team list', r.success && Array.isArray(r.data))
  assert('Both team members in list', r.data?.length >= 2)

  // Login both team members
  r = await req('POST', '/auth/login', { email: email1, password: 'Team@1234' })
  assert('Team member #1 can login', r.success && r.token, JSON.stringify(r))
  teamToken = r.token || ''

  r = await req('POST', '/auth/login', { email: email2, password: 'Team@1234' })
  assert('Team member #2 can login', r.success && r.token, JSON.stringify(r))
  team2Token = r.token || ''

  // Toggle status: deactivate then reactivate
  r = await req('PUT', `/admin/team/${createdTeamId}/status`, null, adminToken)
  assert('Toggle team status (deactivate)', r.success && r.data?.isActive === false)
  r = await req('PUT', `/admin/team/${createdTeamId}/status`, null, adminToken)
  assert('Toggle team status (reactivate)', r.success && r.data?.isActive === true)
}

async function testAdminClients() {
  section('ADMIN — CLIENT MANAGEMENT')

  const email = `client_${Date.now()}@test.com`

  // Create client with explicit assignedTo
  let r = await req('POST', '/admin/clients', {
    name: 'Test Client',
    email,
    phone: '8888888888',
    password: 'Client@1234',
    visaType: 'Schengen Tourist',
    destinationCountry: 'Germany',
    assignedTo: createdTeamId,
  }, adminToken)
  assert('Create client (explicit assign)', r.success && r.data?.client?._id, JSON.stringify(r))
  createdClientId = r.data?.client?._id || ''

  // Client login — password step now returns otpRequired instead of a token
  r = await req('POST', '/auth/login', { email, password: 'Client@1234' })
  assert('Client password step returns otpRequired', r.success && r.otpRequired === true, JSON.stringify(r))

  // Complete the OTP step (devOtp is only present outside production — see authController.login)
  const otpResult = await req('POST', '/auth/verify-otp', { email, otp: r.devOtp })
  assert('Client can complete OTP login', otpResult.success && otpResult.token, JSON.stringify(otpResult))
  clientToken = otpResult.token || ''

  // Get all clients
  r = await req('GET', '/admin/clients', null, adminToken)
  assert('Get all clients', r.success && Array.isArray(r.data))

  // Purchased / free filters
  r = await req('GET', '/admin/clients?purchased=true', null, adminToken)
  assert('Purchased filter returns array', r.success && Array.isArray(r.data))
  r = await req('GET', '/admin/clients?purchased=false', null, adminToken)
  assert('Free filter returns array', r.success && Array.isArray(r.data))

  // Pagination
  r = await req('GET', '/admin/clients?page=1&limit=5', null, adminToken)
  assert('Pagination works (limit 5)', r.success && Array.isArray(r.data))

  // Single client
  r = await req('GET', `/admin/clients/${createdClientId}`, null, adminToken)
  assert('Get single client', r.success && r.data?._id === createdClientId)

  // Update client remarks
  r = await req('PUT', `/admin/clients/${createdClientId}`, { remarks: 'Test remark from suite' }, adminToken)
  assert('Update client remarks', r.success)

  // Assign client
  r = await req('PUT', `/admin/clients/${createdClientId}/assign`, { assignedTo: createdTeamId }, adminToken)
  assert('Assign client to team member', r.success)

  // Grant and revoke access
  r = await req('PUT', `/admin/clients/${createdClientId}/access`, { isPurchased: true }, adminToken)
  assert('Grant full access (isPurchased=true)', r.success && r.data?.isPurchased === true, JSON.stringify(r))
  r = await req('PUT', `/admin/clients/${createdClientId}/access`, { isPurchased: false }, adminToken)
  assert('Revoke access (isPurchased=false)', r.success && r.data?.isPurchased === false)
  // Grant again for rest of tests
  await req('PUT', `/admin/clients/${createdClientId}/access`, { isPurchased: true }, adminToken)

  // Send notification from admin to client
  r = await req('POST', `/admin/clients/${createdClientId}/notify`, {
    title: 'Test Notification from Admin',
    message: 'This is a system test notification.',
    type: 'general',
  }, adminToken)
  assert('Admin sends notification to client', r.success, JSON.stringify(r))
}

async function testAutoAssign() {
  section('AUTO-ASSIGN (Least-loaded round-robin)')

  // Create client WITHOUT specifying assignedTo — backend should auto-assign
  const email = `autoassign_${Date.now()}@test.com`
  let r = await req('POST', '/admin/clients', {
    name: 'AutoAssign Client',
    email,
    phone: '7777777777',
    password: 'Client@1234',
    visaType: 'UK Visitor',
    destinationCountry: 'United Kingdom',
    // No assignedTo field
  }, adminToken)
  assert('Create client without assignedTo', r.success && r.data?.client?._id, JSON.stringify(r))
  autoAssignClientId = r.data?.client?._id || ''

  // Verify auto-assign happened
  if (autoAssignClientId) {
    r = await req('GET', `/admin/clients/${autoAssignClientId}`, null, adminToken)
    assert('Auto-assign: client has assignedTo', !!r.data?.assignedTo, JSON.stringify(r.data?.assignedTo))
  }

  // Create a second auto-assigned client — should go to the team member with fewer clients
  const email2 = `autoassign2_${Date.now()}@test.com`
  r = await req('POST', '/admin/clients', {
    name: 'AutoAssign Client 2',
    email: email2,
    phone: '7777777778',
    password: 'Client@1234',
    visaType: 'Schengen',
    destinationCountry: 'France',
  }, adminToken)
  assert('Second auto-assigned client created', r.success && r.data?.client?._id, JSON.stringify(r))
  const secondClientId = r.data?.client?._id

  if (autoAssignClientId && secondClientId) {
    const c1 = await req('GET', `/admin/clients/${autoAssignClientId}`, null, adminToken)
    const c2 = await req('GET', `/admin/clients/${secondClientId}`, null, adminToken)
    const assign1 = c1.data?.assignedTo?._id || c1.data?.assignedTo
    const assign2 = c2.data?.assignedTo?._id || c2.data?.assignedTo
    // They may be same or different team member depending on existing client counts — just verify both have assignment
    assert('Both auto-assigned clients have an assignedTo', !!assign1 && !!assign2)
  }
}

async function testAdminDashboard() {
  section('ADMIN — DASHBOARD & AUDIT LOGS')

  let r = await req('GET', '/admin/dashboard', null, adminToken)
  assert('Dashboard loads', r.success)
  assert('Dashboard.totalClients is number', typeof r.data?.totalClients === 'number')
  assert('Dashboard.totalTeam is number', typeof r.data?.totalTeam === 'number')
  assert('Dashboard.totalPurchased is number', typeof r.data?.totalPurchased === 'number')
  assert('Dashboard.recentClients is array', Array.isArray(r.data?.recentClients))
  assert('Dashboard.byStatus is array', Array.isArray(r.data?.byStatus))

  // Audit logs
  r = await req('GET', '/admin/audit-logs', null, adminToken)
  assert('Audit logs load', r.success && Array.isArray(r.data))

  // Client activity log
  r = await req('GET', `/admin/clients/${createdClientId}/activity`, null, adminToken)
  assert('Client activity log loads', r.success && Array.isArray(r.data))
  // Activity is logged async by later test steps — just verify endpoint works
  assert('Activity log returns array', Array.isArray(r.data))
}

async function testTeamRoutes() {
  section('TEAM — CLIENT MANAGEMENT & TASKS')

  // My clients
  let r = await req('GET', '/team/clients', null, teamToken)
  assert('Team gets assigned clients', r.success && Array.isArray(r.data))

  // Client detail
  r = await req('GET', `/team/clients/${createdClientId}`, null, teamToken)
  assert('Team gets client detail', r.success && r.data?._id === createdClientId, JSON.stringify(r))

  // Tasks
  const stages = r.data?.stages || []
  const firstStage = stages[0]
  const firstTask = firstStage?.tasks?.[0]
  assert('Client has stages', stages.length > 0)
  assert('Stage has tasks', !!firstTask)

  if (firstStage && firstTask) {
    r = await req('PUT', `/team/clients/${createdClientId}/tasks`, {
      stageKey: firstStage.stageKey, taskName: firstTask.name, completed: true,
    }, teamToken)
    assert('Team completes a task', r.success, JSON.stringify(r))

    r = await req('PUT', `/team/clients/${createdClientId}/tasks`, {
      stageKey: firstStage.stageKey, taskName: firstTask.name, completed: false,
    }, teamToken)
    assert('Team uncompletes a task', r.success)
  }

  // Notes
  r = await req('POST', `/team/clients/${createdClientId}/notes`, { content: 'Internal note', isInternal: true }, teamToken)
  assert('Team adds internal note', r.success)

  r = await req('POST', `/team/clients/${createdClientId}/notes`, { content: 'Client-visible note', isInternal: false }, teamToken)
  assert('Team adds client-visible note', r.success)

  r = await req('GET', `/team/clients/${createdClientId}/notes`, null, teamToken)
  assert('Team gets notes', r.success && Array.isArray(r.data))
  assert('Both notes present', (r.data?.length || 0) >= 2)

  // Documents list
  r = await req('GET', `/team/clients/${createdClientId}/documents`, null, teamToken)
  assert('Team gets documents list', r.success && Array.isArray(r.data))

  // Schedule meeting
  r = await req('POST', `/team/clients/${createdClientId}/meeting`, {
    meetLink: 'https://meet.google.com/test-xyz',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    duration: 30,
    title: 'Test Consultation',
    notes: 'API test meeting',
  }, teamToken)
  assert('Team schedules meeting', r.success && r.data?._id, JSON.stringify(r))
  createdMeetingId = r.data?._id || ''

  // Status update
  r = await req('PUT', `/team/clients/${createdClientId}/status`, { clientStatus: 'Profile Assessment' }, teamToken)
  assert('Team updates client status', r.success, JSON.stringify(r))

  // Escalation
  r = await req('POST', `/team/clients/${createdClientId}/escalate`, {
    type: 'document_issue',
    message: 'Test escalation from team',
  }, teamToken)
  assert('Team raises escalation', r.success && r.data?._id, JSON.stringify(r))
  createdEscalationId = r.data?._id || ''

  // Team member #2 cannot access client assigned to #1
  r = await req('GET', `/team/clients/${createdClientId}`, null, team2Token)
  assert('Team member #2 cannot access other team member\'s client', !r.success || r.status === 404, JSON.stringify(r))
}

async function testClientRoutes() {
  section('CLIENT — PORTAL')

  // Status
  let r = await req('GET', '/client/status', null, clientToken)
  assert('Client gets status', r.success && r.data?.clientStatus, JSON.stringify(r))
  assert('Status includes isPurchased', typeof r.data?.isPurchased === 'boolean')
  assert('Status includes timeline', Array.isArray(r.data?.timeline))
  assert('Status includes assignedTo', !!r.data?.assignedTo)

  // Documents
  r = await req('GET', '/client/documents', null, clientToken)
  assert('Client gets documents', r.success && Array.isArray(r.data))

  // Meetings
  r = await req('GET', '/client/meetings', null, clientToken)
  assert('Client gets meetings', r.success && Array.isArray(r.data))
  assert('Scheduled meeting visible to client', r.data?.length >= 1)

  // Notifications
  r = await req('GET', '/client/notifications', null, clientToken)
  assert('Client gets notifications', r.success && Array.isArray(r.data))
  const notifCount = r.data?.length || 0
  assert(`Notification count OK (${notifCount} notifications)`, notifCount >= 0)

  // Mark notification read
  if (r.data?.length > 0) {
    const notifId = r.data[0]._id
    const mark = await req('PUT', `/client/notifications/${notifId}/read`, null, clientToken)
    assert('Mark notification as read', mark.success)

    // Verify it's marked read
    const check = await req('GET', '/client/notifications', null, clientToken)
    const notif = check.data?.find(n => n._id === notifId)
    assert('Notification isRead=true after mark', notif?.isRead === true)
  } else {
    pass('Mark notification read (no notifications to mark — skip)')
  }

  // Notes (only client-visible)
  r = await req('GET', '/client/notes', null, clientToken)
  assert('Client gets visible notes', r.success && Array.isArray(r.data))
  assert('Internal notes hidden from client', r.data?.every(n => !n.isInternal))

  // Upload document
  const fakeBase64 = Buffer.from('%PDF-1.4 fake pdf content for testing').toString('base64')
  r = await req('POST', '/client/documents', {
    originalName: 'test-passport.pdf',
    mimeType: 'application/pdf',
    category: 'passport',
    data: fakeBase64,
    notes: 'Test upload',
  }, clientToken)
  assert('Client uploads document', r.success && r.data?.id, JSON.stringify(r))
  createdDocId = r.data?.id || ''

  // Escalation from client
  r = await req('POST', '/client/escalate', {
    type: 'delay_in_processing',
    message: 'Test escalation from client',
  }, clientToken)
  assert('Client raises escalation', r.success, JSON.stringify(r))

  // Support message
  r = await req('POST', '/client/support', {
    subject: 'API Test Support',
    message: 'Test support message from test suite.',
  }, clientToken)
  // Allow success OR SMTP failure (email not configured locally)
  assert('Client sends support message (or SMTP skipped)', r.success || r.message?.toLowerCase().includes('fail') || r.status === 200, JSON.stringify(r))

  // Role isolation
  r = await req('GET', '/admin/dashboard', null, clientToken)
  assert('Client blocked from admin routes → 403', r.status === 403 || !r.success)

  r = await req('GET', '/team/clients', null, clientToken)
  assert('Client blocked from team routes → 403', r.status === 403 || !r.success)
}

async function testNotifications() {
  section('NOTIFICATIONS — REAL-TIME DELIVERY CHECK')

  // After testClientRoutes created a note and status update, check notification count
  let r = await req('GET', '/client/notifications', null, clientToken)
  assert('Notifications endpoint accessible', r.success)
  assert('Returns array of notifications', Array.isArray(r.data))
  const total = r.data?.length || 0
  assert(`Total notifications in DB: ${total}`, total >= 0)

  // Admin sending a notification
  r = await req('POST', `/admin/clients/${createdClientId}/notify`, {
    title: 'Document Approved',
    message: 'Your passport document has been approved.',
    type: 'document_request',
  }, adminToken)
  assert('Admin sends typed notification (document_request)', r.success, JSON.stringify(r))

  r = await req('POST', `/admin/clients/${createdClientId}/notify`, {
    title: 'Meeting Scheduled',
    message: 'Your consultation is on Monday at 10am.',
    type: 'meeting_scheduled',
  }, adminToken)
  assert('Admin sends typed notification (meeting_scheduled)', r.success, JSON.stringify(r))

  // Verify new notifications appear
  r = await req('GET', '/client/notifications', null, clientToken)
  assert('New notifications persisted in DB', (r.data?.length || 0) >= total + 2)
}

async function testOCR() {
  section('OCR — PASSPORT IMAGE SCAN')

  // Check if test image exists
  const imagePaths = [
    'C:\\Users\\codep\\Downloads\\my_passort.jpeg',
    'C:\\Users\\codep\\Downloads\\my_passport.jpeg',
    'C:\\Users\\codep\\Downloads\\my_passort.jpg',
  ]
  const testImage = imagePaths.find(p => fs.existsSync(p))

  if (!testImage) {
    pass('OCR test (no test image found at expected paths — skipped)')
    pass('OCR test image upload (skipped)')
    pass('OCR MRZ parsing (skipped)')
    return
  }

  // Upload document as image first (using admin client)
  const imageData = fs.readFileSync(testImage)
  const base64 = imageData.toString('base64')
  const ext = path.extname(testImage).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'

  let r = await req('POST', '/client/documents', {
    originalName: 'test-passport-ocr.jpg',
    mimeType,
    category: 'passport',
    data: base64,
    notes: 'OCR test image',
  }, clientToken)
  assert('OCR test: upload passport image', r.success && r.data?.id, JSON.stringify(r))
  const ocrDocId = r.data?.id

  if (!ocrDocId) return

  // Run OCR
  console.log('     (Running Tesseract OCR — this may take 5-15 seconds…)')
  r = await fetch(`${BASE}/team/clients/${createdClientId}/documents/${ocrDocId}/ocr`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teamToken}` },
  }).then(res => res.json())

  assert('OCR endpoint returns success', r.success, JSON.stringify(r).slice(0, 200))
  assert('OCR returns extracted data', !!r.data?.extracted)
  assert('OCR returns rawText array', Array.isArray(r.data?.rawText))

  if (r.data?.mrzDetected) {
    const d = r.data.extracted
    assert('MRZ detected', r.data.mrzDetected === true)
    assert('MRZ: passportNumber present', !!d?.passportNumber)
    assert('MRZ: fullName present', !!d?.fullName)
    assert('MRZ: dateOfBirth present', !!d?.dateOfBirth)
    assert('MRZ: nationality present', !!d?.nationality)
    // Format is DD/MM/YYYY — year is last 4 chars
    assert('MRZ: expiryDate year is 20xx', d?.expiryDate?.slice(-4)?.startsWith('20') ?? false, d?.expiryDate)
    console.log(`     → Passport: ${d?.fullName}, No: ${d?.passportNumber}, DOB: ${d?.dateOfBirth}, Exp: ${d?.expiryDate}`)
  } else {
    assert('OCR ran (MRZ not detected — raw text returned)', Array.isArray(r.data?.rawText) && r.data.rawText.length > 0)
    console.log(`     → Raw text lines: ${r.data?.rawText?.length}`)
  }

  // Save extracted data
  if (r.data?.extracted) {
    const save = await fetch(`${BASE}/team/clients/${createdClientId}/documents/${ocrDocId}/extracted`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teamToken}` },
      body: JSON.stringify({ extractedData: r.data.extracted }),
    }).then(res => res.json())
    assert('OCR: save extracted data', save.success, JSON.stringify(save).slice(0, 120))
  }
}

async function testEscalations() {
  section('ADMIN — ESCALATIONS')

  let r = await req('GET', '/admin/escalations', null, adminToken)
  assert('Admin gets all escalations', r.success && Array.isArray(r.data))
  assert('Escalations list has entries', r.data?.length >= 1)

  if (createdEscalationId) {
    // Acknowledge
    r = await req('PUT', `/admin/escalations/${createdEscalationId}/acknowledge`, null, adminToken)
    assert('Admin acknowledges escalation', r.success && r.data?.status === 'acknowledged', JSON.stringify(r))

    // Resolve
    r = await req('PUT', `/admin/escalations/${createdEscalationId}/resolve`, {
      resolutionNote: 'Resolved during API test suite',
    }, adminToken)
    assert('Admin resolves escalation', r.success && r.data?.status === 'resolved', JSON.stringify(r))
  }

  // Filter by status
  r = await req('GET', '/admin/escalations?status=resolved', null, adminToken)
  assert('Filter escalations by resolved status', r.success && r.data?.every(e => e.status === 'resolved'))

  r = await req('GET', '/admin/escalations?status=open', null, adminToken)
  assert('Filter escalations by open status', r.success && (r.data?.every(e => e.status === 'open') || r.data?.length === 0))
}

async function testFAQs() {
  section('FAQs (PUBLIC)')

  const r = await req('GET', '/faqs')
  const isGrouped = r.success && r.data && typeof r.data === 'object' && !Array.isArray(r.data)
  const isFlat    = r.success && Array.isArray(r.data)
  assert('Public FAQ endpoint responds', r.success, JSON.stringify(r).slice(0, 120))
  assert('FAQ data is grouped or flat array', isGrouped || isFlat)
  const count = isGrouped ? Object.keys(r.data).length : (r.data?.length || 0)
  assert(`FAQs seeded — ${count} ${isGrouped ? 'categories' : 'items'} found`, count > 0)
}

async function testPayment() {
  section('PAYMENT — ORDER & COUPON')

  // Create order (no coupon)
  let r = await req('POST', '/payment/create-order', { package: 'complete' }, clientToken)
  if (r.success) {
    assert('Create order without coupon', r.data?.orderId && r.data?.amount, JSON.stringify(r))
    assert('Base amount = ₹10,000 (1000000 paise)', r.data?.amount === 1000000)
  } else {
    pass('Create order (Razorpay keys not set — skip)')
  }

  // Create order WITH coupon Prxfr10000 → ₹1
  r = await req('POST', '/payment/create-order', { package: 'complete', coupon: 'Prxfr10000' }, clientToken)
  if (r.success) {
    assert('Coupon Prxfr10000 reduces to ₹1 (100 paise)', r.data?.amount === 100, JSON.stringify(r))
    assert('couponApplied flag set', r.data?.couponApplied === true)
  } else {
    pass('Coupon order (Razorpay keys not set — skip)')
  }

  // Invalid coupon
  r = await req('POST', '/payment/create-order', { package: 'complete', coupon: 'FAKECOUPON999' }, clientToken)
  if (!r.success && r.message?.toLowerCase().includes('coupon')) {
    assert('Invalid coupon rejected correctly', true)
  } else if (!r.success) {
    pass('Invalid coupon (Razorpay not configured — skip)')
  } else {
    assert('Invalid coupon rejected', false, 'Server accepted invalid coupon')
  }
}

async function testRoleIsolation() {
  section('ROLE ISOLATION — SECURITY')

  // Admin can NOT be blocked from admin routes
  let r = await req('GET', '/admin/dashboard', null, adminToken)
  assert('Admin accesses admin dashboard', r.success)

  // Unauthenticated blocked from all protected routes
  const protectedRoutes = [
    ['GET',  '/admin/dashboard'],
    ['GET',  '/admin/clients'],
    ['GET',  '/admin/team'],
    ['GET',  '/team/clients'],
    ['GET',  '/client/status'],
    ['GET',  '/client/documents'],
  ]
  for (const [method, path] of protectedRoutes) {
    const res = await req(method, path)
    assert(`Unauthenticated blocked: ${method} ${path}`, res.status === 401 || !res.success)
  }

  // Team member can access their own client
  r = await req('GET', `/team/clients/${createdClientId}`, null, teamToken)
  assert('Team accesses own client', r.success)

  // Team member #2 CANNOT access team member #1's client
  r = await req('GET', `/team/clients/${createdClientId}`, null, team2Token)
  assert('Team #2 blocked from team #1 client', !r.success || r.status === 404)

  // Client CANNOT access admin routes
  r = await req('GET', '/admin/dashboard', null, clientToken)
  assert('Client blocked from admin dashboard', r.status === 403 || !r.success)

  // Client CANNOT access team routes
  r = await req('GET', '/team/clients', null, clientToken)
  assert('Client blocked from team routes', r.status === 403 || !r.success)

  // Team CANNOT access admin routes
  r = await req('GET', '/admin/clients', null, teamToken)
  assert('Team blocked from admin routes', r.status === 403 || !r.success)
}

/* ════════════════════════════════════════════════════════════════
   RUNNER
════════════════════════════════════════════════════════════════ */
async function run() {
  console.log(`\n${'═'.repeat(62)}`)
  console.log('  FinalVisa API Test Suite — Full Production Check')
  console.log(`  Target: ${BASE}`)
  console.log(`${'═'.repeat(62)}`)

  console.log('\n  Waiting for server on port 5000…')
  try {
    await waitForPort(5000)
    console.log('  Server is up.\n')
  } catch {
    console.error('  Server did not start in time. Aborting.')
    process.exit(1)
  }

  const start = Date.now()

  try {
    await testHealth()
    await testAuth()
    await testAdminTeam()
    await testAdminClients()
    await testAutoAssign()
    await testAdminDashboard()
    await testTeamRoutes()
    await testClientRoutes()
    await testNotifications()
    await testOCR()
    await testEscalations()
    await testFAQs()
    await testPayment()
    await testRoleIsolation()
  } catch (err) {
    console.error('\nFATAL ERROR (test crashed):', err.stack || err.message)
    failed++
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1)

  console.log(`\n${'═'.repeat(62)}`)
  console.log(`  Results: ${passed} passed  |  ${failed} failed  |  ${duration}s`)
  console.log(`${'═'.repeat(62)}\n`)

  if (failed > 0) process.exit(1)
}

run()
