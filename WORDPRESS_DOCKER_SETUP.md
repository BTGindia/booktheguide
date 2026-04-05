# WordPress CMS + Next.js Setup Guide

Your site now uses **WordPress as a Headless CMS** for content and SEO management, while **Next.js** handles the frontend display.

## Architecture

```
WordPress (CMS) ──WPGraphQL──> Next.js (Frontend)
├─ SEO Meta Tags
├─ FAQ Content
├─ Internal Links
├─ Page Content
└─ Blog Posts
```

## Quick Start (Local Development with Docker)

### Prerequisites
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: (comes with Docker Desktop)
- **Node.js** (v18+): [Download](https://nodejs.org/)

### Step 1: Start WordPress & Database

```powershell
# Navigate to your project
cd c:\Users\Tushar Sehgal\BTGLatest\BTG

# Start WordPress and MariaDB using Docker Compose
docker-compose up -d

# Wait for services to start (20-30 seconds)
# Check status:
docker-compose ps
```

You should see:
- `btg-db-1` (MariaDB) - Up
- `btg-wordpress-1` (WordPress) - Up
- `btg-wpcli-1` (WordPress CLI) - Up

### Step 2: Access WordPress

1. Open browser: **http://localhost:8000**
2. Complete WordPress setup:
   - Site Title: `Book The Guide`
   - Username: Create admin user
   - Password: Create strong password
   - Email: Your email
3. Click "Install WordPress"

### Step 3: Install WPGraphQL Plugin (Required for Next.js)

1. Go to **WordPress Admin Dashboard** (http://localhost:8000/wp-admin)
2. Navigate to **Plugins > Add New**
3. Search: `WPGraphQL`
4. Click **Install Now** on "WPGraphQL by Jason Bahl"
5. Click **Activate**

### Step 4: Configure Next.js Environment

Copy `.env.example` to `.env.local` and update:

```bash
# Database (use PostgreSQL locally or Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/booktheguide?schema=public"

# WordPress GraphQL Endpoint (Docker local)
WORDPRESS_GRAPHQL_URL="http://localhost:8000/graphql"

# WordPress secrets (match docker-compose.yml)
WORDPRESS_PREVIEW_SECRET="btg-preview-secret-2026"
REVALIDATION_SECRET="btg-revalidation-secret-2026"

# Auth & API
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
```

### Step 5: Setup Next.js

```powershell
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Setup PostgreSQL database
npm run db:push

# Start development server
npm run dev
```

Your app is now running at **http://localhost:3000**

---

## Managing Content in WordPress

### 1. SEO Meta Tags
- Go to WordPress Admin > Pages > Home
- Use **Yoast SEO** or **All in One SEO** plugin to edit:
  - Page Title
  - Meta Description
  - OG Image
  - Keywords

### 2. Homepage Sections
Create custom content blocks for:
- Hero Title & Subtitle
- How It Works Feature Boxes
- Categories Description
- Trending Trips Label
- FAQ Items
- Internal Links (for SEO)

### 3. Adding FAQs (for Schema Markup)
- Create FAQ posts using **FAQ plugin** or custom post type
- Next.js automatically converts to JSON-LD schema

### 4. Blog Posts for SEO
- Create blog posts in WordPress
- Next.js fetches and displays them at `/blog`

---

## Production Deployment

### Option 1: WordPress on Managed Hosting + Vercel Frontend

1. **Get a WordPress Host** (recommended):
   - WordPress.com (managed WordPress)
   - Kinsta
   - WP Engine
   - HostGator + Managed WordPress

2. **Update .env in Vercel**:
   ```env
   WORDPRESS_GRAPHQL_URL="https://your-wordpress-domain.com/graphql"
   WORDPRESS_PREVIEW_SECRET="your-secret"
   REVALIDATION_SECRET="your-secret"
   DATABASE_URL="postgresql://..."  # Supabase
   ```

3. Deploy Next.js to Vercel

### Option 2: Self-Hosted on VPS

Run Docker on your VPS:
```bash
# SSH into your server
ssh user@your-vps-ip

# Install Docker
# (follow DigitalOcean/AWS/Linode Docker installation guide)

# Clone repository
git clone https://github.com/your-repo/btg.git
cd btg

# Create .env file with production values
nano .env.local

# Start containers
docker-compose up -d

# Run migrations
docker-compose exec wordpress wp core install \
  --url="https://cms.booktheguide.com" \
  --title="Book The Guide" \
  --admin_user="admin" \
  --admin_password="$RANDOM-PASSWORD" \
  --admin_email="admin@booktheguide.com"
```

---

## Troubleshooting

### WordPress won't start
```powershell
# Check logs
docker-compose logs wordpress

# Restart
docker-compose restart wordpress

# Full reset (removes data!)
docker-compose down -v
docker-compose up -d
```

### GraphQL endpoint not responding
- Confirm WordPress is running: http://localhost:8000
- Confirm WPGraphQL plugin is activated
- Check WordPress debug logs: `/wp-content/debug.log`

### Next.js can't reach WordPress
```powershell
# From Next.js container, test WordPress
docker-compose exec next curl http://wordpress:80/graphql

# From your machine (outside Docker)
curl http://localhost:8000/graphql
```

### Database connection errors
```powershell
# Reset database
docker-compose down -v
docker-compose up -d
# Reinstall WordPress
```

---

## Adding WPGraphQL Queries

### Custom Page Fields (Optional)

Edit WordPress theme options or use **Advanced Custom Fields (ACF)** plugin to add custom fields, then query them:

```graphql
query GetHomePage {
  pages(where: { id: 1 }) {
    nodes {
      title
      content
      seo {
        title
        metaDesc
      }
      # Custom ACF fields (if using ACF)
      heroTitle
      heroImage {
        sourceUrl
      }
    }
  }
}
```

Your Next.js code in `src/lib/wordpress/` handles these queries automatically.

---

## Stop/Start Services

```powershell
# Stop WordPress (data persists)
docker-compose stop

# Start again
docker-compose start

# Full cleanup (removes everything)
docker-compose down -v
```

---

## File Structure

```
project/
├── docker-compose.yml          # WordPress + MariaDB config
├── wordpress/
│   └── theme/                  # Your custom WordPress theme
├── src/
│   ├── lib/wordpress/          # WPGraphQL queries & fetching
│   ├── components/wordpress/   # WordPress content components
│   └── app/page.tsx            # Homepage using WordPress content
└── .env.local                  # WordPress URLs & secrets
```

---

## Next Steps

1. ✅ Start Docker: `docker-compose up -d`
2. ✅ Access WordPress: http://localhost:8000
3. ✅ Activate WPGraphQL plugin
4. ✅ Configure .env.local with WordPress URL
5. ✅ Start Next.js: `npm run dev`
6. ✅ Visit http://localhost:3000

Happy blogging! 🚀
