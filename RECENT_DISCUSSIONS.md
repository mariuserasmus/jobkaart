# Recent Discussions & Action Items

**Last Updated:** 2026-01-08

---

## 🚨 Facebook Ad Hack Incident (Jan 6-8, 2026)

### What Happened:
1. **Jan 6 (evening)**: Launched first paid Facebook ad (ad5-fresh-start-2026.html)
   - Budget: ~R75-100/day
   - Target: South Africa, Small business owners
   - Results after 1 day: 13 clicks, 1,648 impressions, CTR: 0.79%, Cost: R1.81/click

2. **Jan 7**: Received phishing email pretending to be from Facebook
   - Clicked link before verifying sender
   - Account compromised

3. **Jan 7-8**: Hackers:
   - Added themselves as admins
   - Created fraudulent ad campaigns
   - Accumulated R4,350 in charges
   - User turned off all campaigns
   - Facebook's fraud detection blocked charges automatically ✅

### Current Status:
- ✅ Spending stopped at R4,350
- ✅ No money charged to bank (Facebook blocked card)
- ✅ Account secured (password changed, 2FA enabled, unauthorized admins removed)
- ⏳ Disputes filed with Facebook (no response yet - expect 7-14 days)
- ⏳ Card status: "Verify card" (blocked by Facebook fraud detection)

### Lessons Learned:
1. **Original ad targeting was WRONG:**
   - 50.4% women seeing ads (should be 5-15% for tradie market)
   - Too broad interests (Small business, Entrepreneurship)
   - Need trade-specific targeting: Plumbing, Electrician, Handyman

2. **Better targeting for next campaign:**
   - Gender: Men only
   - Age: 25-54
   - Interests: Plumbing + Electrician + Handyman + Construction (3-4 trade-specific)
   - Remove: Generic "small business" interests

3. **Security measures implemented:**
   - 2FA enabled
   - Spending limits (R500-1000 max)
   - Never click Facebook policy emails (always check Ads Manager directly)

### Next Steps:
- Wait 7 days for Facebook response
- If no response: Create fresh Business Manager with different email
- When ready: Launch new campaign with FIXED targeting

---

## 📧 Email Implementation Discussion (Jan 8, 2026)

### Requirements:
- Admin notification when someone signs up
- Eventually: Welcome emails to new users
- Eventually: Transactional emails (password reset, invoice notifications)

### Decision: Use Resend (not Afrihost SMTP)

**Why Resend:**
- FREE tier: 3,000 emails/month
- Better deliverability (90%+ vs 60-70%)
- Simple API (10-15 lines of code)
- Tracking & analytics
- Professional infrastructure

**Why NOT Afrihost SMTP:**
- Good for low volume but:
  - Lower deliverability (shared hosting IPs)
  - No tracking
  - More complex code (30-40 lines with nodemailer)
  - Rate limits unknown

### Implementation Plan:
**Phase 1 - Admin Notifications Only** (30-60 mins)
- Sign up for Resend
- Create `lib/email.ts` with `sendSignupNotification()`
- Update signup API to trigger email
- Email to hello@jobkaart.co.za when someone registers

**Phase 2 - User Welcome Emails** (+1 hour when we have users)

**Phase 3 - Full Transactional System** (+4-6 hours when scaling)

### Status:
⏳ **Planned for this weekend** - User will provide Resend API key

---

## 🛒 Hardware Store Integration Discussion (Jan 8, 2026)

### Original Idea (from friend):
- API integration with Builders Warehouse / BuildIt
- Auto-populate quote items with live prices and stock
- Problem: No public APIs available ❌

### Alternative Solutions (Approved):

#### **Solution 1: Personal Price Catalog** ⭐⭐⭐⭐⭐ (BEST - Build First)
**What it is:**
- Tradie creates their own "My Items" library
- Saves: Item name, price, unit, notes
- When creating quote: "Add from My Items" button
- Auto-populate quote line items with saved prices

**Benefits:**
- Works with ANY hardware shop
- Tradie controls their own prices
- No API needed
- Solves 80% of the problem

**Effort:** 2-3 hours

