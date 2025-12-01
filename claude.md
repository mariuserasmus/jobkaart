# JobKaart - Project Summary

## Overview
**JobKaart** is a simple job management system designed specifically for South African tradespeople. It helps solo operators and small teams (1-3 people) manage quotes, jobs, and invoices without the complexity of enterprise solutions.

**Target Market**: Plumbers, electricians, painters, handymen, pool services, pest control, and similar quote-based trades in South Africa.

**Core Value Proposition**: "Stop losing jobs. Get paid faster. Look professional."

---

## The Problem We're Solving

### Current Situation
Most SA tradespeople use:
- WhatsApp for customer communication
- Notebook in the bakkie for quotes
- Excel (or wife/partner) for invoicing
- Their memory for everything else

### The Cost of "Free"
- Average tradie loses 2-3 quotes per month they forget to follow up
- Average quote value: R4,000
- **Lost revenue per month: R8,000 - R12,000**
- **Lost revenue per year: R96,000 - R144,000**

### Hidden Costs of the Current System
- Customer numbers buried in WhatsApp chats
- Paper quotes go through the wash
- Forget to follow up on quotes → customer goes to competitor
- Finish jobs but forget to invoice
- No visibility into outstanding payments
- Partner can't invoice without constant phone calls
- Notebook stolen from bakkie = all data lost

---

## The Solution: 5 Features Done Damn Good

### 1. Customer Database
**Pain solved**: "I can't find Tannie Maria's number — she's somewhere in WhatsApp from 6 months ago"

**Features**:
- Search by name, phone number, or address
- One-tap call or WhatsApp
- See complete history (quotes, jobs, invoices)
- Add new customer in 10 seconds

**Damn Good Feature**: Customer Lifetime Summary
- "Tannie Maria has paid you R47,000 over 3 years. She has R2,400 outstanding."
- Know immediately if you can afford a discount or need to chase payment

### 2. Quote Builder
**Pain solved**: "I wrote a quote on paper, it went through the wash, R8,000 job gone"

**Features**:
- Create professional quote in under 2 minutes
- Send via WhatsApp with ONE tap
- Know when customer has VIEWED it
- Auto-reminder after 3 days if no response
- Convert accepted quote to job with one tap
- Pre-saved templates for common jobs

**Damn Good Features**:
- **View Tracking**: "Tannie Maria just viewed your quote!" — Call them while it's fresh
- **Auto Follow-Up**: After 3 days, dashboard prompts you to follow up
- **Professional PDF**: Branded PDF with logo, not a scruffy WhatsApp message

### 3. Job Tracker
**Pain solved**: "I can't remember which jobs I've finished but haven't invoiced"

**Simple 6-Status Pipeline**:
- Quoted (Yellow) → Quote sent, waiting
- Scheduled (Blue) → Accepted, date booked
- In Progress (Orange) → Currently working
- Complete (Green) → Work done, ready to invoice
- Invoiced (Purple) → Invoice sent, waiting payment
- Paid (Grey) → Money received, complete

**Damn Good Feature**: Jobs to Invoice Alert
- "You have 3 jobs marked COMPLETE that you haven't invoiced yet — R12,400 sitting there"
- Photo proof of work with timestamps

### 4. Simple Invoicing
**Pain solved**: "My wife can't invoice because all the details are in my head"

**Features**:
- One-click invoice from completed job
- Auto-calculated VAT (if registered)
- Professional PDF with logo and banking details
- Send via WhatsApp or Email
- Track: Sent → Viewed → Paid
- Overdue invoices highlighted in RED

**Damn Good Features**:
- **One-Tap Payment Reminder**: Auto-filled WhatsApp message for overdue invoices
- **Wife-Friendly Design**: Partner has own login, sees everything needed to invoice
- **Partial Payments**: Track R6,000 paid on R10,000 invoice, show R4,000 outstanding

### 5. Dashboard
**Pain solved**: "I have no idea if I'm actually making money this month"

**Dashboard Sections**:
- **TODAY**: Jobs scheduled for today with addresses and notes
- **ACTION NEEDED**:
  - Quotes waiting for response (3+ days)
  - Jobs to invoice (complete but not invoiced)
  - Overdue invoices (in RED)
