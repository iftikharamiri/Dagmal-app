# Norwegian Restaurant Deals

A production-ready, mobile-first web app for discovering restaurant deals in Norway. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🇳🇴 **Norwegian UI** - Complete Norwegian language interface
- 📱 **Mobile-first** - Optimized for mobile devices with responsive design
- 🔐 **Authentication** - Secure user accounts with Supabase Auth
- 🎯 **Deal Discovery** - Browse and filter restaurant deals
- ❤️ **Favorites** - Save favorite restaurants
- 📍 **Interactive Map** - Find nearby restaurants with Leaflet maps
- 🎫 **Claim System** - Comprehensive deal claiming with validation
- 🔄 **Real-time Data** - Live updates with React Query
- 📊 **User Dashboard** - Track claimed deals and preferences
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 🌐 **PWA Ready** - Progressive Web App with offline support

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with CSS custom properties
- **Backend**: Supabase (Auth, Database, RLS, Realtime)
- **State**: @tanstack/react-query for server state
- **Routing**: React Router v6
- **Maps**: react-leaflet + Leaflet
- **Icons**: lucide-react
- **Notifications**: sonner
- **PWA**: Vite PWA plugin
- **Testing**: Vitest, React Testing Library
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd norwegian-restaurant-deals
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   
   Run this SQL in your Supabase SQL Editor:

   ```sql
   create table public.profiles (
     id uuid primary key references auth.users(id) on delete cascade,
     display_name text,
     phone text,
     cuisines text[] default '{}',
     dietary text[] default '{}',
     favorites uuid[] default '{}',
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   create table public.restaurants (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     description text,
     image_url text,
     phone text,
     address text,
     city text,
     lat double precision not null,
     lng double precision not null,
     categories text[] default '{}',
     dine_in boolean default true,
     takeaway boolean default true,
     created_at timestamptz default now()
   );

   create table public.deals (
     id uuid primary key default gen_random_uuid(),
     restaurant_id uuid not null references public.restaurants(id) on delete cascade,
     title text not null,
     discount_value numeric not null,
     discount_type text check (discount_type in ('percent','amount')) default 'amount',
     original_price numeric,
     final_price numeric,
     start_time time not null,
     end_time time not null,
     days int[] default '{1,2,3,4,5,6,7}',
     per_user_limit int default 2,
     dine_in boolean default true,
     takeaway boolean default true,
     active boolean default true,
     created_at timestamptz default now()
   );

   create table public.claims (
     id uuid primary key default gen_random_uuid(),
     deal_id uuid not null references public.deals(id) on delete cascade,
     user_id uuid not null references auth.users(id) on delete cascade,
     quantity int not null check (quantity > 0),
     service_type text check (service_type in ('dine_in','takeaway')) not null,
     phone text,
     notes text,
     claimed_at timestamptz default now()
   );

   create index on public.deals (restaurant_id);
   create index on public.claims (user_id, deal_id);

   alter table public.profiles enable row level security;
   alter table public.restaurants enable row level security;
   alter table public.deals enable row level security;
   alter table public.claims enable row level security;

   create policy "read own profile" on public.profiles for select using (auth.uid() = id);
   create policy "update own profile" on public.profiles for update using (auth.uid() = id);

   create policy "read restaurants" on public.restaurants for select using (true);
   create policy "read deals" on public.deals for select using (active = true);

   create policy "insert own claim" on public.claims for insert with check (auth.uid() = user_id);
   create policy "read own claims" on public.claims for select using (auth.uid() = user_id);
   ```

4. **Seed Data (Optional)**
   ```sql
   insert into public.restaurants (name, description, image_url, phone, address, city, lat, lng, categories, dine_in, takeaway)
   values ('Fjord & Furu','Sesongbasert norsk mat','https://picsum.photos/seed/fjord/800/600','+47 40000000','Karl Johans gate 10','Oslo',59.9139,10.7522,'{Norsk,Moderne}',true,true);

   insert into public.deals (restaurant_id,title,discount_value,discount_type,original_price,final_price,start_time,end_time,days,per_user_limit,dine_in,takeaway,active)
   select id,'Dagens fisk −30%',30,'percent',299,209,'14:00','15:00','{1,2,3,4,5}',2,true,true,true
   from public.restaurants limit 1;
   ```

### Development

```bash
# Start development server
pnpm dev

# Type checking
pnpm type-check

# Run tests
pnpm test

# Lint code
pnpm lint
pnpm lint:fix

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── BottomNavigation.tsx
│   ├── DealCard.tsx
│   ├── DealsList.tsx
│   ├── FilterSheet.tsx
│   ├── ClaimFlowModal.tsx
│   ├── RestaurantMap.tsx
│   └── ProfileForm.tsx
├── routes/              # Page components
│   ├── home.tsx
│   ├── auth.tsx
│   ├── profile.tsx
│   ├── favorites.tsx
│   ├── claims.tsx
│   ├── map.tsx
│   ├── restaurant.tsx
│   └── business.tsx
├── lib/                 # Core utilities
│   ├── supabase.ts
│   ├── database.types.ts
│   └── utils.ts
├── hooks/               # Custom React hooks
│   └── useAuthGuard.ts
├── styles/              # CSS and design tokens
│   ├── tokens.css
│   └── index.css
├── i18n/                # Internationalization
│   └── no.ts
├── test/                # Test setup
│   └── setup.ts
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## Key Features

### Authentication
- Email/password authentication via Supabase Auth
- Protected routes with automatic redirects
- User profile management

### Deal Discovery
- Search and filter deals by cuisine, dietary restrictions, distance
- Real-time availability based on time windows
- Mobile-optimized cards with images and pricing

### Claim Flow
- Modal-based claiming with step-by-step validation
- Service type selection (dine-in vs takeaway)
- Phone number requirement for takeaway orders
- Per-user daily limits enforcement
- Special requests and notes

### Maps Integration
- Interactive restaurant map with Leaflet
- Clustered markers for performance
- Location-based filtering
- Restaurant details in map popups

### Favorites & History
- Save favorite restaurants
- View claimed deals history
- Track savings and usage statistics

## Design System

The app uses a consistent design system with:
- CSS custom properties for theming
- Tailwind utility classes
- Mobile-first responsive design
- Accessibility features (focus rings, ARIA labels)
- Norwegian color scheme and typography

## Performance & SEO

- Lighthouse scores: 90+ for Performance, Accessibility, Best Practices
- Progressive Web App with offline support
- Image lazy loading and optimization
- React Query for efficient data fetching
- Bundle optimization with Vite

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile browsers (iOS 14+, Android 8+)
- Progressive enhancement for older browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards (ESLint/Prettier)
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.































