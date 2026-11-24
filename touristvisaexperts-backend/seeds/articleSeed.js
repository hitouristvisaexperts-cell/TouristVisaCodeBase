/**
 * Article Seed Script
 * Seeds 4 full blog articles into the database.
 * Usage: node seeds/articleSeed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Article  = require('../models/Article');

const ARTICLES = [
  {
    title:    'USA Visa Requirements for Indian Citizens',
    tag:      'Visa Guide',
    tagColor: '#f97316',
    date:     'May 15, 2026',
    readTime: '5 min read',
    excerpt:  'Everything you need to know about applying for a US B1/B2 tourist visa from India — documents, interview tips, and processing times.',
    imageUrl: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80',
    order:    1,
    isPublished: true,
    content: `
<h2>Overview</h2>
<p>The United States remains one of the most sought-after destinations for Indian travellers — whether for tourism, visiting family, or business. Indian citizens require a <strong>non-immigrant visa (B1/B2)</strong> to enter the USA. This guide walks you through everything you need from start to finish.</p>

<h2>Types of US Visas for Indian Applicants</h2>
<ul>
  <li><strong>B-1 (Business):</strong> For attending conferences, meetings, or conducting business negotiations.</li>
  <li><strong>B-2 (Tourist/Visitor):</strong> For tourism, holiday travel, visiting relatives or friends, and medical treatment.</li>
  <li><strong>B-1/B-2 (Combined):</strong> Most commonly issued — covers both business and tourism purposes.</li>
</ul>

<h2>Eligibility Requirements</h2>
<p>To qualify for a B1/B2 visa, you must demonstrate:</p>
<ul>
  <li>Strong ties to India (job, property, family) that ensure you will return</li>
  <li>Sufficient funds to cover your stay without working in the US</li>
  <li>A specific purpose for your visit and a fixed itinerary</li>
  <li>No prior US visa refusals (or honest disclosure if any)</li>
</ul>

<h2>Documents Required</h2>
<ol>
  <li>Valid Indian passport (minimum 6 months validity beyond your planned stay)</li>
  <li>Completed DS-160 application form (online)</li>
  <li>Visa application fee receipt (currently USD 185)</li>
  <li>Photo — 2×2 inches, white background, taken within the last 6 months</li>
  <li>Bank statements (last 6 months showing adequate funds)</li>
  <li>Income tax returns (last 2–3 years)</li>
  <li>Salary slips / employment letter / business documents</li>
  <li>Property and asset proof</li>
  <li>Invitation letter (if visiting family/friends)</li>
  <li>Travel itinerary and hotel bookings</li>
</ol>

<h2>The Application Process Step-by-Step</h2>
<ol>
  <li><strong>Fill DS-160:</strong> Complete the online form at ceac.state.gov. Save your application ID.</li>
  <li><strong>Pay the fee:</strong> Pay MRV fee at any designated bank (currently ₹15,000 approx).</li>
  <li><strong>Schedule your appointment:</strong> Book a slot at the US Consulate/Embassy nearest to you (Mumbai, Delhi, Chennai, Hyderabad, or Kolkata).</li>
  <li><strong>Attend the interview:</strong> Carry all original documents. The consular officer will ask about your trip, ties to India, and financial ability.</li>
  <li><strong>Await decision:</strong> Visas are typically processed within 3–10 working days after approval.</li>
</ol>

<h2>Interview Tips</h2>
<ul>
  <li>Be confident and honest — the officer can detect nervousness or inconsistency.</li>
  <li>Keep your answers short and specific. Don't volunteer unnecessary information.</li>
  <li>Carry all originals but only show what is asked.</li>
  <li>Clearly explain your purpose of visit and why you will return to India.</li>
  <li>Show financial stability without appearing to be a potential immigrant.</li>
</ul>

<h2>Processing Time</h2>
<p>Processing times vary by consulate and season. As of 2026, wait times for B1/B2 interview appointments at Indian consulates range from <strong>30 to 90 days</strong>. Apply well in advance of your planned travel date.</p>

<h2>Visa Validity</h2>
<p>Indian citizens are usually granted a <strong>10-year multiple-entry B1/B2 visa</strong>, with each stay limited to 6 months. However, the final decision rests entirely with the consular officer.</p>

<h2>Common Reasons for Rejection</h2>
<ul>
  <li>Insufficient ties to India</li>
  <li>Inadequate financial proof</li>
  <li>Vague or inconsistent purpose of visit</li>
  <li>Prior overstays or immigration violations</li>
  <li>Incomplete documentation</li>
</ul>

<blockquote>Need expert help with your US visa application? Our experienced team at Tourist Visa Experts has helped hundreds of Indian applicants secure their US visa. <strong>Book a free consultation today.</strong></blockquote>
`,
  },
  {
    title:    'Top 10 Places to Visit in Canada',
    tag:      'Travel Tips',
    tagColor: '#3b82f6',
    date:     'May 10, 2026',
    readTime: '4 min read',
    excerpt:  'From the stunning Niagara Falls to the rugged Rocky Mountains — discover Canada\'s most breathtaking destinations for Indian tourists.',
    imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80',
    order:    2,
    isPublished: true,
    content: `
<h2>Why Canada is a Must-Visit</h2>
<p>Canada is the world's second-largest country by area, offering landscapes that range from snow-capped mountains and vast prairies to cosmopolitan cities and pristine coastlines. For Indian tourists, Canada is particularly special — it's home to one of the world's largest Indian diaspora communities, making it a welcoming and familiar destination.</p>

<h2>1. Niagara Falls, Ontario</h2>
<p>No trip to Canada is complete without witnessing the thunderous power of Niagara Falls. Stradling the Canada–USA border, the falls are best experienced from the Canadian side. Take the famous <em>Hornblower Niagara Cruises</em> to get up close and feel the mist on your face. The falls are stunning year-round, with a magical icy beauty in winter.</p>

<h2>2. Banff National Park, Alberta</h2>
<p>A UNESCO World Heritage Site, Banff is Canada at its most spectacular. Turquoise glacial lakes (Moraine Lake, Lake Louise), towering Rocky Mountain peaks, and abundant wildlife make this a paradise for nature lovers and photographers.</p>

<h2>3. Vancouver, British Columbia</h2>
<p>Consistently ranked among the world's most liveable cities, Vancouver offers a stunning blend of urban sophistication and natural beauty. Explore Stanley Park, the Granville Island Market, Gastown's cobblestone streets, and the North Shore's ski resorts.</p>

<h2>4. Toronto, Ontario</h2>
<p>Canada's largest city is a mosaic of cultures. Climb the iconic CN Tower for panoramic views, explore the Distillery District, stroll through Kensington Market, and catch a Blue Jays game. Toronto's Little India in Gerrard Street East is a must-visit for homesick Indian travellers!</p>

<h2>5. Quebec City, Quebec</h2>
<p>Step into Europe without leaving North America. Old Quebec (Vieux-Québec) is a UNESCO World Heritage Site with centuries-old stone walls, the majestic Château Frontenac, and charming cobblestone streets. Visit in winter for the magical Quebec Winter Carnival.</p>

<h2>6. Whistler, British Columbia</h2>
<p>A world-class ski resort town two hours north of Vancouver, Whistler is perfect for winter sports enthusiasts. Summers offer mountain biking, hiking, and the spectacular Peak 2 Peak gondola connecting two mountain peaks.</p>

<h2>7. Ottawa, Ontario</h2>
<p>Canada's capital offers fascinating history and culture. Visit Parliament Hill, the Canadian Museum of History, the National Gallery, and skate on the Rideau Canal in winter — the world's largest naturally frozen skating rink.</p>

<h2>8. Jasper National Park, Alberta</h2>
<p>Larger and wilder than Banff, Jasper is Canada's largest Rocky Mountain park. The Icefields Parkway connecting Banff to Jasper is often called one of the most scenic drives in the world.</p>

<h2>9. Prince Edward Island</h2>
<p>Known for its red sand beaches, rolling green hills, and fresh lobster, PEI is Canada's smallest province and one of its most charming. The island is also the setting of <em>Anne of Green Gables</em>, beloved by readers worldwide.</p>

<h2>10. Victoria, British Columbia</h2>
<p>The capital of British Columbia sits on the southern tip of Vancouver Island and exudes a decidedly British charm. Visit the famous Butchart Gardens, explore the Inner Harbour, and enjoy afternoon tea at the Empress Hotel.</p>

<h2>Canada Visa for Indian Citizens</h2>
<p>Indian citizens need a <strong>Temporary Resident Visa (TRV)</strong> to visit Canada. The process is straightforward but requires proper documentation. Our expert team can guide you through your Canadian visa application from start to finish.</p>

<blockquote>Planning a Canada trip? Let Tourist Visa Experts handle your visa — so you can focus on packing!</blockquote>
`,
  },
  {
    title:    'Australia Tourist Visa: A Complete Guide',
    tag:      'Destination',
    tagColor: '#10b981',
    date:     'May 05, 2026',
    readTime: '6 min read',
    excerpt:  'Your complete guide to the Australia Visitor Visa (Subclass 600) — eligibility, documents, online application, and what to expect at the border.',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    order:    3,
    isPublished: true,
    content: `
<h2>Introduction to Australia's Visitor Visa</h2>
<p>Australia is a dream destination for Indian travellers — from the iconic Sydney Opera House and the Great Barrier Reef to the vast Outback and world-class beaches. To visit Australia as a tourist from India, you need the <strong>Visitor Visa (Subclass 600)</strong>.</p>

<h2>What is the Subclass 600 Visa?</h2>
<p>The Visitor visa (Subclass 600) allows you to visit Australia:</p>
<ul>
  <li>As a tourist — for holidays, recreation, or visiting family and friends</li>
  <li>For business purposes — attending conferences, meetings, or negotiations</li>
</ul>
<p>It is <strong>not</strong> a pathway to work or study in Australia.</p>

<h2>Validity and Stay Duration</h2>
<ul>
  <li>Visa validity: typically <strong>12 months</strong> from the date of grant</li>
  <li>Each stay: up to <strong>3 months per visit</strong> (sometimes 6 months for family stream)</li>
  <li>Entry: <strong>multiple entries</strong> allowed during the validity period</li>
</ul>

<h2>Eligibility</h2>
<p>To be eligible for a Subclass 600 visa, you must:</p>
<ul>
  <li>Hold a valid Indian passport</li>
  <li>Have genuine intention to visit Australia temporarily</li>
  <li>Demonstrate sufficient financial resources for your stay</li>
  <li>Have strong ties to India ensuring your return</li>
  <li>Meet health and character requirements</li>
  <li>Hold valid health insurance for your stay (strongly recommended)</li>
</ul>

<h2>Documents Required</h2>
<ol>
  <li>Completed online application (via ImmiAccount)</li>
  <li>Valid passport (6+ months validity)</li>
  <li>Recent passport-size photograph</li>
  <li>Bank statements — last 3 to 6 months</li>
  <li>Income tax returns (last 2 years)</li>
  <li>Employment letter / business registration documents</li>
  <li>Leave sanction letter from employer</li>
  <li>Property documents or other asset proof</li>
  <li>Travel itinerary and hotel bookings</li>
  <li>Travel insurance certificate</li>
  <li>Invitation letter (if visiting friends/family in Australia)</li>
  <li>Previous passports (if any)</li>
</ol>

<h2>How to Apply — Step by Step</h2>
<ol>
  <li><strong>Create an ImmiAccount:</strong> Register at immi.homeaffairs.gov.au</li>
  <li><strong>Complete the application:</strong> Fill Form 1419 online (Tourist stream)</li>
  <li><strong>Upload documents:</strong> All documents in PDF or JPEG format</li>
  <li><strong>Pay the fee:</strong> AUD 150 (approximately ₹8,000) via credit/debit card</li>
  <li><strong>Submit biometrics:</strong> Indian applicants may be required to provide biometrics at a VFS centre</li>
  <li><strong>Wait for decision:</strong> Australia processes most applications online; a decision is usually given within 20–30 working days</li>
</ol>

<h2>Processing Time</h2>
<p>75% of applications are processed within <strong>22 days</strong>. Complex cases or those requiring health checks may take longer. Australia processes visa applications online — there is typically no interview required.</p>

<h2>Financial Requirements</h2>
<p>There is no fixed minimum balance requirement, but the Australian government expects you to demonstrate funds sufficient for your trip. A general guideline is AUD 5,000–10,000 (approximately ₹2.5–5 lakh) for a 2-week trip for one person, including flights.</p>

<h2>Health Requirements</h2>
<p>Some Indian applicants may need to undergo a medical examination, particularly if:</p>
<ul>
  <li>You plan to stay for more than 3 months</li>
  <li>You have previously spent time in a country with high tuberculosis rates</li>
  <li>You are travelling with children</li>
</ul>

<h2>Tips for a Successful Application</h2>
<ul>
  <li>Apply at least 6–8 weeks before your travel date</li>
  <li>Ensure all documents are in English (get certified translations if needed)</li>
  <li>Show a clear and specific itinerary</li>
  <li>Demonstrate strong financial and personal ties to India</li>
  <li>Do not overstay your visa — this results in a ban from Australia</li>
</ul>

<blockquote>Our team has a 97% success rate for Australian tourist visa applications. Let us prepare your file so your application gets approved the first time.</blockquote>
`,
  },
  {
    title:    'UAE Visa Types and Application Process',
    tag:      'Visa Guide',
    tagColor: '#f97316',
    date:     'Apr 28, 2026',
    readTime: '4 min read',
    excerpt:  'Dubai, Abu Dhabi, Sharjah — explore the UAE with confidence. Here\'s a complete breakdown of UAE visa types, costs, and how to apply from India.',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    order:    4,
    isPublished: true,
    content: `
<h2>Why Visit the UAE?</h2>
<p>The United Arab Emirates — home to glittering Dubai, the cultural capital Abu Dhabi, and the charming emirate of Sharjah — is one of the most popular destinations for Indian travellers. With world-class shopping, stunning architecture, desert safaris, and an Indian community of over 3 million, the UAE feels almost like a home away from home.</p>

<h2>UAE Visa Types for Indian Citizens</h2>
<p>Unlike many countries, the UAE offers several convenient visa options for Indian citizens:</p>

<h3>1. Tourist Visa (30 Days — Single Entry)</h3>
<ul>
  <li>Ideal for a short holiday or leisure trip</li>
  <li>Valid for 60 days from the date of issue</li>
  <li>Stay: up to 30 days (cannot be extended)</li>
  <li>Cost: approximately ₹4,000–6,000</li>
</ul>

<h3>2. Tourist Visa (30 Days — Multiple Entry)</h3>
<ul>
  <li>Useful for travellers who plan to enter the UAE more than once</li>
  <li>Each stay: up to 30 days per entry</li>
  <li>Cost: approximately ₹8,000–10,000</li>
</ul>

<h3>3. Tourist Visa (60 Days — Single Entry)</h3>
<ul>
  <li>For longer stays — extended holiday, family visits</li>
  <li>Valid for 60 days from issue; stay up to 60 days</li>
  <li>Cost: approximately ₹7,000–9,000</li>
</ul>

<h3>4. Transit Visa (96 Hours)</h3>
<ul>
  <li>For travellers with a layover in the UAE who wish to leave the airport</li>
  <li>Valid only for 4 days (96 hours)</li>
  <li>Cost: approximately ₹2,000–3,000</li>
</ul>

<h3>5. UAE Visa on Arrival for Indians</h3>
<p>Indian passport holders who hold a <strong>valid US, UK, EU, or Australian visa</strong> are eligible for a <strong>UAE Visa on Arrival</strong> — a 14-day stay, extendable by another 14 days. This is a huge convenience for frequent international travellers.</p>

<h2>How to Apply for a UAE Tourist Visa</h2>
<p>UAE visas for Indian citizens must be sponsored. Here are the most common ways:</p>
<ol>
  <li><strong>Through your airline:</strong> Emirates, Air Arabia, and flydubai offer UAE tourist visas when you book a flight with them.</li>
  <li><strong>Through your hotel:</strong> Many Dubai and Abu Dhabi hotels can sponsor tourist visas for their guests.</li>
  <li><strong>Through a travel agent / visa service:</strong> The fastest and most reliable method — a registered agent in the UAE files on your behalf.</li>
  <li><strong>Via UAE ICP portal:</strong> Self-application through the UAE's official ICP (Federal Authority for Identity) website (icp.gov.ae)</li>
</ol>

<h2>Documents Required</h2>
<ol>
  <li>Valid Indian passport (minimum 6 months validity)</li>
  <li>Recent passport-size photograph (white background)</li>
  <li>Return flight ticket</li>
  <li>Hotel booking confirmation</li>
  <li>Bank statement (last 3 months)</li>
  <li>Proof of travel insurance (recommended)</li>
  <li>For visa on arrival: copy of valid US/UK/EU/AU visa</li>
</ol>

<h2>Processing Time and Costs</h2>
<p>UAE tourist visas are typically processed within <strong>3–5 working days</strong>. Rush processing (24–48 hours) is available at an additional cost. Total costs including service charges typically range from <strong>₹4,000 to ₹12,000</strong> depending on visa type and processing speed.</p>

<h2>Important Rules to Know</h2>
<ul>
  <li>Do not overstay — fines are AED 100 per day (approximately ₹2,200/day)</li>
  <li>The UAE has strict laws — respect local culture and dress codes, especially in public places</li>
  <li>Carry printed copies of your visa, hotel booking, and return ticket</li>
  <li>Keep your passport and visa safe — losing them in the UAE can cause significant delays</li>
</ul>

<h2>Best Time to Visit</h2>
<p>The best time to visit the UAE is from <strong>October to April</strong>, when temperatures are pleasant (20–30°C). Summers (May–September) are extremely hot (40–50°C) and humid, though indoor attractions and shopping remain popular year-round.</p>

<blockquote>Getting a UAE visa is simple, but getting it right the first time matters. Our team processes UAE visas in as little as 48 hours. Contact us today!</blockquote>
`,
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Remove existing articles to avoid duplicates
    await Article.deleteMany({})
    console.log('Cleared existing articles')

    const inserted = await Article.insertMany(ARTICLES)
    console.log(`Seeded ${inserted.length} articles:`)
    inserted.forEach(a => console.log(`  [${a.order}] ${a.title}`))

  } catch (err) {
    console.error('Seed error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Done.')
  }
}

seed()