- **THIS MONTH**:
  - Revenue collected
  - Jobs completed
  - Quotes sent
  - Quote acceptance rate

**Damn Good Features**:
- **The Money Number**: "Customers owe you: R23,400" — front and center
- **Month Comparison**: "You're R8,000 ahead of last month" or behind
- **Morning SMS (Phase 2)**: Daily summary at 7am

---

## WhatsApp Integration Strategy

### Click-to-Chat Approach (No API Pain)
Instead of complex WhatsApp Business API:

**How it works**:
1. User taps "Send via WhatsApp"
2. App generates public link (jobkaart.co.za/q/abc123)
3. WhatsApp opens with pre-filled message
4. User taps Send (2 seconds)
5. When customer clicks link, JobKaart tracks "Quote viewed at 14:32"

**Benefits**:
- Zero setup time (vs 10-40 hours for API)
- No META verification needed
- FREE (vs R0.30-0.80 per message)
- Works on user's existing WhatsApp
- Still tracks quote views via link clicks

The 2-second extra step is worth it for zero complexity and zero cost.

---

## Pricing Strategy

### Pricing Tiers

| Plan | Starter | Pro ⭐ | Team |
|------|---------|--------|------|
| **Price** | R299/month | R499/month | R799/month |
| **Users** | 2 | 5 | 10 |
| **Jobs/month** | 50 | Unlimited | Unlimited |
| **Quote templates** | 5 | Unlimited | Unlimited |
| **Support** | Email | WhatsApp | Priority + Phone |

### ROI Justification

**The question isn't "Is R299 expensive?" — it's "Is R299 worth it compared to free?"**

- Average tradie loses 2-3 quotes/month they forget to follow up
- Average quote value: R4,000
- Lost per month: R8,000 - R12,000
- JobKaart cost: R299/month
- **If JobKaart helps recover ONE quote = R3,701 net profit**
- **ROI: 1,238%**

### Why Not Competitors?

**vs WhatsApp + Notebook**:
| Task | WhatsApp + Notebook | JobKaart |
|------|---------------------|----------|
| Find customer | Scroll 5+ mins | 2 seconds |
| Professional quote | Paper/messy text | Beautiful PDF, 2 mins |
| Know if read | No idea | "Viewed 2pm today" |
| Follow-up reminder | Forget regularly | Auto @ 3 days |
| Track invoicing | "In my head" | "3 jobs to invoice" |
| Know who owes | Guessing | "R23,400 outstanding" |
| Partner can help | Needs to phone you | Own login, sees all |
| Backup | Notebook stolen = GONE | Safe in cloud |

**vs ServCraft / Tradify**:
| Aspect | ServCraft/Tradify | JobKaart |
|--------|-------------------|----------|
| Price | R299-600 PER USER | R299-799 FLAT |
| 2-person team | R598-1,200/month | R299/month (Starter) |
| 5-person team | R1,495-3,000/month | R499/month (Pro) |
| Features | 20+ complex | 5 simple |
| Setup | Training required | 10 mins, figure it out |
| Target | Teams 5-10+ | Solo tradies to small teams |

---

## Target Customers

### 🎯 PRIORITY 1: Actively Target (★★★★★ EXCELLENT FIT)

**Perfect candidates**:
- Solo plumbers and small plumbing teams
- Electricians (1-5 people)
- Handymen / general maintenance
- Painters and decorators
- HVAC / aircon technicians
- Appliance repair technicians
- Locksmiths
- Tilers and floor installers

**Why they're perfect**:
- Quote-based work (50%+ of business involves quotes)
- Variable job values (needs tracking)
- Solo/small teams (simple needs)
- Clear ROI story (lost quotes = lost money)

### 🟡 PRIORITY 2: Accept If They Come, Don't Chase (★★★★☆ GREAT FIT)

**Good candidates with caveats**:
- Pool services (hybrid contract + repairs)
- Pest control
- Garden services with once-off work (landscaping, tree felling)
- Security installers (CCTV, alarms)
- IT support / computer repair
- Automotive mobile mechanics

**Why partial fit**:
- May have recurring contracts (Phase 2 feature needed)
- Can use for quote-based portion of business
- Workarounds needed for some features

### 🛑 PRIORITY 3: Politely Decline (★★☆☆☆ WEAK FIT)

