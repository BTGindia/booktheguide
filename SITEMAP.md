# Book The Guide - Complete Sitemap

## Overview
This document outlines the complete sitemap for Book The Guide (BTG), including frontend public pages, user dashboards, and API routes. All pages are interlinked for seamless navigation.

---

## States (Destinations)
| State | Code | Slug |
|-------|------|------|
| Uttarakhand | UK | `uttarakhand` |
| Himachal Pradesh | HP | `himachal-pradesh` |
| Ladakh | LD | `ladakh` |
| Kashmir | JK | `kashmir` |
| Delhi | DL | `delhi` |
| Rajasthan | RJ | `rajasthan` |
| Uttar Pradesh | UP | `uttar-pradesh` |

## Experience Categories (Main)
| Experience | Slug | Activity Types |
|------------|------|----------------|
| Tourist Guides | `TOURIST_GUIDES` | City Tour, Day Hikes, Culinary Tour, Photography Workshop, Art Workshop, Jungle Safari, Pet Friendly Tours |
| Group Trips | `GROUP_TRIPS` | Trekking, Mountaineering Workshop, Day Hikes, Paragliding, Rafting, Skiing, Jungle Safari |
| Adventure Guides | `ADVENTURE_GUIDES` | Trekking, Mountaineering Workshop, Paragliding, Rafting, Skiing |
| Heritage Walks | `HERITAGE_WALKS` | Heritage Walk, Pilgrimage/Cultural Tour |
| Influencer Trips | `TRAVEL_WITH_INFLUENCERS` | Photography Workshop, Culinary Tour, City Tour |

---

## 1. PUBLIC FRONTEND PAGES

### 1.1 Landing & Core Pages
| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero search, featured experiences, trending trips |
| About | `/about` | Company story, mission, team |
| Contact | `/contact` | Contact form, support info |
| Privacy Policy | `/privacy` | Privacy terms |
| Terms & Conditions | `/terms` | Service terms |

### 1.2 Navigation Bar (Dropdowns)

#### Destinations Dropdown
```
Destinations (hover)
├── Uttarakhand      → /destinations?state=uttarakhand
├── Himachal Pradesh → /destinations?state=himachal-pradesh
├── Ladakh           → /destinations?state=ladakh
├── Kashmir          → /destinations?state=kashmir
├── Delhi            → /destinations?state=delhi
├── Rajasthan        → /destinations?state=rajasthan
├── Uttar Pradesh    → /destinations?state=uttar-pradesh
└── View All         → /destinations
```

**State Landing Page Structure:**
Each state shows cities, and each city shows destinations. Subcategories are auto-created when guides upload packages to a city.

```
/destinations?state=himachal-pradesh
├── Bir Billing (subcategory/city)
├── Manali
├── Kasol
├── Dharamshala
└── ...more cities with packages
```

#### Experiences Dropdown
```
Experiences (hover)
├── Tourist Guides      → /experiences/tourist-guides
│   ├── City Tour       → /search?category=TOURIST_GUIDES&activity=city-tour
│   ├── Day Hikes       → /search?category=TOURIST_GUIDES&activity=day-hikes
│   ├── Culinary Tour   → /search?category=TOURIST_GUIDES&activity=culinary-tour
│   └── ...more activities
├── Group Trips         → /experiences/group-trips
│   ├── Trekking        → /search?category=GROUP_TRIPS&activity=trekking
│   ├── Paragliding     → /search?category=GROUP_TRIPS&activity=paragliding
│   └── ...more activities
├── Adventure Guides    → /experiences/adventure-guides
│   ├── Trekking        → /search?category=ADVENTURE_GUIDES&activity=trekking
│   ├── Mountaineering  → /search?category=ADVENTURE_GUIDES&activity=mountaineering
│   ├── Rafting         → /search?category=ADVENTURE_GUIDES&activity=rafting
│   └── ...more activities
├── Heritage Walks      → /experiences/heritage-walks
│   ├── Heritage Walk   → /search?category=HERITAGE_WALKS&activity=heritage-walk
│   └── Cultural Tour   → /search?category=HERITAGE_WALKS&activity=pilgrimage
└── Influencer Trips    → /experiences/travel-with-influencers
    ├── Photography     → /search?category=TRAVEL_WITH_INFLUENCERS&activity=photography
    └── ...more activities
```

