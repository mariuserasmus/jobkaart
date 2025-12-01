# JobKaart - Landing Page

Simple job management for South African tradespeople.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
jobkaart-app/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Main landing page
│   └── globals.css      # Global styles
├── components/
│   ├── Hero.tsx         # Hero section with CTA
│   ├── Features.tsx     # 5 feature cards
│   ├── ROI.tsx          # ROI calculator and comparison
│   ├── WaitingList.tsx  # Signup form
│   └── Footer.tsx       # Footer
└── public/              # Static assets
```

## Features

- ✅ Responsive design (mobile-first)
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Smooth scroll navigation
- ✅ Waiting list form (client-side for now)
- ✅ ROI calculator display
- ✅ Feature comparison table

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect Next.js and deploy

### Custom Domain

After deployment:
1. Add your domain (jobkaart.co.za) in Vercel dashboard
2. Update your DNS settings as instructed
3. SSL certificate will be auto-provisioned

## Form Integration

The waiting list form currently logs to console. To integrate with a backend:

### Option 1: Google Sheets (Free)
- Use [Google Sheets API](https://developers.google.com/sheets/api)
- Or use a service like [SheetDB](https://sheetdb.io/)

### Option 2: Airtable
- Create an Airtable base
- Use their API to submit form data

### Option 3: Email Service
- Use [SendGrid](https://sendgrid.com/) or [Resend](https://resend.com/)
- Email yourself each submission

### Option 4: Database
- Add Supabase for PostgreSQL database
- Store submissions in a table

## Next Steps

1. Register domain: jobkaart.co.za
2. Deploy to Vercel
3. Set up form backend (Google Sheets recommended for MVP)
4. Test on mobile devices
5. Share with potential customers
6. Track signups!

## License

Private project - All rights reserved