<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Three.js-0.185-black?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<h1 align="center">🎓 Maestria — Next-Gen Educational Platform</h1>

<p align="center">
  <strong>by Maestro7IT</strong><br>
  Full-featured LMS with 3D visualizations, AI integration, admin dashboard, and i18n
</p>

---

## 📋 About

**Maestria** is a modern Learning Management System (LMS) built on **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4**. The platform provides a complete set of tools for creating, taking, and managing online courses, tracking student progress, and analytics.

The **Maestro7IT** project is led by **Dupley Maxim Igorevich** and is designed for use in the Russian Federation with full compliance with RF legislation on education and personal data protection.

---

## 🚀 Key Features

### For Students
- **34 courses** in programming, web development, Data Science, game dev, and more
- **Step-by-step lesson viewer** (Step Viewer) with interactive elements
- **Tests and assignments** with auto-grading and result tracking
- **Learning progress** and completion certificates
- **Achievement system** and push notifications
- **Favorite courses** for quick access

### For Teachers
- **Course Editor** — create and edit course materials
- Module and lesson management
- Student statistics and review moderation

### For Administrators
- **Secured admin panel** (`#admin`) with password protection
- **9 sections**: Dashboard · Users · Tests · Materials · Finance · Courses · Reports · Logs · Settings
- **4 SVG chart types**: Line, Bar, Donut, Sparkline
- User management (roles, blocking, 2FA)
- Financial analytics (revenue, categories, free vs paid)
- Platform activity log and report moderation

### Visual & Platform Features
- **Laniakea 3D Scene** — interactive supercluster galaxy visualization (Three.js + React Three Fiber + custom shaders)
- **3 themes**: Light, Dark, Amber (oklch colors)
- **3 languages**: Russian 🇷🇺 · English 🇬🇧 · 中文 🇨🇳
- **Custom cursor** with smooth follow (pointer:fine)
- **10 legal pages** compliant with RF legislation
- **App Store / Google Play / RuStore** buttons in footer
- Responsive design (mobile · tablet · desktop)

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 · React 19 · TypeScript 5 |
| **Styling** | Tailwind CSS 4 · Tailwind Animate · OKLCH Colors |
| **3D Rendering** | Three.js · @react-three/fiber · drei · postprocessing |
| **UI Components** | shadcn/ui (40+ components) · Radix UI · Lucide Icons |
| **State Management** | Zustand · React Query (TanStack Query) |
| **Forms** | React Hook Form · Zod v4 |
| **Database** | Prisma ORM · SQLite |
| **Authentication** | NextAuth.js v4 (2FA, registration, password recovery) |
| **i18n** | next-intl (ru / en / zh) |
| **Animations** | Framer Motion · Sonner (toast notifications) |
| **Drag & Drop** | @dnd-kit |
| **Charts** | Recharts |
| **Build / Deploy** | Bun · Caddy (reverse proxy) |

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** ≥ 18.17
- **Bun** ≥ 1.0 (recommended) or **npm** ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Maestro7IT/laniakea.git
cd laniakea

# 2. Install dependencies
bun install

# 3. Generate Prisma client
bun db:generate

# 4. Setup database (SQLite is created automatically)
bun db:push

# 5. Start dev server
bun dev
# → http://localhost:3000
```

### Production Build

```bash
bun build      # → .next/standalone/
bun start      # → http://localhost:3000
```

The SQLite database is automatically created and seeded with demo data on first run.

---

## 📋 Key Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server with logging to `dev.log` |
| `bun build` | Build standalone version for production |
| `bun start` | Start production server |
| `bun lint` | ESLint code check |
| `bun db:generate` | Generate Prisma client |
| `bun db:push` | Push schema to database |
| `bun db:migrate` | Create and apply migration |
| `bun db:reset` | Full database reset |

---

## 🌐 Routing

The project uses **hash-based SPA routing** (`#home`, `#catalog`, `#admin`). All pages render through a single `page.tsx`.

| Route | Component | Description |
|---|---|---|
| `#home` | `HomePage` | Landing page |
| `#catalog` | `CatalogPage` | Course catalog |
| `#course/ID` | `CourseDetailPage` | Course page |
| `#course/ID/lesson/LESSON_ID` | `StepViewerPage` | Step-by-step lesson viewer |
| `#profile` | `ProfilePage` | User profile |
| `#admin` | `AdminPage` | Admin dashboard |
| `#about` · `#achievements` · `#notifications` | — | About · Achievements · Notifications |
| `#certificate/ID` | `CertificatePage` | Certificate |
| `#course-editor` | `CourseEditorPage` | Course editor |
| `#terms` · `#privacy` · `#personal-data` | — | Terms · Privacy · Personal Data |
| `#offer` · `#refund` · `#edu-info` | — | Public Offer · Refund · Education Info |
| `#rules` · `#license` · `#age-rating` · `#cookies` · `#help` | — | Rules · License · Rating · Cookie · Help |