#### Inspiration Dropdown
```
Inspiration (hover)
├── Trending Trips    → /trending
├── Heritage & Culture → /search?category=HERITAGE_WALKS
├── Adventure Picks    → /search?category=ADVENTURE_GUIDES
└── Blog               → /inspiration
```

#### Wishlist
```
Wishlist → /wishlist (saved trips)
```

### 1.3 Destinations
| Page | Route | Description |
|------|-------|-------------|
| All Destinations | `/destinations` | Browse all states with filters |
| State Landing | `/destinations?state={slug}` | Packages in specific state |
| Destination Detail | `/destinations/[id]` | Specific destination with packages |

### 1.4 Experiences
| Page | Route | Description |
|------|-------|-------------|
| Experience Category | `/experiences/[category]` | e.g., `/experiences/adventure-guides` |
| Search Results | `/search` | Filtered search with query params |
| Search with Filters | `/search?category=X&state=Y&activity=Z` | Combined filters |

### 1.5 Trips & Packages
| Page | Route | Description |
|------|-------|-------------|
| Trip Detail | `/trips/[slug]` | Package detail page |
| Upcoming Trips | `/upcoming-trips` | User's saved/wishlist trips |
| Trending | `/trending` | Currently trending packages |

### 1.6 Guides
| Page | Route | Description |
|------|-------|-------------|
| Guide Profile | `/guides/[slug]` | Public guide profile |

### 1.7 Bookings
| Page | Route | Description |
|------|-------|-------------|
| Book Fixed Departure | `/book/fixed/[departureId]` | Book a fixed departure |
| Book Personal Trip | `/book/personal/[productId]` | Request personal quote |

### 1.8 Other Pages
| Page | Route | Description |
|------|-------|-------------|
| Inspiration | `/inspiration` | Travel inspiration, blog |
| Corporate Trips | `/corporate-trip` | Corporate inquiry form |
| Wishlist | `/wishlist` | Saved packages |

---

## 2. AUTHENTICATION PAGES

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Register | `/register` | New user signup |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password/[token]` | Set new password |

---

## 3. CUSTOMER DASHBOARD

**Base Route:** `/dashboard/customer`

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard/customer` | Booking summary, upcoming trips |
| My Bookings | `/dashboard/customer/bookings` | All bookings |
| Booking Detail | `/dashboard/customer/bookings/[id]` | Single booking |
| Wishlist | `/dashboard/customer/wishlist` | Saved packages |
| Reviews | `/dashboard/customer/reviews` | My reviews |
| Profile | `/dashboard/customer/profile` | Account settings |

---

## 4. GUIDE DASHBOARD

**Base Route:** `/dashboard/guide`

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard/guide` | Stats, recent bookings |
| Products (Packages) | `/dashboard/guide/products` | All packages |
| Create Package | `/dashboard/guide/products/new` | **CREATE PACKAGE FORM** |
| Edit Package | `/dashboard/guide/products/[id]` | Edit existing package |
| Fixed Departures | `/dashboard/guide/departures` | Manage departures |
| Bookings | `/dashboard/guide/bookings` | Customer bookings |
| Availability | `/dashboard/guide/availability` | Calendar availability |
| Reviews | `/dashboard/guide/reviews` | Customer reviews |
| Profile | `/dashboard/guide/profile` | Guide profile settings |

### 4.1 Package Creation Flow (Mandatory Fields)

When a guide creates a package at `/dashboard/guide/products/new`:

**Required Category Fields:**
1. **Destination** (mandatory)
   - Select from available destinations
   - Destination → City → State mapping
   - System auto-creates city subcategory under state

2. **Experience Category** (mandatory - `packageCategory`)
   - Tourist Guides
   - Group Trips
   - Adventure Guides
   - Heritage Walks
   - Influencer Trips

3. **Activity Type** (mandatory - `activityType`)
   - Based on guide's specializations
   - Auto-creates subcategory under Experience Category

**Example Flow:**
```
Guide: Rakesh (Adventure Guide)
Package: "Paragliding in Bir Billing"

Step 1: Select Destination
  → Bir Billing, Himachal Pradesh
  → System creates/links: Himachal Pradesh > Bir Billing

