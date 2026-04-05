# ngrok Setup Guide for www.booktheguide.com

## Quick Start (Free Tier - Test Immediately)

1. **Get your authtoken:**
   - Go to: https://dashboard.ngrok.com/signup (create free account)
   - Copy your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

2. **Authenticate ngrok:**
   ```powershell
   C:\Users\Tushar Sehgal\ngrok\ngrok.exe config add-authtoken YOUR_TOKEN_HERE
   ```

3. **Start your Next.js dev server (if not running):**
   ```powershell
   cd "c:\Users\Tushar Sehgal\BTG"
   npm run dev
   ```

4. **Start ngrok tunnel (free temporary URL):**
   ```powershell
   cd "c:\Users\Tushar Sehgal\BTG"
   .\start-ngrok.ps1
   ```
   Or manually:
   ```powershell
   C:\Users\Tushar Sehgal\ngrok\ngrok.exe http 3000
   ```

---

## Custom Domain Setup (www.booktheguide.com)

### Prerequisites:
- ngrok paid account ($8/month Basic plan)
- Access to GoDaddy DNS settings

### Steps:

#### 1. Upgrade ngrok Account
- Login: https://dashboard.ngrok.com/
- Go to: https://dashboard.ngrok.com/billing/plan
- Upgrade to **Basic ($8/mo)** or higher

#### 2. Add Custom Domain in ngrok
- Go to: https://dashboard.ngrok.com/cloud-edge/domains
- Click **"New Domain"**
- Enter: `www.booktheguide.com`
- Click **"Start a tunnel"** - ngrok will show you a CNAME target like:
  ```
  xyz123abc456.tunnel.ngrok.com
  ```
  **COPY THIS VALUE** - you need it for GoDaddy DNS!

#### 3. Configure GoDaddy DNS
- Login to GoDaddy: https://dcc.godaddy.com/manage/dns
- Select domain: `booktheguide.com`
- Add or edit CNAME record:
  
  | Type  | Host | Points to                          | TTL |
  |-------|------|------------------------------------|-----|
  | CNAME | www  | xyz123abc456.tunnel.ngrok.com      | 600 |

- Click **Save**
- **Wait 5-15 minutes** for DNS propagation

#### 4. Start ngrok with Custom Domain
```powershell
cd "c:\Users\Tushar Sehgal\BTG"
.\start-ngrok.ps1
# Choose option [1] for custom domain
```

Or manually:
```powershell
C:\Users\Tushar Sehgal\ngrok\ngrok.exe http --domain=www.booktheguide.com 3000
```

#### 5. Verify Setup
- Visit: https://www.booktheguide.com
- Should show your local Next.js app!

---

## Important Notes

### Next.js Configuration
Your app needs to trust the ngrok domain. Update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### NextAuth Configuration
Update `.env.local` when using ngrok:

```env
# For custom domain
NEXTAUTH_URL=https://www.booktheguide.com

# For temporary URL (update each session)
NEXTAUTH_URL=https://abc123.ngrok-free.app
```

Restart your dev server after updating env vars.

### Database Access
Your local PostgreSQL needs to be accessible. It already is since it's on localhost.

### Keep Tunnel Running
- ngrok must stay running while you want the domain accessible
- Press `Ctrl+C` to stop the tunnel
- URLs change each restart on free tier
- Custom domains remain the same on paid tier

---

## Troubleshooting

**"ERR_NGROK_3004: Domain not found"**
- You need to add the domain in ngrok dashboard first
- Make sure you're on a paid plan

**"This site can't be reached"**
- Check DNS propagation: https://dnschecker.org/#CNAME/www.booktheguide.com
- Wait 5-15 minutes after DNS changes
- Verify CNAME points to correct ngrok tunnel URL

**"Failed to complete tunnel connection"**
- Check your authtoken is configured
- Verify dev server is running on port 3000

**NextAuth callback errors**
- Update NEXTAUTH_URL in .env.local
- Restart dev server

---

## Cost Summary

| Option | Cost | URL Type | Persistent |
|--------|------|----------|------------|
| Free | $0 | Random subdomain | No (changes) |
| Basic | $8/mo | Custom domain | Yes |
| Pro | $20/mo | Multiple domains | Yes |

---

## Quick Commands Reference

```powershell
# Start dev server
npm run dev

# Start ngrok (free)
C:\Users\Tushar Sehgal\ngrok\ngrok.exe http 3000

# Start ngrok (custom domain)
C:\Users\Tushar Sehgal\ngrok\ngrok.exe http --domain=www.booktheguide.com 3000

# View ngrok dashboard (when running)
# Open: http://127.0.0.1:4040

# Check ngrok version
C:\Users\Tushar Sehgal\ngrok\ngrok.exe version

# Reconfigure authtoken
C:\Users\Tushar Sehgal\ngrok\ngrok.exe config add-authtoken NEW_TOKEN
```
