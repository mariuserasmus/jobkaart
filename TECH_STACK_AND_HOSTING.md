# JobKaart - Technology Stack & Hosting Requirements

**Date**: November 29, 2025
**Purpose**: Complete guide for tech stack and server setup

---

## 🏗️ Complete Technology Stack

### **Architecture Overview**

```
┌─────────────────────────────────────┐
│    FRONTEND (What users see)        │
│  Next.js 16 + React 19 + TypeScript │
│  Tailwind CSS 4                      │
│  Status: ✅ BUILT (landing page)    │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│    BACKEND (API Layer)               │
│  Python 3.10+ + FastAPI              │
│  Status: 📝 TO BUILD                │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│    DATABASE                          │
│  PostgreSQL 14+                      │
│  Status: 📝 TO INSTALL               │
└─────────────────────────────────────┘
```

---

## 📋 Technology Breakdown

### **1. Frontend (Already Built!)**

| Component | Technology | Status |
|-----------|-----------|--------|
| Framework | Next.js 16 | ✅ Done |
| UI Library | React 19 | ✅ Done |
| Language | TypeScript | ✅ Done |
| Styling | Tailwind CSS 4 | ✅ Done |
| Location | `c:\Claude\JobKaart\jobkaart-app\` | ✅ Ready |

**Features Completed**:
- Landing page with hero section
- 5 features showcase
- ROI calculator
- Waiting list form
- POPIA compliance
- Afrikaans touches
- PWA-ready
- Mobile-first responsive

**Deployment Options**:
- **Option A**: Vercel (free, recommended for frontend)
- **Option B**: Afrihost server (with Node.js)

---

### **2. Backend (To Build Next)**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Language | Python 3.10+ | Programming language |
| Framework | FastAPI | Modern async web framework |
| ORM | SQLAlchemy | Database interaction |
| Migrations | Alembic | Database schema changes |
| Validation | Pydantic | Request/response validation |
| Auth | python-jose + passlib | JWT tokens + password hashing |
| PDF | WeasyPrint or ReportLab | Quote/invoice PDFs |
| Email | FastAPI-Mail + SendGrid | Transactional emails |

**Python Dependencies** (requirements.txt):
```txt
# Web Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Validation
pydantic==2.5.0
pydantic-settings==2.1.0

# Email
fastapi-mail==1.4.1

# PDF Generation
weasyprint==60.1

# Environment Variables
python-dotenv==1.0.0

# Utilities
python-dateutil==2.8.2
pytz==2023.3
```

---

### **3. Database**

**Recommended**: **PostgreSQL 14+**

**Why PostgreSQL?**
- ✅ Multi-tenancy support (Row-Level Security)
- ✅ Full-text search (customer search)
- ✅ JSONB fields (flexible quote templates)
- ✅ Excellent concurrent writes (multiple users)
- ✅ Strict data integrity (financial data safety)
- ✅ Scalability (10 → 50 → 500 clients)

**NOT SQLite** ❌:
- Single writer at a time (bad for multi-user SaaS)
- No user permissions
- Not meant for web apps

**NOT MySQL** (PostgreSQL is better for JobKaart):
- Weaker full-text search
- Limited JSON support
- No built-in row-level security

---

## 🖥️ Afrihost Server Requirements

### **What Needs to Be Installed**

Send this to Afrihost helpdesk:

#### **Required Software**

1. **Python 3.10 or newer**
   - With pip and venv

2. **PostgreSQL 14+**
   - With postgresql-contrib

3. **Python PostgreSQL Driver**
   - python3-psycopg2

4. **Development Tools**
   - python3-dev
   - libpq-dev
   - build-essential

5. **Node.js 18+** (if hosting frontend on same server)
   - With npm

6. **PDF Generation**
   - wkhtmltopdf

7. **Web Server** (probably already there)
   - Nginx or Apache with reverse proxy support

8. **SSL Certificate**
   - Let's Encrypt

---

## 📧 Email Template for Afrihost Helpdesk

```
Subject: Software Installation Request for JobKaart Application

Hi Afrihost Support,

I'm setting up a Python web application (JobKaart) on my Linux Shared
Service server and need the following software installed:

