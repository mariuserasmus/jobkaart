# JobKaart - Deployment Strategy & Production Management

This document outlines how to safely deploy updates to production without breaking the site for paying customers.

---

## 🎯 The Goal: Maximum Uptime for Paying Customers

**Acceptable Downtime:** < 0.1% (less than 45 minutes per month)
**Target:** 99.9% uptime (industry standard for small SaaS)

---

## 🚨 The Problem We're Solving

**Current Risk:**
- Local builds work fine ✅
- TypeScript passes locally ✅
- Deploy to Vercel → **BUILD FAILS** ❌
- Site goes down 💥
- Customers can't work 😡

**Why This Happens:**
1. Environment differences (local vs production)
2. TypeScript strict mode differences
3. Missing dependencies in production
4. Database migration issues
5. API environment variables not set

---

## 📋 Pre-Deployment Checklist (MANDATORY)

Before every production deployment, run this checklist:

### 1. ✅ Local Build Test
```bash
npm run build
```
- Must complete with NO errors
- Must complete with NO TypeScript warnings
- Check build output for any suspicious messages

### 2. ✅ TypeScript Check
```bash
npx tsc --noEmit
```
- Must show 0 errors
- Catches type issues before deployment

### 3. ✅ Linting Check
```bash
npm run lint
```
- Fix any critical linting errors
- Warnings are okay, errors are not

### 4. ✅ Test Critical User Flows
**Manually test these flows in dev:**
- [ ] User can login
- [ ] User can create a quote
- [ ] User can create a job
- [ ] User can create an invoice
- [ ] User can view dashboard
- [ ] Admin can access admin panel

### 5. ✅ Check Environment Variables
**Ensure these are set in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any new variables you added

### 6. ✅ Database Migration Plan
**If you changed the database schema:**
- [ ] Migration SQL script written
- [ ] Migration tested on dev database
- [ ] Rollback script ready (if needed)
- [ ] Plan: Run migration before or after deployment?

### 7. ✅ Review Git Diff
```bash
git diff origin/main
```
- Review EVERY changed file
- Look for debug code, console.logs, commented code
- Ensure no sensitive data committed

---

## 🏗️ Deployment Environments Strategy

### Current Setup (Single Production)
```
Local Dev → Production (Vercel)
```
**Problem:** No testing ground before production

### Recommended Setup (Add Staging)
```
Local Dev → Staging (Vercel Preview) → Production (Vercel)
```

### How to Set Up Staging Environment

**Option 1: Use Vercel Preview Deployments (FREE)**
- Every branch automatically gets a preview URL
- Create `staging` branch
- Test on preview URL before merging to `main`
- Merge to `main` only when staging looks good

**Option 2: Create Separate Vercel Project (Costs $20/month)**
- Duplicate project in Vercel
- Connect to `staging` branch
- Has its own domain: `staging.jobkaart.co.za`
- Separate database (or shared with dev mode)

**Recommended: Option 1 (Vercel Preview)**
- FREE
- Easy to set up
- Good enough for small team

---

## 🔄 Safe Deployment Process

### For Bug Fixes (Urgent)
When you need to fix a critical bug ASAP:

1. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/fix-login-error
   ```

2. **Fix the bug**

3. **Test locally**
   ```bash
   npm run build
   npx tsc --noEmit
   npm run dev
   # Test the fix manually
   ```

4. **Push to preview**
   ```bash
   git push origin hotfix/fix-login-error
   ```
   - Vercel creates preview deployment automatically
   - Test on preview URL

5. **Merge to main if preview works**
   ```bash
   git checkout main
   git merge hotfix/fix-login-error
   git push origin main
   ```

6. **Monitor production**
   - Watch Vercel deployment logs
   - Test production URL immediately
   - Check error logs

### For Features (Non-Urgent)
When adding new features or enhancements:

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-quote-template
   ```

2. **Build the feature**

3. **Test locally thoroughly**

4. **Push to preview**
   ```bash
   git push origin feature/new-quote-template
   ```

5. **Test preview URL for 24 hours**
   - Use it yourself
   - Check all affected pages
   - Test edge cases

6. **Merge to main only when confident**

7. **Monitor for 1 hour after deployment**

---

## 🛡️ Rollback Strategy

If deployment breaks production, you need to rollback FAST.

### Vercel Rollback (Instant)

**Option 1: Via Vercel Dashboard**
1. Go to Vercel dashboard
2. Find your project
3. Click "Deployments"
4. Find last working deployment
5. Click "..." → "Promote to Production"
6. Site rolls back in ~30 seconds