**Implementation:**
- New "My Items" section in dashboard
- CRUD operations (add/edit/delete items)
- Integration into quote creation flow
- Photo attachment per item (for reference)

#### **Solution 2: Enhanced Quote Templates** ⭐⭐⭐⭐
- Add materials list to existing templates
- Pre-populated common items
- Tradie updates prices when using template

**Effort:** 1-2 hours

#### **Solution 3: Copy from Recent Quote** ⭐⭐⭐
- "Copy materials from previous quote"
- Update quantities/prices
- Fast for similar jobs

**Effort:** 30 mins

#### **Future: Community Price Sharing** (Phase 2)
- Tradies voluntarily share recent prices
- "Cement 50kg: R89 (Builders Centurion, 1 day ago)"
- Crowdsourced, live pricing
- Location-specific

**Effort:** 2-4 weeks

### Barcode Scanning Discussion:

**Original idea:** Scan barcode at shop to build catalog faster

**Reality check:**
- Barcode only contains product ID (not price or name)
- Requires lookup in product database
- Success rate: 40-60% for SA hardware items
- Still need to manually enter price
- Time saved: ~3-5 seconds (when it works)

**Better alternatives:**
1. **Photo capture** ⭐⭐⭐⭐⭐ - Take photo of shelf/price tag, review later
2. **Voice input** ⭐⭐⭐⭐ - "110mm PVC pipe, R135" (5 seconds)
3. **Quick templates** ⭐⭐⭐⭐ - Pre-populated categories
4. **Receipt OCR** ⭐⭐⭐⭐ - Bulk import from receipt photo

**Decision:** Skip barcode scanning for now. Build voice input + photo capture instead.

### Status:
⏳ **Planned for this weekend** - Build "My Items" catalog with voice input option

---

## 📱 QR Code Marketing Campaign (Jan 8, 2026)

### The Idea:
Instead of waiting for Facebook, do guerrilla marketing with QR codes at hardware stores.

### Strategy:

#### **Trackable QR Codes:**
- Unique QR per location: `jobkaart.co.za/signup?ref=builders-centurion`
- Track which locations get most signups
- ROI per location visible in admin dashboard

#### **Print Materials:**

**Option 1: Business Cards** (85mm × 55mm)
- Simple QR code + value prop
- Cost: R80-150 for 100 cards
- Print at: print.co.za or Minuteman Press

**Option 2: A5 Flyers** (148mm × 210mm) ⭐ BEST
- Large QR code
- Tear-off strips at bottom
- Perfect for notice boards
- Cost: R200-300 for 50 flyers

**Option 3: Table Tents** (A5 folded)
- Stands on trade counters
- Both sides visible

#### **Distribution Locations:**

**Priority 1 - Hardware Stores:**
- Builders Warehouse (trade counter + notice board)
- BuildIt
- Cashbuild
- Chamberlain

**Priority 2 - Trade Wholesalers:**
- Plumb-Link (plumbing)
- Voltex (electrical)
- Radium (plumbing)
- Midas (automotive/tools)

**Priority 3 - Community:**
- Notice boards
- Facebook groups (share QR image)
- WhatsApp business groups
- Local expos

#### **Pitch to Counter Staff:**
> "Hi, I've got a free tool for tradies to manage their jobs. Mind if I leave some cards at the counter?"

**Expected success rate:** 70-80% say yes

### Expected Results:
- 150 cards distributed
- 5-15 signups (3-10% conversion)
- R200-500 total cost
- **First paying customer likely from this**

### Implementation Tasks:

**What I'll Build (1-2 hours):**
1. QR code generator with tracking parameters
2. 3 print-ready PDF designs (business card, A5 flyer, A6 postcard)
3. Update signup page to capture `?ref=` parameter
4. Admin dashboard widget: "Signup Sources" (shows which locations work)

**What User Does:**
1. Approve designs
2. Print (at home or print shop)
3. Distribute to 10-15 locations over 1 week
4. Track results in dashboard

### Status:
⏳ **Planned for this weekend** - Build QR tracking system + designs

---

## 🐛 Google Search Console Fix (Jan 8, 2026)

### Issue:
"Duplicate field 'FAQPage'" error in structured data

