# Vercel Deployment Guide

## Current Status
✅ **Successfully deployed to Vercel:**
- Production URL: https://codex-v2-bay.vercel.app
- Vercel Alias: https://codex-v2-bay.vercel.app
- GitHub Repository: https://github.com/developermickey/thescriptly

## Fixed Issues
1. ✅ **Prisma Generation** - Added `prisma generate` to build script for Vercel compatibility
2. ✅ **Resend API** - Made email client initialization optional (works without RESEND_API_KEY)
3. ✅ **Razorpay Integration** - Made payment client initialization optional
4. ✅ **Sitemap Generation** - Added error handling for database unavailability during build
5. ✅ **Environment Documentation** - Added comprehensive setup guides

## Database Configuration (REQUIRED FOR FULL FUNCTIONALITY)

### Important Note
The database connection error occurs because the app is trying to connect to a local MySQL database at `127.0.0.1:8889` which doesn't exist in Vercel.

### Step 1: Set Up a Production Database

Choose one of these options:

**Option A: PlanetScale (Recommended for MySQL)**
1. Go to https://planetscale.com
2. Create a free account
3. Create a new database
4. Get the connection string: `mysql://[user]:[password]@[host]/[database]`

**Option B: Supabase (PostgreSQL)**
1. Go to https://supabase.com
2. Create a new project
3. Get the connection string from Project Settings → Database

**Option C: AWS RDS / Azure Database**
- Set up your preferred managed database service
- Get the connection string

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your **codex-v2** project
3. Go to **Settings → Environment Variables**
4. Add the following variables (for Production environment):

```
DATABASE_URL=mysql://[your_database_url]
NEXTAUTH_URL=https://codex-v2-bay.vercel.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
JUDGE0_HOST=https://judge0-ce.p.rapidapi.com
JUDGE0_KEY=[your_judge0_key]
```

**Optional variables (for email & payments):**
```
RESEND_API_KEY=[your_resend_api_key]
RAZORPAY_KEY_ID=[your_razorpay_key_id]
RAZORPAY_KEY_SECRET=[your_razorpay_secret]
```

### Step 3: Generate NEXTAUTH_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in Vercel.

### Step 4: Run Database Migrations

After setting up the database:

```bash
# Locally, with DATABASE_URL pointing to production (use with caution!)
npx prisma migrate deploy

# Or generate Prisma client
npx prisma generate
```

### Step 5: Redeploy

1. **Option A:** Push a new commit to trigger automatic deployment
```bash
git add .
git commit -m "Update environment configuration"
git push origin main
```

2. **Option B:** Manually redeploy from Vercel dashboard
   - Go to Deployments
   - Click the latest deployment
   - Click "Redeploy"

## Troubleshooting

### Error: "Can't reach database server at 127.0.0.1:8889"
- **Cause:** DATABASE_URL not set in Vercel environment variables
- **Fix:** Add DATABASE_URL to Vercel Settings → Environment Variables

### Error: "Prisma Client initialization failed"
- **Cause:** Invalid or missing DATABASE_URL format
- **Fix:** Verify connection string matches your database type (MySQL vs PostgreSQL)

### Pages show "Database not configured"
- **Cause:** DATABASE_URL is not set in production
- **Fix:** This is expected behavior for safety. Add DATABASE_URL when ready

### Build fails with database errors
- **Cause:** Build process tries to generate static pages that need database
- **Fix:** Use `next revalidate` settings or mark routes as dynamic

## Local Development

### Setup
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Set up local MySQL database (make sure it's running on 127.0.0.1:8889)
# Then update DATABASE_URL in .env with local credentials

# Run dev server
npm run dev
```

### Environment Variables for Local Dev
```
DATABASE_URL=mysql://root:password@127.0.0.1:8889/codex_platform
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key
# ... other optional variables
```

## Production Deployment Checklist

- [ ] Database set up and accessible from Vercel
- [ ] DATABASE_URL added to Vercel environment variables
- [ ] NEXTAUTH_URL set to production domain
- [ ] NEXTAUTH_SECRET generated and added
- [ ] Prisma migrations run on production database
- [ ] Optional: Set up RESEND_API_KEY for emails
- [ ] Optional: Set up Razorpay credentials for payments
- [ ] Deploy and test user authentication flow
- [ ] Test database-dependent features (courses, problems, etc.)

## Support

For more information:
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

## Environment Variable Reference

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| DATABASE_URL | String | Yes | Database connection string |
| NEXTAUTH_URL | String | Yes | Production domain URL |
| NEXTAUTH_SECRET | String | Yes | Authentication secret (use openssl rand -base64 32) |
| JUDGE0_HOST | String | Yes | Code execution service endpoint |
| JUDGE0_KEY | String | Yes | Judge0 API key |
| RESEND_API_KEY | String | No | Email service (from resend.com) |
| RAZORPAY_KEY_ID | String | No | Payment service (from razorpay.com) |
| RAZORPAY_KEY_SECRET | String | No | Payment service secret |
