# Charter Keke - Tricycle Ride-Sharing Platform

## 🛺 Project Overview

**Charter Keke** is a modern, production-ready tricycle (keke) ride-sharing platform built for the Lagos metropolitan area, starting with the Debari-Shomolu-Yaba corridor pilot.

### Core Features

- 👥 **Unified User Management** - Riders, drivers, and admins on one platform
- 🔐 **Secure Authentication** - NextAuth with bcrypt password hashing
- 🗺️ **Zone-Based Dispatch** - Intelligent driver matching by operating zones
- 💰 **Wallet System** - Ledger-grade transaction tracking
- 🔔 **Real-Time Notifications** - In-app, SMS, email, and push notifications
- 👨‍💼 **Admin Dashboard** - Full system control with granular permissions
- 📊 **Complete Audit Trail** - All actions tracked and logged
- 🔄 **Graceful Fallback** - Works without external dependencies

---

## 🏗️ Architecture Overview

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js 5 |
| Notifications | Supabase Triggers + Termii |
| Caching | Redis (optional) |
| Payments | Paystack |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Supabase account
- Termii account (for SMS)
- Resend account (for email)

### Quick Setup

1. **Install dependencies**
   ```bash
2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Fill in all required values
   ```

3. **Set up database**
   - Create Supabase project
   - Run `lib/db-schema.sql` in SQL editor
   - Create initial admin user

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Access the app**
   - Web: http://localhost:3000
   - API: http://localhost:3000/api

See [QUICK_SETUP.md](./QUICK_SETUP.md) for detailed instructions.

---

## 📁 Project Structure

```
charter-keke/
├── app/
│   ├── api/                   # All API routes
│   ├── auth/                  # Authentication pages
│   ├── user/                  # User dashboard
│   ├── driver/                # Driver dashboard
│   └── admin/                 # Admin dashboard
├── components/                # Reusable components
├── lib/                       # Core utilities
│   ├── auth.ts                # NextAuth config
│   ├── supabase.ts            # Database client
│   ├── notifications.ts       # Notification utilities
│   └── db-schema.sql          # Database schema
├── types/                     # TypeScript types
├── SYSTEM_DOCUMENTATION.md    # Architecture docs
├── QUICK_SETUP.md             # Setup guide
└── .env.example               # Environment template
```

---

## 🔒 Security

- Passwords hashed with bcryptjs
- JWT-based sessions
- Server-side role enforcement
- Immutable audit trails
- Never trust client-side claims

---

## 📚 Documentation

- **[QUICK_SETUP.md](./QUICK_SETUP.md)** - Step-by-step setup guide
- **[SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)** - Complete system architecture
- **[.env.example](./.env.example)** - Environment variables reference

---

## 🐛 Troubleshooting

See [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#10-maintenance--operations) for troubleshooting guides.

---

## 💼 Team & Roles

| Role | Responsibility |
|------|-----------------|
| Founder / Product Lead | Vision, ecosystem intelligence |
| Technical Partner | Architecture, code implementation |
| Co-Founder / Field Lead | Ground operations, driver relations |

---

## 📄 License

Proprietary - Unauthorized copying or use is prohibited.

---

**Charter Keke** — Fast, affordable, and reliable tricycle rides across Lagos.

Last Updated: December 23, 2025
Version: 2.0.0 (MVP)

