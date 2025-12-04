# 🚀 cPanel Git Deployment Guide - JobKaart

## Deploy from Git & Build on Server (Recommended!)

This is much better than building locally and copying files. Let the server do the work!

---

## Prerequisites

Before you start:
- ✅ All changes committed to git (we just did this!)
- ✅ Git repository pushed to GitHub/GitLab/Bitbucket
- ✅ cPanel account with Git Version Control feature
- ✅ SSH access (optional, but helpful)

---

## Step 1: Push to Remote Repository (2 minutes)

If you haven't already, push your local commits to GitHub:

```bash
# If you don't have a remote yet, add it:
git remote add origin https://github.com/yourusername/jobkaart.git

# Push all commits
git push -u origin main
```

---

## Step 2: Deploy via cPanel Git Version Control (5 minutes)

### 2.1 Access Git Version Control

1. **Login to cPanel**
2. **Search for**: "Git Version Control"
3. **Click**: "Create"

### 2.2 Configure Repository

Fill in the form:

| Field | Value |
|-------|-------|
| **Clone URL** | `https://github.com/yourusername/jobkaart.git` |
| **Repository Path** | `/home/username/repositories/jobkaart` |
| **Repository Name** | `jobkaart` |

**Note**: Don't clone directly to `public_html` yet - clone to a separate folder first.

Click **Create**.

### 2.3 Pull Latest Code

After the repository is created:

1. Click **"Manage"** next to your repository
2. Click **"Pull or Deploy"** tab
3. Click **"Update from Remote"** to pull latest code
4. You should see: "Pull complete"

---

## Step 3: Setup Deployment to public_html (3 minutes)

### Option A: Symlink (Recommended)

Create a symlink from the app folder to public_html:

```bash
# SSH into server
ssh username@jobkaart.co.za

# Remove existing public_html (backup first if needed!)
cd ~
mv public_html public_html.backup

# Create symlink
ln -s ~/repositories/jobkaart/jobkaart-app public_html
```

### Option B: Deploy Script

Or use cPanel's deployment script feature:

1. In Git Version Control → **Manage** → **Pull or Deploy**
2. **Deployment Path**: `/home/username/public_html`
3. **Enable**: "Deploy HEAD commit"
4. Save

---

## Step 4: Install Dependencies on Server (5 minutes)

### Via SSH (Fastest):

```bash
ssh username@jobkaart.co.za
cd public_html
npm install --production
```

### Via cPanel Terminal:

1. cPanel → **Terminal**
2. Run:
   ```bash
   cd public_html
   npm install --production
   ```

---

## Step 5: Build on Server (10 minutes)

### 5.1 Create .env.local on Server

**CRITICAL**: The `.env.local` file is NOT in git (and shouldn't be!).

Via SSH or cPanel File Manager, create `public_html/.env.local`:

```bash
# Supabase Configuration (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# PayFast Configuration (LIVE!)
PAYFAST_MERCHANT_ID=your-live-merchant-id
PAYFAST_MERCHANT_KEY=your-live-merchant-key
PAYFAST_PASSPHRASE=your-live-passphrase
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=hello@jobkaart.co.za

# Application Configuration
NEXT_PUBLIC_APP_URL=https://jobkaart.co.za
NODE_ENV=production
```

### 5.2 Build the App

```bash
cd public_html
npm run build
```

**This might take 5-10 minutes on shared hosting.**

If it fails with memory errors, see "Troubleshooting" below.

---

## Step 6: Setup Node.js App in cPanel (3 minutes)

1. **cPanel** → **Setup Node.js App**
2. **Click**: "Create Application"

| Field | Value |
|-------|-------|
| **Node.js Version** | 18.x or higher |
| **Application Mode** | Production |
| **Application Root** | `/home/username/public_html` |
| **Application URL** | `https://jobkaart.co.za` |
| **Application Startup File** | `server.js` |
| **Passenger Log** | Enabled |

3. **Environment Variables** - Add each from `.env.local`:
   - Click "Add variable" for each one
   - Copy/paste from `.env.local`

4. **Click**: "Create"

5. **Restart** the application

---

## Step 7: Test! (5 minutes)

1. **Visit**: `https://jobkaart.co.za`
2. **Test signup**: Create account
3. **Test login**: Login works
4. **Test dashboard**: All features load
5. **Test admin**: `/admin` works

---

## Future Updates (Super Easy!)

When you make changes locally:

```bash
# 1. Commit changes
git add -A
git commit -m "Your changes"

# 2. Push to remote
git push origin main

# 3. Pull on server (via cPanel or SSH)
ssh username@jobkaart.co.za
cd public_html
git pull origin main

# 4. Rebuild (only if you changed code, not just content)
npm run build

# 5. Restart Node.js app in cPanel
```

**Even easier**: Set up auto-deployment in cPanel Git settings!

---

## Troubleshooting

### Build Fails with "JavaScript heap out of memory"

Shared hosting has limited RAM. Try:

**Option 1: Increase Node memory**
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

**Option 2: Build locally and copy only `.next` folder**
```bash
# Build locally
npm run build

# Upload ONLY .next folder via FTP to server
# Don't upload node_modules or source files
```

**Option 3: Use VPS/dedicated server**
If shared hosting keeps failing, you might need more resources.

### Git Pull Fails

```bash
# If you have local changes on server, stash them first:
git stash
git pull origin main
git stash pop
```

### Environment Variables Not Working

Make sure you:
1. Created `.env.local` on server
2. Added all vars to Node.js App settings in cPanel
3. Restarted the Node.js app after adding vars

### App Shows 502 Bad Gateway

1. Check Node.js app is running in cPanel
2. Check logs: cPanel → Node.js App → View Logs
3. Restart the app
4. Check `server.js` exists

### Build Works But App Crashes

Check the logs:
```bash
# Via SSH
tail -f ~/logs/jobkaart_stderr.log
tail -f ~/logs/jobkaart_stdout.log
```

Or in cPanel → Node.js App → View Application Logs

---

## Advantages of This Approach

✅ **One-command updates**: Just `git pull` + `npm run build`
✅ **Version control**: Easy to rollback if something breaks
✅ **No manual file copying**: Git handles everything
✅ **Team friendly**: Multiple developers can deploy
✅ **Automated**: Can set up webhooks for auto-deploy on push

---

## Git Workflow Best Practices

### Development → Staging → Production

**Development (Local)**:
```bash
git checkout develop
# Make changes
git add -A
git commit -m "New feature"
git push origin develop
```

**Staging Server** (if you have one):
```bash
ssh staging@server
cd public_html
git pull origin develop
npm run build
```

**Production Server** (after testing):
```bash
# Merge to main
git checkout main
git merge develop
git push origin main

# Deploy to production
ssh production@server
cd public_html
git pull origin main
npm run build
```

---

## Quick Reference

### Deploy New Changes
```bash
# On server
cd public_html
git pull origin main
npm install  # Only if package.json changed
npm run build  # Only if code changed
# Restart Node.js app in cPanel
```

### Rollback to Previous Version
```bash
# On server
cd public_html
git log --oneline -5  # See recent commits
git reset --hard abc123  # Replace abc123 with commit hash
npm run build
# Restart Node.js app
```

### Check Current Version
```bash
cd public_html
git log -1 --oneline
```

---

## Security Notes

⚠️ **NEVER commit `.env.local` to git!**

It's already in `.gitignore`, but double-check:
```bash
git check-ignore .env.local
# Should output: .env.local
```

If it's not ignored:
```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Ignore .env.local"
```

---

**You're all set! Much better than manual FTP uploads! 🚀**