---

## 🔒 Admin Panel

Accessible via `#admin` route (admin role only).

**Login password**: `admin` or `Maestria2026`

### Admin Sections

1. **Dashboard** — KPI cards with sparklines, registration and enrollment charts, category distribution, recent activity, server status
2. **Users** — Search, role filter, avatar table, role/status management, growth and activity charts
3. **Tests** — Completion stats, pass rate, average score, per-course results, difficulty distribution
4. **Materials** — Reading sessions, average time, reading progress, engagement dynamics
5. **Finance** — 12-month revenue, category revenue, free vs paid
6. **Courses** — Full course table, top courses by enrollment
7. **Reports** — Report statuses, moderation
8. **Logs** — Typed activity log
9. **Settings** — Platform, system, danger zone

---

## 🎨 Themes

Three themes with oklch colors and CSS custom properties:

| Theme | Class | Accent |
|---|---|---|
| Light | `:root` | Blue-violet `oklch(0.45 0.2 265)` |
| Dark | `.dark` | Bright violet `oklch(0.65 0.2 265)` |
| Amber | `.amber` | Warm gold `oklch(0.55 0.18 55)` |

Each theme includes separate CSS custom properties for the custom cursor.

---

## 🌍 Internationalization

3 languages with full coverage (400+ keys each):

| Code | Language | Flag |
|---|---|---|
| `ru` | Русский | 🇷🇺 |
| `en` | English | 🇬🇧 |
| `zh` | 中文 | 🇨🇳 |

---

## 📁 Project Structure

```
laniakea/
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout + JSON-LD
│   │   ├── page.tsx        # SPA hash router
│   │   ├── globals.css     # Themes, cursor, prose styles
│   │   └── api/            # API Routes
│   │       ├── admin/      # Admin API (courses, users)
│   │       ├── auth/       # NextAuth (2FA, register, forgot-password)
│   │       ├── courses/    # Courses (CRUD, reviews, enroll, lessons)
│   │       ├── payments/   # Payments
│   │       ├── achievements/
│   │       ├── seed/       # DB auto-seed
│   │       └── user/       # User data
│   ├── components/
│   │   ├── laniakea/       # 3D scene, shaders, minimap, overlays
│   │   ├── ui/             # 40+ shadcn/ui components
│   │   ├── AdminPage.tsx   # Admin panel (9 sections + SVG charts)
│   │   ├── HomePage.tsx    · CatalogPage.tsx · CourseDetailPage.tsx
│   │   ├── StepViewerPage.tsx · ProfilePage.tsx · CourseEditorPage.tsx
│   │   ├── AuthDialogs.tsx · CustomCursor.tsx · GlobalScrollToTop.tsx
│   │   └── [10+ legal pages]
│   └── lib/
│       ├── store.ts        # Zustand store
│       ├── i18n.ts         # Localization (ru/en/zh)
│       ├── auth.ts         # NextAuth config
│       ├── db.ts           # Prisma client
│       └── utils.ts        # cn() utility
├── Caddyfile               # Caddy reverse proxy (:81)
├── package.json
└── next.config.ts
```

---

## 📊 Database

**SQLite** via Prisma ORM. 14 models:

```
User → Account / Session / Enrollment → Progress / Review / Certificate / Payment
Course → Module → Lesson → Assignment
Category → Course
VerificationToken
```

The schema is automatically created and seeded with demo data on first run.

---

## 📜 Legal Compliance

All legal pages comply with Russian Federation legislation:

- Federal Law No. 152-FZ "On Personal Data"
- RF Law No. 2300-1 "On Consumer Rights Protection"
- Civil Code of RF (Art. 437 — Public Offer)
- Government Decree No. 1724 (Remote Sales)
- Roskomnadzor requirements for data storage in the RF

---

## 👥 Team

| Member | Role |
|---|---|
| **Dupley Maxim Igorevich** | Director, Fullstack Developer |
| **Maestro7IT** | Development Company |

---

## 📞 Contacts

- **Email**: maksimqwe42@mail.ru
- **Address**: Moscow, Russian Federation
- **Platform**: [maestria.ru](https://maestria.ru)

---

## 📄 License

| Component | License |
|---|---|
| **User Content** | [CC BY-SA 4.0](LICENSE) |
| **Platform Software** | © Maestro7IT, all rights reserved |

Full license text — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>Maestria</strong> · Maestro7IT · Moscow, Russia
</p>