**Wrong business model**:
- Pure contract/schedule businesses (weekly cleaning, garden maintenance only)
- Home bakers, crafters, makers (need order/inventory management)
- E-commerce / online shops (need cart, shipping, inventory)
- Restaurants / food service (need POS, table management)
- Salons / spas (need appointment booking focus)
- Tutors / coaches (need scheduling, not quotes)
- Large construction companies (need project management)

**Taking the wrong customer hurts more than losing a sale.**

---

## Qualifying Question

**"What percentage of your work involves giving quotes to customers and waiting for them to say yes?"**

| Answer | Fit Score | Action |
|--------|-----------|--------|
| > 50% | ★★★★★ EXCELLENT | Sign them up! |
| 20-50% | ★★★☆☆ PARTIAL | Might work, set expectations |
| < 20% | ★★☆☆☆ NOT A FIT | Politely decline, save their time |

---

## Customer Case Studies Summary

### Johan — Solo Plumber (★★★★★)
- 25-35 jobs/month, R60k-90k revenue
- Loses 3 quotes/month = R12,000 lost
- ROI: 1,238% if recovers just 1 job

### Sipho — Electrician with Team (★★★★★)
- 3 people, 60-80 jobs/month, R150k-250k revenue
- Needs team coordination, compliance docs (COCs)
- Pro plan (R499/month) perfect fit

### Peter — Handyman (★★★★★)
- 40-60 small jobs/month, R40k-70k revenue
- High volume = high chaos
- Quote templates save hours monthly

### Willem — Pool Services (★★★★☆)
- Hybrid: 60% contracts, 40% once-off repairs
- Uses JobKaart mainly for repair side
- 40% quote-based work justifies subscription

### Blessing — Painting Contractor (★★★★☆)
- 8-12 large jobs/month, R8k-45k per job
- Average R20,000 quote
- ONE recovered quote = 3,907% ROI

### Thandi — Garden Service (★★★☆☆)
- Pure monthly contracts = partial fit
- Needs recurring invoices (Phase 2)
- Add to waiting list for later

### Sarah — Home Baker (★★☆☆☆)
- Needs order management, not quotes
- Needs inventory tracking
- Politely decline, refer to bakery software

---

## Handling Objections

### "R299 is expensive — I'll stick with WhatsApp"
**Response**: "I hear you. Quick question: how many quotes did you send last month that you never followed up on? [Wait for answer] At R4,000 average, that's R8,000-12,000 potentially lost. R299 to recover even ONE of those is a 1,300% return. Free isn't free if it's costing you jobs."

### "I'm not tech-savvy"
**Response**: "Can you use WhatsApp? Then you can use JobKaart. It's actually simpler than WhatsApp — just 5 buttons. Most people figure it out in 10 minutes. And if you get stuck, we help you set it up."

### "I'll think about it"
**Response**: "No problem. While you're thinking, how many quotes will you send this week? And how many will you remember to follow up on? Every week you wait is another R8,000 potentially walking out the door. But no pressure — join the waiting list and we'll remind you when we launch."

### "What about ServCraft / Tradify?"
**Response**: "Great products if you have a large team and need GPS tracking, complex scheduling, all that. But they charge R299 PER USER. For a 2-person team (you + your wife), that's R598/month. For 5 people, that's R1,495/month. JobKaart is R299-499 flat — your whole team included. We focus on 5 features done really well, not 20 features you'll never use."

---

## Technical Stack (Recommended)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React/Next.js | Responsive web, mobile-first |
| **Backend** | Python (FastAPI) or Node.js | |
| **Database** | PostgreSQL | Via Supabase for easy start |
| **Hosting** | Vercel + Supabase | Starts FREE, scales with customers |
| **Payments** | PayFast | SA card payments, EFT |
| **Email** | SendGrid | 100/day free tier |
| **PDF Generation** | React-PDF or Puppeteer | |
| **WhatsApp** | Click-to-chat links | No API needed |

### Multi-Tenant Architecture
- One domain: jobkaart.co.za
- One database (data separated by user_id)
- One codebase (update once, everyone benefits)
- Hosting cost: R0-200/month to start, scales with customers

---

## Domain Strategy

### Primary Domain
**jobkaart.co.za** ✅