**Option 2: Via Git Revert**
```bash
# Find the commit that broke things
git log --oneline

# Revert that commit
git revert <commit-hash>

# Push to trigger new deployment
git push origin main
```

### Database Rollback (Manual)
If you ran a migration that broke things:

1. **Have rollback SQL ready BEFORE migration**
   ```sql
   -- Example: If you added a column
   ALTER TABLE quotes DROP COLUMN new_column;
   ```

2. **Run rollback SQL in Supabase dashboard**

3. **Redeploy previous code version**

---

## 📊 Monitoring & Alerts

### What to Monitor

**During Deployment:**
- ✅ Vercel build logs (watch for errors)
- ✅ TypeScript compilation (must succeed)
- ✅ Deployment status (Building → Success)

**After Deployment:**
- ✅ Error rate (should stay at 0%)
- ✅ Response time (should stay under 1s)
- ✅ User login success rate
- ✅ API endpoint health

### How to Monitor

**Vercel Built-in Monitoring:**
- Shows deployment status
- Shows build errors
- Shows runtime errors
- FREE for hobby tier

**Vercel Analytics (Upgrade to Pro - $20/month):**
- Real user monitoring
- Performance metrics
- Error tracking
- Worth it once you have 10+ customers

**Supabase Logs:**
- Database errors
- API errors
- Check in Supabase dashboard

### Set Up Alerts

**Vercel Deployment Alerts:**
1. Go to Vercel project settings
2. Enable "Deployment Failed" notifications
3. Add your email/Slack

**Supabase Database Alerts:**
1. Use Supabase monitoring dashboard
2. Set up email alerts for high error rates

---

## 🕐 Maintenance Windows

For risky updates (major features, database migrations), use maintenance windows:

### How to Schedule Maintenance

1. **Pick low-traffic time**
   - Best: 2am - 5am SAST (South African Standard Time)
   - Avoid: 8am - 5pm (business hours)

2. **Notify customers 24 hours ahead**
   - Email or in-app banner
   - "Scheduled maintenance: Jan 15, 3am - 4am. Service may be briefly unavailable."

3. **Deploy during window**

4. **Monitor closely**

5. **Send "all clear" message**

### For Paying Customers:
- Maintenance windows should be < 1 hour
- Maximum 1 per month
- Communicate clearly
- Offer credit if downtime exceeds 1 hour

---

## 🎚️ Feature Flags (Advanced)

For gradual rollouts of risky features:

### Concept
Instead of deploying features to everyone at once, enable them gradually:

```typescript
// Example feature flag
const ENABLE_NEW_QUOTE_BUILDER = process.env.NEXT_PUBLIC_ENABLE_NEW_QUOTE_BUILDER === 'true'

export default function QuotePage() {
  if (ENABLE_NEW_QUOTE_BUILDER) {
    return <NewQuoteBuilder />
  }
  return <OldQuoteBuilder />
}
```

### Rollout Strategy
1. Deploy new feature behind flag (OFF by default)
2. Enable for your own account first
3. Test for 1 day
4. Enable for 10% of users
5. Monitor for issues
6. If good → Enable for 50%
7. If good → Enable for 100%
8. If bad → Turn OFF immediately

### Environment Variables in Vercel
- Set different values for preview vs production
- Quick to toggle without redeploying code

---

## 📝 Deployment Types & Risk Levels

### 🟢 LOW RISK (Deploy Anytime)
- Copy/text changes
- Styling/CSS updates
- Adding new pages (not modifying existing)
- Analytics tracking code
- Performance optimizations (if tested)

**Process:** Normal deployment, light testing

### 🟡 MEDIUM RISK (Test on Preview First)
- New features
- Modifying existing pages
- API endpoint changes
- Adding new dependencies
- Environment variable changes

**Process:**
1. Deploy to preview
2. Test thoroughly
3. Deploy to production
4. Monitor for 30 minutes

### 🔴 HIGH RISK (Maintenance Window Recommended)
- Database schema changes
- Authentication changes
- Payment system changes
- Major refactors
- Breaking API changes

**Process:**
1. Schedule maintenance window
2. Notify customers
3. Have rollback plan ready
4. Deploy during low-traffic time
5. Monitor closely for 2 hours
6. Keep rollback ready for 24 hours

---

## 🚀 Zero-Downtime Deployment Strategy (Advanced)

For when you have 50+ customers and can't afford ANY downtime:

### Database Migrations (Backwards Compatible)