REQUIRED INSTALLATIONS:
1. Python 3.10 or newer (with pip and venv)
2. PostgreSQL 14 or newer (with postgresql-contrib)
3. python3-psycopg2 (PostgreSQL Python driver)
4. python3-dev, libpq-dev, build-essential
5. Node.js 18+ and npm
6. wkhtmltopdf (for PDF generation)

DATABASE SETUP:
Please create:
- PostgreSQL database: "jobkaart_prod"
- PostgreSQL user: "jobkaart" with a secure password
- Grant all privileges on "jobkaart_prod" to user "jobkaart"

OPTIONAL (if not already present):
- Nginx or Apache with reverse proxy support
- SSL certificate support (Let's Encrypt)
- Supervisor or systemd for process management

ADDITIONAL REQUESTS:
- SSH access (if not already enabled)
- Ability to run long-running Python processes
- Cron job access

Please provide after installation:
- PostgreSQL connection details (host, port, username, password)
- SSH access credentials
- Any resource limits I should be aware of

Server: [Your server name/IP]
Domain: www.jobkaart.co.za

Thank you!
```

---

## 🚀 Deployment Architecture Options

### **Option A: All on Afrihost (Simpler)**

```
Afrihost Linux Server
├── Frontend (Next.js) → Port 3000
├── Backend (FastAPI) → Port 8000
└── PostgreSQL → Port 5432

Nginx routes:
- www.jobkaart.co.za → Frontend
- www.jobkaart.co.za/api → Backend
```

**Pros**:
- Everything in one place
- No external dependencies
- Single bill

**Cons**:
- Shared hosting may have limits
- You manage everything
- Scaling harder

---

### **Option B: Hybrid (Recommended)**

```
Vercel (Free Tier)
└── Frontend (Next.js)
    └── Auto-deploys from GitHub
    └── Points to www.jobkaart.co.za

Afrihost Server
├── Backend (FastAPI) → api.jobkaart.co.za
└── PostgreSQL → localhost

OR

Supabase (Free/Paid)
└── PostgreSQL Database (managed, backed up)
```

**Pros**:
- Frontend on Vercel = fast, reliable, auto-deploy
- Backend on Afrihost = full control
- Database on Supabase = managed, backed up (optional)
- Best performance

**Cons**:
- Multiple services to coordinate
- Slightly more complex setup

**Recommended**: Hybrid approach

---

## 🗂️ Server Folder Structure

```
/home/your_user/jobkaart/
│
├── frontend/                    # Next.js (if hosting here)
│   ├── .next/                  # Build output
│   ├── node_modules/
│   ├── package.json
│   └── ...
│
├── backend/                     # FastAPI
│   ├── venv/                   # Python virtual environment
│   │   ├── bin/
│   │   └── lib/
│   │
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── customer.py
│   │   │   ├── quote.py
│   │   │   ├── job.py
│   │   │   └── invoice.py
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── customers.py
│   │   │   ├── quotes.py
│   │   │   ├── jobs.py
│   │   │   └── invoices.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_service.py
│   │   │   ├── email_service.py
│   │   │   └── whatsapp_service.py
│   │   │
│   │   ├── config.py          # Settings
│   │   └── database.py        # DB connection
│   │
│   ├── alembic/               # Database migrations
│   │   ├── versions/
│   │   └── alembic.ini
│   │
│   ├── tests/
│   ├── requirements.txt
│   ├── .env                   # Environment variables (SECRET!)
│   └── README.md
│
├── scripts/
│   ├── start-frontend.sh
│   ├── start-backend.sh
│   └── backup-db.sh
│
└── logs/
    ├── frontend.log
    └── backend.log
```

---

## 🔐 Environment Variables

### **Backend .env File**

```bash
# Database
DATABASE_URL=postgresql://jobkaart:YOUR_PASSWORD@localhost:5432/jobkaart_prod

# Security
SECRET_KEY=your-super-secret-random-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=hello@jobkaart.co.za

# PayFast (SA Payment Gateway)
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
PAYFAST_SANDBOX=True  # False in production

# WhatsApp (Click-to-Chat - no API key needed)
WHATSAPP_ENABLED=True

# App Settings
ENVIRONMENT=production
FRONTEND_URL=https://www.jobkaart.co.za
BACKEND_URL=https://api.jobkaart.co.za

# File Uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=/home/your_user/jobkaart/uploads

# CORS
CORS_ORIGINS=https://www.jobkaart.co.za,https://jobkaart.co.za
```

**Security Notes**:
- Never commit .env to git!
- Generate SECRET_KEY with: `openssl rand -hex 32`
- Keep backup of .env in secure location

---

## ⚙️ Nginx Configuration

Ask Afrihost to set up (or add via cPanel):

```nginx
# /etc/nginx/sites-available/jobkaart

server {
    listen 80;
    server_name www.jobkaart.co.za jobkaart.co.za;

    # Redirect to https
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.jobkaart.co.za jobkaart.co.za;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/jobkaart.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobkaart.co.za/privkey.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (FastAPI)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads size limit
    client_max_body_size 10M;
}
```

---

## 🔄 Process Management

**Keep Python/Node.js running 24/7**

### **Option A: systemd (Best)**

```bash
# /etc/systemd/system/jobkaart-backend.service

[Unit]
Description=JobKaart FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/home/your_user/jobkaart/backend
Environment="PATH=/home/your_user/jobkaart/backend/venv/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/home/your_user/jobkaart/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable jobkaart-backend
sudo systemctl start jobkaart-backend
sudo systemctl status jobkaart-backend
```

### **Option B: Supervisor** (Easier on shared hosting)

```ini
# /etc/supervisor/conf.d/jobkaart.conf

[program:jobkaart-backend]
command=/home/your_user/jobkaart/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/home/your_user/jobkaart/backend
user=your_user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/your_user/jobkaart/logs/backend.log
```

**Ask Afrihost**: "Can you set up systemd service or install Supervisor for my Python app?"

---

## 📊 Server Resource Requirements

### **Minimum Specs (10-50 clients)**

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 2GB | 4GB |
| Disk | 20GB SSD | 50GB SSD |
| Bandwidth | 100GB/month | Unlimited |
| Databases | PostgreSQL | PostgreSQL |
| SSL | Yes | Yes |
| SSH Access | Yes | Yes |

### **Check with Afrihost**:
- What are your plan's resource limits?
- Can you run long-running processes?
- Do you have SSH access?
- Can you install custom software?

If shared hosting is too limited → Consider VPS upgrade

---

## 🎯 cPanel Specific Considerations

If Afrihost uses cPanel:

### **Features to Check/Request**

1. **Python App Manager**
   - Does cPanel have "Setup Python App" section?
   - If yes, you can deploy through UI

2. **PostgreSQL Manager**
   - Can you create databases?
   - Remote access enabled?

3. **Terminal/SSH Access**
   - Essential for setup
   - Request if not available

4. **Cron Jobs**
   - For automated tasks:
     - Daily invoice reminders
     - Weekly backups
     - Monthly reports

5. **File Upload Limits**
   - Need: 10MB+ for job photos
   - Check/increase if needed

6. **Resource Limits**
   - Max processes
   - Max execution time
   - Memory limit per process

---

## 🗄️ Database Schema (High-Level)

```sql
-- Users (tradies using JobKaart)
users
  - id
  - email
  - password_hash
  - business_name
  - phone
  - created_at

-- Customers (tradies' customers)
customers
  - id
  - user_id  (who owns this customer)
  - name
  - phone
  - email
  - address
  - notes
  - created_at

-- Quotes
quotes
  - id
  - user_id
  - customer_id
  - quote_number
  - description
  - line_items (JSONB)
  - total
  - valid_until
  - status (draft, sent, viewed, accepted, declined)
  - created_at

-- Jobs
jobs
  - id
  - user_id
  - customer_id
  - quote_id (nullable)
  - description
  - status (quoted, scheduled, in_progress, complete, invoiced, paid)
  - scheduled_date
  - notes
  - photos (JSONB array)
  - created_at

-- Invoices
invoices
  - id
  - user_id
  - customer_id
  - job_id
  - invoice_number
  - line_items (JSONB)
  - total
  - status (draft, sent, viewed, paid)
  - due_date
  - paid_date
  - created_at
```

**Multi-Tenancy**: Each table has `user_id` to isolate data per tradie

---

## 🔒 Security Checklist

Before going live:

- [ ] PostgreSQL: Strong password, localhost-only access
- [ ] .env file: Not in git, proper permissions (600)
- [ ] SECRET_KEY: Generated randomly, kept secure
- [ ] HTTPS: SSL certificate installed
- [ ] CORS: Only allow your frontend domain
- [ ] Rate limiting: Prevent abuse
- [ ] SQL injection: Use parameterized queries (SQLAlchemy does this)
- [ ] XSS protection: Sanitize user inputs
- [ ] Password hashing: bcrypt via passlib
- [ ] JWT tokens: Expire after 30 minutes
- [ ] File uploads: Validate file types and sizes
- [ ] Backups: Daily automated database backups

---

## 📅 Development Roadmap

### **Phase 1: Landing Page** ✅ DONE
- Landing page built
- Domain registered
- Hosting account created

### **Phase 2: Server Setup** 📝 NEXT
- Request software installation from Afrihost
- Set up PostgreSQL
- Configure Nginx/Apache
- Deploy landing page

### **Phase 3: Backend Development** 📝 UPCOMING
Week 1:
- Set up FastAPI project structure
- Database models
- Authentication (login/register)

Week 2:
- Customer CRUD endpoints
- Quote builder endpoints
- PDF generation

Week 3:
- Job tracker endpoints
- Invoice endpoints
- Dashboard endpoints

Week 4:
- Email integration
- WhatsApp click-to-chat
- Testing

### **Phase 4: Beta Launch** 📝 JANUARY 2026
- Deploy to production
- Onboard first 10 beta users
- Gather feedback
- Fix bugs

---

## 📞 Quick Reference

### **Domains**
- Main: www.jobkaart.co.za
- API: api.jobkaart.co.za (optional subdomain)

### **Ports**
- Frontend: 3000 (Next.js dev) or 80/443 (production)
- Backend: 8000 (FastAPI)
- Database: 5432 (PostgreSQL)

### **Key Services**
- Hosting: Afrihost Linux Shared Service
- Frontend Deploy: Vercel (recommended) or Afrihost
- Database: PostgreSQL on Afrihost
- Email: SendGrid
- Payments: PayFast
- SSL: Let's Encrypt

### **Development URLs**
- Local frontend: http://localhost:3001 (currently running)
- Local backend: http://localhost:8000 (when built)
- Production: https://www.jobkaart.co.za

---

## 🚦 Tomorrow's Action Items

### **Priority 1: Server Setup**
1. Send email to Afrihost helpdesk (use template above)
2. Wait for confirmation of installed software
3. Get PostgreSQL connection details
4. Get SSH access credentials

### **Priority 2: Deploy Landing Page**
While waiting for server:
1. Push landing page to GitHub
2. Deploy to Vercel
3. Connect www.jobkaart.co.za to Vercel
4. Test live site

### **Priority 3: Start Backend**
On your local Windows machine:
1. Install Python 3.10+ (if not already)
2. Install PostgreSQL (for local development)
3. Create backend project structure
4. Set up FastAPI "Hello World"

---

## 📚 Learning Resources

### **FastAPI**
- Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

### **SQLAlchemy**
- Docs: https://docs.sqlalchemy.org/
- Tutorial: https://docs.sqlalchemy.org/en/20/tutorial/

### **PostgreSQL**
- Docs: https://www.postgresql.org/docs/
- Tutorial: https://www.postgresqltutorial.com/

### **Deployment**
- FastAPI Deploy: https://fastapi.tiangolo.com/deployment/
- Uvicorn: https://www.uvicorn.org/

---

## ✅ Summary

**Technology Stack**:
- Frontend: Next.js + React + TypeScript ✅ Done
- Backend: Python + FastAPI 📝 To build
- Database: PostgreSQL 📝 To install

**Hosting**:
- Server: Afrihost Linux Shared Service
- Domain: www.jobkaart.co.za ✅ Registered
- SSL: Let's Encrypt

**Next Steps**:
1. Email Afrihost for software installation
2. Deploy landing page to Vercel
3. Start building FastAPI backend locally

---

**You're all set! Everything is documented and ready for tomorrow. Get some rest! 🚀**

---

*Document created: November 29, 2025*
*Last updated: November 29, 2025*
*Status: Landing page complete, ready for backend development*
