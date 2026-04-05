# Local Development Setup (No Docker Required)

This project uses PostgreSQL and Next.js. Follow these steps to run locally without Docker.

## Prerequisites

- **Node.js** (v18+): [Download](https://nodejs.org/)
- **PostgreSQL** (v14+): [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Step 1: Install PostgreSQL Locally

### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and choose these options:
   - Set password for `postgres` user (remember this!)
   - Keep port as `5432` (default)
   - Enable pgAdmin (optional, for GUI management)
3. Verify installation:
   ```powershell
   psql --version
   ```

### Alternative: Use Supabase (Cloud PostgreSQL)
If you prefer not to install PostgreSQL locally:
1. Go to https://supabase.com
2. Create a free project
3. Copy the connection string and use it in `.env.local`

## Step 2: Create Local Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Inside psql shell:
CREATE DATABASE booktheguide;
\q
```

## Step 3: Setup Environment Variables

Copy `.env.example` to `.env.local` and update:

```bash
# For LOCAL PostgreSQL:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/booktheguide?schema=public"

# For SUPABASE (production/staging):
# DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"

# Keep these as-is for local dev:
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
```

## Step 4: Install Dependencies & Setup Database

```powershell
# Install npm packages
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# (Optional) Seed sample data
npm run db:seed
```

## Step 5: Run the Development Server

```powershell
npm run dev
```

The app will be available at **http://localhost:3000**

---

## For Production (Vercel + Supabase)

1. **Push your code to GitHub**
2. **Create Supabase project** at https://supabase.com
3. **Deploy to Vercel** at https://vercel.com
4. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL` (from Supabase)
   - `NEXTAUTH_SECRET` (generate a strong secret)
   - `NEXTAUTH_URL` (your Vercel domain)
   - `GEMINI_API_KEY`

---

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not installed or not in PATH
- Solution: Install PostgreSQL or add it to System PATH

### "connection refused"
- PostgreSQL service not running
- Solution: Start PostgreSQL service manually or restart your computer

### "database 'booktheguide' does not exist"
- Database not created yet
- Solution: Run `CREATE DATABASE booktheguide;` in psql

### "Prisma migration failed"
- Solution: Delete `prisma/migrations` and run `npm run db:push` again

---

## Database Management

### Access PostgreSQL CLI:
```powershell
psql -U postgres -d booktheguide
```

### View Prisma Studio (GUI):
```powershell
npm run db:studio
```

### Reset database (caution: deletes all data):
```powershell
npm run db:push -- --force-reset
```

---

## Need Help with WordPress?

WordPress is no longer needed for this setup. Your content/CMS data is now stored in PostgreSQL (managed via Prisma). 

If you had WordPress content you want to migrate, we can extract it and import it into PostgreSQL.