**Bad (Causes Downtime):**
```sql
-- Removes column immediately - old code will break
ALTER TABLE quotes DROP COLUMN old_field;
```

**Good (No Downtime):**
```sql
-- Step 1: Add new column (deploy with code that uses BOTH)
ALTER TABLE quotes ADD COLUMN new_field TEXT;

-- Step 2: Migrate data in background
UPDATE quotes SET new_field = old_field;

-- Step 3: Deploy code that only uses new_field
-- (After this is deployed...)

-- Step 4: Remove old column (days later)
ALTER TABLE quotes DROP COLUMN old_field;
```

### API Changes (Versioned)

Instead of breaking API changes:
```typescript
// Old endpoint (keep it working)
app.get('/api/quotes', oldHandler)

// New endpoint (add alongside)
app.get('/api/v2/quotes', newHandler)

// Gradually migrate clients to v2
// Remove v1 after 30 days
```

---

## 🎯 Deployment Best Practices Summary

### Before You Deploy:
✅ Run `npm run build` locally
✅ Run `npx tsc --noEmit`
✅ Test critical user flows manually
✅ Review git diff for issues
✅ Check environment variables are set
✅ Have rollback plan ready

### During Deployment:
✅ Watch Vercel build logs
✅ Don't deploy on Friday afternoon (you want time to fix issues)
✅ Don't deploy during peak hours (8am - 5pm SAST)

### After Deployment:
✅ Test production site immediately (login, create quote, etc.)
✅ Monitor for errors for 30-60 minutes
✅ Check Supabase logs for database errors
✅ Have rollback button ready for first hour

### Communication:
✅ Notify customers of major updates
✅ Announce new features (builds excitement)
✅ Apologize quickly if something breaks
✅ Be transparent about issues

---

## 🛠️ Quick Reference: Deployment Commands

### Pre-Deployment Testing
```bash
# Build check
npm run build

# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Run dev server for manual testing
npm run dev
```

### Deployment
```bash
# Commit your changes
git add .
git commit -m "feat: Add new feature"

# Push to preview (any branch except main)
git push origin feature/my-feature
# → Creates preview deployment automatically

# Deploy to production
git checkout main
git merge feature/my-feature
git push origin main
# → Deploys to production automatically
```

### Emergency Rollback
```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main

# Option 2: Roll back to specific commit
git reset --hard <good-commit-hash>
git push --force origin main  # CAREFUL!

# Option 3: Use Vercel dashboard (fastest)
# Go to Vercel → Deployments → Promote previous deployment
```

---

## 📞 When Things Go Wrong

### Production is Down - What to Do

**Minute 0-5: Immediate Response**
1. Check Vercel deployment status
2. Check build logs for errors
3. If obvious issue → hotfix immediately
4. If not obvious → rollback to last working version

**Minute 5-15: Assess Impact**
1. How many users affected?
2. What functionality is broken?
3. Can users still work (partially)?
4. Is data safe?

**Minute 15-30: Fix or Communicate**
1. If you can fix in 15 mins → fix it
2. If longer → roll back + send update email
3. Post status update: "We're aware of an issue with X. Rolling back now. ETA: 5 minutes."

**Hour 1-24: Root Cause Analysis**
1. What went wrong?
2. Why did testing not catch it?
3. How to prevent in future?
4. Update deployment checklist

**Day 1-7: Prevention**
1. Add automated test for this issue
2. Update deployment process
3. Consider staging environment
4. Document the incident

---

## ✅ Action Items for You

**Immediate (This Week):**
- [ ] Bookmark Vercel dashboard (for quick rollback access)
- [ ] Set up deployment failure email notifications
- [ ] Create `.github/PULL_REQUEST_TEMPLATE.md` with testing checklist
- [ ] Test rollback process once (practice makes perfect)

**Before First Paying Customer:**
- [ ] Set up Vercel preview deployments workflow
- [ ] Create monitoring dashboard bookmark list
- [ ] Write customer communication templates (for outages)
- [ ] Document emergency contacts (you, Vercel support)

**After 10 Paying Customers:**
- [ ] Consider Vercel Pro ($20/month) for better monitoring
- [ ] Set up automated testing (Playwright or Cypress)
- [ ] Create staging environment
- [ ] Implement feature flags for risky features

**After 50 Paying Customers:**
- [ ] Implement zero-downtime deployment strategy
- [ ] Set up 24/7 monitoring with PagerDuty or similar
- [ ] Create on-call schedule
- [ ] Consider hiring DevOps help

---

**Last Updated**: December 2025
**Review Frequency**: Monthly (or after any major incident)