### Cause:
Two separate `<script>` tags with structured data (SoftwareApplication + FAQPage)

### Fix Applied:
Combined both schemas into single JSON-LD array in `app/page.tsx`

### Status:
✅ **FIXED & DEPLOYED** (Jan 8, 2026)
- Committed: `1ebea79 - fix: Resolve Google Search Console duplicate FAQPage error`
- Pushed to production
- Waiting for Google to re-crawl (1-7 days)

### Next Steps:
1. Request validation in Google Search Console
2. Wait for error to clear (3-7 days)
3. FAQs may appear as rich snippets in search (7-14 days)

---

## 📊 Current Platform Status

### Live Features:
- ✅ Customer management
- ✅ Quote creation (with templates)
- ✅ Job tracking (6 statuses)
- ✅ Invoice creation
- ✅ Dashboard with alerts
- ✅ Admin panel (super admin settings)
- ✅ FREE tier (5 quotes/jobs/invoices per month)
- ✅ Subscription plans (Starter R299, Pro R499, Team R799)
- ✅ PayFast integration
- ✅ Progressive Web App (PWA)

### Recent Additions:
- ✅ Partially invoiced jobs visibility (Jan 5, 2026)
- ✅ Invoice grouping by job (Jan 5, 2026)
- ✅ FREE tier settings page for super admin
- ✅ Google Analytics tracking
- ✅ Structured data (SEO) optimization

### Current Users:
- **Subscribers:** 0
- **Status:** LIVE at jobkaart.co.za
- **Marketing:** Facebook ads paused (due to hack), preparing QR campaign

---

## 🎯 Weekend Action Items (Priority Order)

### Saturday Morning:
1. **QR Code Campaign** (1-2 hours) ⭐ TOP PRIORITY
   - Generate trackable QR codes for 10 locations
   - Create 3 print-ready designs (PDF)
   - Set up ref tracking on signup page
   - Admin dashboard: Signup sources widget

2. **Email Notifications** (30 mins)
   - User signs up for Resend
   - Provide API key
   - Build admin notification system

### Saturday Afternoon (Optional):
3. **My Items Catalog** (2-3 hours)
   - Personal price catalog for quote materials
   - Voice input option
   - Photo attachment per item
   - Integration into quote creation

### Next Week:
4. **Print & Distribute QR Cards**
   - Print 50-100 cards/flyers
   - Visit 2-3 locations per day
   - Track signups in dashboard

5. **Facebook Decision (by Friday)**
   - If Facebook still silent: Create fresh Business Manager
   - If resolved: Launch new campaign with fixed targeting

---

## 💭 Key Insights & Mindset Shifts

### What We Learned This Week:

1. **Facebook ads aren't everything**
   - QR codes might work better for local, niche market
   - Guerrilla marketing = higher trust, right audience
   - Diversification is critical

2. **Failed fast, learned cheap**
   - R0 lost (Facebook blocked charges)
   - Discovered targeting was wrong BEFORE wasting R2,000+
   - Hack was a blessing in disguise

3. **Build what you CAN control**
   - Can't control Facebook response time
   - CAN control: QR campaign, product improvements, direct outreach
   - Waiting = victim mentality, Building = entrepreneur mindset

4. **Right audience > big audience**
   - 50% women seeing ads = wasted impressions
   - Better: 100 tradies at Builders counter than 10,000 random people on Facebook

### User's Current State:
- Feeling: Frustrated with Facebook, cautiously optimistic about QR campaign
- Energy: Tired from tough week, planning rest before weekend work
- Momentum: Lost some momentum from hack, need quick win to rebuild confidence

### Goals:
- **Short-term:** Get 1 signup from QR campaign by Jan 17
- **Medium-term:** 5-10 signups in January
- **Long-term:** 10 paying subscribers by March 2026

---

## 📚 Related Documentation

- **Main project overview:** `CLAUDE.md`
- **Current status:** `PROJECT_STATUS.md`
- **Technical architecture:** `ARCHITECTURE.md`
- **Future ideas:** `FUTURE_IDEAS.md`
- **Deployment:** `DEPLOYMENT_STRATEGY.md`

---

**Next Session:** Resume with QR code campaign implementation
