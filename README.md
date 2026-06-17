This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env` file and update with your local database URL
   - Database must be running at the configured host:port

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3.000) to see the result.

## Environment Variables

### Local Development (`.env`)
```
DATABASE_URL=mysql://user:password@localhost:3306/database_name
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
RESEND_API_KEY=your-resend-key (optional)
RAZORPAY_KEY_ID=your-razorpay-key (optional)
RAZORPAY_KEY_SECRET=your-razorpay-secret (optional)
JUDGE0_HOST=https://judge0-ce.p.rapidapi.com
JUDGE0_KEY=your-judge0-api-key
```

### Production Deployment (Vercel)

1. **Go to Vercel Dashboard:**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables

2. **Add the following variables:**

   **Database (Required):**
   - `DATABASE_URL` - Your production database URL
     - Format: `mysql://user:password@host:port/database`
     - Or use a managed service like PlanetScale, Supabase, etc.

   **Authentication:**
   - `NEXTAUTH_URL` - Your production domain (e.g., https://myapp.vercel.app)
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

   **Optional Services:**
   - `RESEND_API_KEY` - Email service (get from [resend.com](https://resend.com))
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payments (get from [razorpay.com](https://razorpay.com))
   - `JUDGE0_HOST` & `JUDGE0_KEY` - Code execution service

3. **Deploy:**
   - Push to GitHub
   - Vercel will automatically deploy on push
   - Or manually trigger deployment from Vercel dashboard

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