**Why this works**:
- "JobKaart" = Afrikaans for "Job Card" — tradies know this term
- Uniquely South African
- Memorable and distinctive
- Easy to spell for Afrikaans and English speakers

**Check availability at**:
- https://www.domains.co.za
- https://xneelo.co.za
- https://www.afrihost.com/domains

**Estimated cost**: R80-150/year

### Backup Options (Priority 1)
- jobkaart.africa
- myjobkaart.co.za
- getjobkaart.co.za
- jobkaartsa.co.za

### Also Consider Registering
- jobkaart.com (prevent squatters)
- jobkaart.africa (future expansion)

### After Registration
1. Set up email forwarding: hello@jobkaart.co.za
2. Create social media handles:
   - Facebook: /jobkaartza
   - Instagram: @jobkaart_sa
   - LinkedIn: /company/jobkaart

---

## Launch Targets (First 6 Months)

| Metric | Target |
|--------|--------|
| Paying customers (Month 3) | 10 |
| Paying customers (Month 6) | 50 |
| MRR (Month 6) | R15,000+ |
| Monthly churn rate | < 10% |
| Time to first quote (new user) | < 5 minutes |
| NPS score | > 40 |

### Key Feature Usage Metrics to Track
- Quotes created per user per month
- Quote-to-job conversion rate
- Average days from invoice to payment
- % of users logging in weekly

---

## Why JobKaart Will Win

### 1. Market Gap
- International solutions (ServCraft, Tradify) are too expensive and complex for SA solo tradies
- Local alternatives don't exist or are poorly designed
- WhatsApp + notebook is costing tradies thousands monthly

### 2. Perfect Price Point
- R299/month is affordable for someone earning R60k-90k/month
- 1,238% ROI story sells itself
- Flat pricing (not per-user) is unique selling point

### 3. Simplicity
- 5 features vs competitors' 20+ features
- 10 minutes to figure out vs hours of training
- Built for solo tradies, not enterprise teams

### 4. SA-Specific
- WhatsApp integration (SA tradies live on WhatsApp)
- PayFast payments (local EFT)
- Afrikaans-friendly branding
- Understands SA tradie culture (bakkie, tannie, etc.)

### 5. Clear ROI
- Every feature directly addresses a pain point that costs money
- "Stop losing jobs" = immediate financial impact
- Easy to calculate: lost quotes × average value = ROI

---

## Next Steps

### Immediate Actions
1. **Register domain**: jobkaart.co.za (TODAY!)
2. **Set up basic landing page**:
   - Value proposition
   - Waiting list signup
   - Social proof (case study snippets)
3. **Create social media accounts**: Lock down handles

### Development Priority (MVP)
**Phase 1 (Launch MVP)**:
- Feature 1: Customer Database
- Feature 2: Quote Builder
- Feature 3: Job Tracker
- Feature 4: Simple Invoicing
- Feature 5: Dashboard
- Basic user authentication
- PayFast payment integration

**Phase 2 (Post-Launch)**:
- Recurring jobs/invoices (for garden services, pool contracts)
- Morning SMS notifications
- Advanced reporting
- Quote vs actual tracking (job profitability)
- Team performance metrics

### Marketing Strategy
1. **Direct outreach**: WhatsApp tradies you know personally
2. **Facebook Groups**: SA tradie and business groups
3. **Word of mouth**: Incentivize referrals (R100 credit per referral?)
4. **Local hardware stores**: Flyers at trade counters
5. **Google Ads**: "job management for plumbers SA"

---

## Key Insights

### What Makes JobKaart Different
- **Built for SA tradies, not global enterprise**
- **5 features done damn good, not 20 features half-baked**
- **Flat pricing, not per-user gouging**
- **WhatsApp-first, because that's what SA uses**
- **ROI in the first recovered quote**

### The Core Truth
Every tradie using WhatsApp + notebook is losing money. They just don't realize how much. JobKaart makes that visible and fixable for R299/month.

**If you recover one R4,000 quote, you've paid for 13 months of JobKaart.**

---

**Document compiled**: November 2025
**For**: JobKaart — Simple Job Management for SA Tradespeople

*Source documents*:
- JobKaart_Feature_Specification_v2.docx
- JobKaart_vs_WhatsApp_Comparison.docx
- JobTrack_SA_Case_Studies.docx
- JobKaart_Domain_Checklist.md