Step 2: Select Experience Category
  → Adventure Guides

Step 3: Select Activity Type
  → Paragliding
  → System creates/links: Adventure Guides > Paragliding

Result:
  Navigation shows:
  - Destinations > Himachal Pradesh > Bir Billing (has 1+ package)
  - Experiences > Adventure Guides > Paragliding (has 1+ package)
```

---

## 5. ADMIN DASHBOARD (State Admin)

**Base Route:** `/dashboard/admin`

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard/admin` | State-specific stats |
| Bookings | `/dashboard/admin/bookings` | State bookings |
| Guides | `/dashboard/admin/guides` | Manage state guides |
| Guide Detail | `/dashboard/admin/guides/[id]` | View/verify guide |
| Products | `/dashboard/admin/products` | Review packages |
| Product Detail | `/dashboard/admin/products/[id]` | Approve/reject package |
| Departures | `/dashboard/admin/departures` | Approve departures |
| Reviews | `/dashboard/admin/reviews` | Moderate reviews |
| Destinations | `/dashboard/admin/destinations` | Manage destinations |
| Analytics | `/dashboard/admin/analytics` | State analytics |

---

## 6. GUIDE MANAGER DASHBOARD

**Base Route:** `/dashboard/guide-manager`

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard/guide-manager` | Stats overview |
| Guides | `/dashboard/guide-manager/guides` | All guides |
| Products | `/dashboard/guide-manager/products` | All packages |
| Add Guide | `/dashboard/guide-manager/guides/add` | Add new guide |

---

## 7. SUPER ADMIN DASHBOARD

**Base Route:** `/dashboard/super-admin`

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard/super-admin` | Platform-wide stats, Best Sellers |
| Manage Admins | `/dashboard/super-admin/admins` | Add/edit state admins |
| Guides | `/dashboard/super-admin/guides` | All guides platform-wide |
| Best Sellers | `/dashboard/super-admin/best-sellers` | Top performing packages |
| Bookings | `/dashboard/super-admin/bookings` | All bookings |
| Products | `/dashboard/super-admin/products` | All packages |
| Departures | `/dashboard/super-admin/departures` | All departures |
| Destinations | `/dashboard/super-admin/destinations` | Manage destinations |
| States | `/dashboard/super-admin/states` | Manage states |
| Analytics | `/dashboard/super-admin/analytics` | Platform analytics |
| AI Analytics | `/dashboard/super-admin/ai-analytics` | AI chatbot analytics |
| Settings | `/dashboard/super-admin/settings` | Platform settings |

---

## 8. API ROUTES

### 8.1 Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### 8.2 Public APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/destinations` | List destinations |
| GET | `/api/geography` | States, cities, destinations |
| GET | `/api/states` | List active states |

### 8.3 Customer APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/bookings` | Customer bookings |
| POST | `/api/corporate-inquiry` | Corporate trip request |
| GET | `/api/reviews` | Get reviews |

### 8.4 Guide APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/guide/products` | Guide packages |
| GET/POST | `/api/guide/departures` | Guide departures |
| GET | `/api/guide/bookings` | Guide's bookings |

### 8.5 Admin APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/admin/guides` | Manage guides |
| GET/PATCH | `/api/admin/products` | Manage packages |
| GET | `/api/admin/bookings` | Admin bookings |
| GET | `/api/admin/analytics` | State analytics |

### 8.6 Super Admin APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/super-admin/admins` | Manage admins |
| GET | `/api/super-admin/guides` | All guides |
| GET | `/api/super-admin/best-sellers` | Best seller data |
| GET | `/api/super-admin/analytics` | Platform analytics |
| GET | `/api/super-admin/ai-analytics` | AI analytics |
| GET | `/api/super-admin/dashboard` | Dashboard data |

### 8.7 Upload API
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Image upload |

---

## 9. NAVIGATION INTERLINKING

### Header Navigation (Logged Out / Customer)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🟢 Book The Guide    Destinations ▼  Experiences ▼  Inspiration ▼  Wishlist  │  [Log In] [Sign Up]  🔖
└─────────────────────────────────────────────────────────────────────────┘
```

### Header Navigation (Guide)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🟢 Book The Guide                                       [Dashboard]  👤
└─────────────────────────────────────────────────────────────────────────┘
```

