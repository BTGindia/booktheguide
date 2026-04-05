# Deploy to Vercel with GoDaddy Domain

## Complete Deployment Guide

Your setup: **Next.js (Vercel) + PostgreSQL (Supabase) + WordPress.com (SEO CMS)**

---

## Step 1: Set Up Supabase (PostgreSQL Database) - 5 minutes

### Create Free Supabase Project

1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub (easiest)
4. Click **"New Project"**
   - Organization: Create new
   - Project name: `booktheguide`
   - Database password: Create strong password
   - Region: Choose closest to you (India: Singapore)
   - Click **"Create new project"**

### Get Database Connection String

1. Wait for project to be created (2-3 minutes)
2. Go to **Settings > Database > Connection strings**
3. Select **Prisma** from dropdown
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with the password you created
6. Save it for later

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres?schema=public
```

---

## Step 2: Push Your Database Schema

Run from your project folder:

```powershell
# 1. Set DATABASE_URL temporarily
$env:DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres?schema=public"

# 2. Push schema to Supabase
npm run db:push

# 3. Check if successful
npm run db:studio
```

✅ You'll see your database tables in Prisma Studio

---

## Step 3: Deploy to Vercel - 10 minutes

### Push Code to GitHub

```powershell
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Add your GitHub repository
git remote add origin https://github.com/YOUR-USERNAME/booktheguide.git
git branch -M main
git push -u origin main
```

### Deploy via Vercel

1. Go to: https://vercel.com
2. Click **"Import Project"**
3. Select **"Import Git Repository"**
4. Paste your GitHub repo URL
5. Click **"Continue"**
6. Configure project:
   - **Project Name**: `booktheguide`
   - **Framework**: Next.js
   - Click **"Continue"**

### Add Environment Variables

In the Vercel deployment form, add these:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres?schema=public
NEXTAUTH_URL=https://www.booktheguide.com
NEXTAUTH_SECRET=generate-random-secret-here
NEXT_PUBLIC_APP_URL=https://www.booktheguide.com
GEMINI_API_KEY=your-gemini-api-key
WORDPRESS_GRAPHQL_URL=https://your-wordpress-site.wordpress.com/wp-json/wp/v2
```

To generate NEXTAUTH_SECRET:
```powershell
# Run this to generate a random secret
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

7. Click **"Deploy"**
8. Wait for deployment to complete ✅

Your site is now live at: `https://booktheguide.vercel.app`

---

## Step 4: Connect GoDaddy Domain to Vercel - 5 minutes

### In Vercel Dashboard

1. Go to your project: https://vercel.com/dashboard
2. Click on **"booktheguide"** project
3. Go to **Settings > Domains**
4. Click **"Add Domain"**
5. Enter: `www.booktheguide.com`
6. Click **"Add"**
7. Vercel shows you **4 nameserver records** to add to GoDaddy

Example:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
ns3.vercel-dns.com
ns4.vercel-dns.com
```

### In GoDaddy Dashboard

1. Go to: https://godaddy.com (login)
2. Click **"My Products"**
3. Find your domain `booktheguide.com`
4. Click **"DNS"** or **"Manage DNS"**
5. Find **"Nameservers"** section
6. Replace existing nameservers with Vercel's 4 nameservers (from above)
7. Save changes

### Verify Domain Connection

1. Go back to Vercel dashboard
2. Wait 5-10 minutes for DNS propagation
3. You should see: ✅ **Domain verified**
4. Your site now runs at: **https://www.booktheguide.com**

---

## Step 5: Add Root Domain (booktheguide.com without www)

### In Vercel

1. Still in **Domains** section
2. Click **"Add Domain"** again
3. Enter: `booktheguide.com` (without www)
4. It might auto-connect or show options
5. Ensure redirection: `booktheguide.com → www.booktheguide.com`

---

## Step 6: SSL Certificate (Automatic)

Vercel automatically provisions free SSL certificate via Let's Encrypt.
- ✅ All traffic is HTTPS
- ✅ Certificate auto-renews
- ✅ No manual setup needed

---

## Troubleshooting

### Domain not connecting

```powershell
# Check DNS propagation
nslookup www.booktheguide.com
# Should show Vercel nameservers
```

If still not working:
1. Wait 24 hours for full DNS propagation
2. Clear browser cache (Ctrl + Shift + Delete)
3. Try incognito window

### Environment variables not working

1. Update `.env.local` locally first
2. Test locally: `npm run dev`
3. Update Vercel Settings > Environment Variables
4. Re-deploy: Click **"Redeploy"** in Vercel

### Database connection errors

1. Verify Supabase connection string in environment variables
2. Check Supabase project is active
3. Try: `npm run db:studio` to test connection

---

## Final Checklist

- [ ] Supabase project created ✅
- [ ] Database schema pushed ✅
- [ ] Code pushed to GitHub ✅
- [ ] Deployed to Vercel ✅
- [ ] Environment variables added ✅
- [ ] GoDaddy nameservers updated ✅
- [ ] Domain verified on Vercel ✅
- [ ] Site accessible at www.booktheguide.com ✅

---

## Your Production URLs

| Component | URL |
|-----------|-----|
| **Website** | https://www.booktheguide.com |
| **Database** | Supabase Dashboard |
| **Deployments** | https://vercel.com/dashboard |
| **WordPress CMS** | https://your-wordpress.wordpress.com |

---

## Optional: Add WordPress.com CMS

If you want SEO management:

1. Create free WordPress.com site
2. Install Yoast SEO plugin
3. Get your WordPress REST URL
4. Update `.env.local` in Vercel:
   ```
   WORDPRESS_GRAPHQL_URL=https://your-wordpress-site.wordpress.com/wp-json/wp/v2
   ```
5. Redeploy

---

## Make Future Changes

After deployment, any time you make code changes:

```powershell
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically deploys (takes 1-2 minutes)

---

## Support

- **Vercel Help**: https://vercel.com/docs
- **Supabase Help**: https://supabase.com/docs
- **GoDaddy Help**: https://www.godaddy.com/help

**Your site is ready to go live!** 🚀
