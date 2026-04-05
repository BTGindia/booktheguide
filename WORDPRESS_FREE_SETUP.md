# Free WordPress.com Setup for SEO

Use **WordPress.com Free** to manage your site's SEO content (meta tags, FAQs, blog posts) - completely free, no installation needed.

## Step 1: Create Free WordPress.com Site (2 minutes)

1. Go to: https://wordpress.com (Free Plan)
2. Sign up with email
3. Create a new site:
   - Site name: `booktheguide`
   - Domain: `booktheguide.wordpress.com` (free subdomain)
   - Theme: Choose any theme (doesn't matter, we use Next.js frontend)
4. Click **Create Site**

You now have WordPress.com admin at: **https://booktheguide.wordpress.com/wp-admin/**

---

## Step 2: Install WPGraphQL Plugin

⚠️ **Note**: WordPress.com Free plan has limited plugin support. Instead, use **REST API** (built-in, no plugin needed).

Your GraphQL endpoint is ready:
```
https://booktheguide.wordpress.com/wp-json/wp/v2/
```

---

## Step 3: Update Your Next.js Environment

Edit `.env.local`:

```env
# Database (PostgreSQL local or Supabase)
DATABASE_URL="postgresql://postgres:password@localhost:5432/booktheguide?schema=public"

# WordPress REST API (WordPress.com free - no setup needed!)
WORDPRESS_REST_URL="https://booktheguide.wordpress.com/wp-json/wp/v2"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Gemini AI
GEMINI_API_KEY="your-gemini-key"
```

---

## Step 4: Update Next.js WordPress Integration

Since WordPress.com Free doesn't have WPGraphQL, we'll use the REST API instead.

Update `src/lib/wordpress/client.ts`:

```typescript
// Use REST API instead of GraphQL
const REST_URL = process.env.WORDPRESS_REST_URL || '';

export async function wpQuery<T = any>(
  endpoint: string,
  options: { revalidate?: number } = {},
): Promise<T> {
  if (!REST_URL) {
    throw new Error('[WordPress] WORDPRESS_REST_URL is not set');
  }

  const url = `${REST_URL}${endpoint}`;
  const { revalidate = 300 } = options;

  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `[WordPress] REST request failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export async function wpQuerySafe<T = any>(
  endpoint: string,
  options: { revalidate?: number } = {},
): Promise<T | null> {
  try {
    return await wpQuery<T>(endpoint, options);
  } catch (err) {
    console.warn('[WordPress] Query failed (safe mode):', (err as Error).message);
    return null;
  }
}
```

---

## Step 5: Start Your Site

```powershell
# 1. Install dependencies
npm install

# 2. Setup database (PostgreSQL local)
npm run db:push

# 3. Start development server
npm run dev
```

Visit: **http://localhost:3000**

---

## Managing Content in WordPress.com

### Add SEO Meta Tags
1. Go to **https://booktheguide.wordpress.com/wp-admin/**
2. Install **Yoast SEO** plugin (free version)
3. Edit Pages → Add meta tags & OG images

### Add Blog Posts
1. **Pages > Add New**
2. Create content for homepage, about, blog
3. Posts automatically fetch to your Next.js site

### Add Testimonials/Reviews
1. Create a custom post type using **Posts**
2. Query via REST API in your Next.js components

---

## REST API Examples

Get all blog posts:
```bash
curl https://booktheguide.wordpress.com/wp-json/wp/v2/posts
```

Get a specific page:
```bash
curl https://booktheguide.wordpress.com/wp-json/wp/v2/pages/1
```

Use in Next.js:
```typescript
const posts = await wpQuery('/posts?per_page=10');
const page = await wpQuery('/pages/1');
```

---

## What's Free on WordPress.com?

✅ Unlimited pages & posts  
✅ Yoast SEO (free version)  
✅ REST API access  
✅ Custom domain (with upgrade)  
✅ HTTPS  
✅ 200GB storage  
✅ Community support  

❌ WPGraphQL (requires Business plan)  
❌ Custom plugins (requires Business plan)  

---

## Need SEO Plugins?

**Free alternatives for WordPress.com:**
- **Yoast SEO**: Free version available
- **Rank Math**: Free version available
- **All in One SEO**: Free version available

Install from WordPress.com admin panel → Plugins > Add New

---

## Upgrade if Needed (Optional)

If you want more features later:
- **Premium**: $13/month (custom domain, more plugins)
- **Business**: $25/month (WPGraphQL, all plugins, unlimited storage)

But **free tier is perfect to start**!

---

## Next: Configure Rest API

After creating your WordPress.com site, update your code to use the REST API instead of GraphQL.

Ready to start? Visit: **https://wordpress.com** 🚀