### Footer Links
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Destinations          Experiences          Company         Support    │
│  ─────────────         ────────────         ───────         ───────    │
│  Uttarakhand           Tourist Guides       About Us        Contact    │
│  Himachal Pradesh      Group Trips          Careers         FAQs       │
│  Ladakh                Adventure Guides     Blog            Help       │
│  Kashmir               Heritage Walks       Press                      │
│  Delhi                 Influencer Trips                                │
│  Rajasthan                                                             │
│  Uttar Pradesh                                                         │
│                                                                        │
│  Terms | Privacy | © 2026 Book The Guide                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. DYNAMIC SUBCATEGORY SYSTEM

### How Subcategories Work

1. **State → City Subcategories**
   - When guide creates package for destination in City X, State Y
   - City X appears as subcategory under State Y in navigation
   - Only cities with active packages appear

2. **Experience → Activity Subcategories**
   - When guide selects Activity Type Z under Experience Category
   - Activity Z appears as subcategory under that Experience
   - Only activities with active packages appear

### API for Dynamic Dropdowns

**Destinations with Subcategories:**
```
GET /api/navigation/destinations
Response:
{
  "states": [
    {
      "name": "Himachal Pradesh",
      "slug": "himachal-pradesh",
      "cities": [
        { "name": "Bir Billing", "packageCount": 5 },
        { "name": "Manali", "packageCount": 12 },
        { "name": "Kasol", "packageCount": 8 }
      ]
    },
    ...
  ]
}
```

**Experiences with Subcategories:**
```
GET /api/navigation/experiences
Response:
{
  "categories": [
    {
      "name": "Adventure Guides",
      "slug": "adventure-guides",
      "activities": [
        { "name": "Paragliding", "packageCount": 3 },
        { "name": "Trekking", "packageCount": 15 },
        { "name": "Rafting", "packageCount": 7 }
      ]
    },
    ...
  ]
}
```

---

## 11. PAGE RELATIONSHIPS

```
                                    ┌─────────────┐
                                    │   Homepage  │
                                    │      /      │
                                    └──────┬──────┘
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
             ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
             │ Destinations │        │ Experiences │        │ Inspiration │
             │ /destinations│        │ /experiences│        │  /trending  │
             └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
                    │                      │                      │
         ┌──────────┼──────────┐           │                      │
         │          │          │           │                      │
   ┌─────▼─────┐ ┌──▼──┐ ┌─────▼─────┐     │                      │
   │State Page │ │...  │ │State Page │     │                      │
   │?state=uk  │ │     │ │?state=hp  │     │                      │
   └─────┬─────┘ └─────┘ └─────┬─────┘     │                      │
         │                     │           │                      │
         └─────────┬───────────┘           │                      │
                   │                       │                      │
            ┌──────▼──────┐         ┌──────▼──────┐               │
            │ Trip Detail │         │   Search    │               │
            │ /trips/slug │◄────────│  /search    │◄──────────────┘
            └──────┬──────┘         └──────┬──────┘
                   │                       │
            ┌──────▼──────┐         ┌──────▼──────┐
            │ Book Fixed  │         │Guide Profile│
            │/book/fixed/x│         │/guides/slug │
            └─────────────┘         └─────────────┘
```

---

## 12. SEO & META STRUCTURE

Each page has proper meta tags:

| Page Type | Title Format | Description |
|-----------|--------------|-------------|
| Homepage | Book The Guide - Authentic Travel Experiences | Discover curated travel experiences... |
| State Page | {State} Travel Packages - Book The Guide | Explore {State} with local guides... |
| Experience | {Category} - Book The Guide | Browse {Category} experiences... |
| Trip Detail | {Package Title} \| {State} - BTG | {Package description}... |
| Guide Profile | {Guide Name} - Certified Guide - BTG | Book trips with {Guide Name}... |

---

## Summary

- **7 States** as main destination categories
- **5 Experience Categories** as main experience types
- **Dynamic subcategories** auto-created from guide packages
- **Navigation dropdowns** show states with city subcategories, experiences with activity subcategories
- **All pages interlinked** through search, filters, and direct links
- **Guide package creation** requires mandatory destination + experience + activity selection
