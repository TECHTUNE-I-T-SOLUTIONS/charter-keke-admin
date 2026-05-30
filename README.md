# Charter Keke Admin

Admin, CRM, operations intelligence, and moderation dashboard for Charter Keke.

This repository is the admin-only split from the main Charter Keke application. It keeps the operational API routes needed by admins while focusing the UI on platform monitoring, support, driver oversight, payments, and mobile app intelligence.

## Main Areas

- Admin dashboard and system overview
- CRM inbox, departments, email sync, logs, notes, and ticket workflows
- Operations intelligence for bookings, acceptance, cancellations, revenue, and risk
- Location intelligence for pickup demand, destination demand, and route corridors
- Driver intelligence for activity, completion, acceptance, verification, and review queues
- Mobile traffic monitoring through push subscriptions and ride activity trends
- Moderation center for pending drivers, overdue remittances, and support load
- Payments, settlements, ride monitoring, users, security, and settings

## Admin Pages

- `/admin/dashboard`
- `/admin/operations`
- `/admin/locations`
- `/admin/driver-intelligence`
- `/admin/mobile-traffic`
- `/admin/moderation`
- `/admin/drivers`
- `/admin/rides`
- `/admin/payments`
- `/admin/users`
- `/admin/monitor`
- `/admin/messages`
- `/admin/crm`
- `/admin/security`
- `/admin/settings`

## Stack

| Area | Technology |
| --- | --- |
| App | Next.js 16, React 19 |
| Styling | Tailwind CSS, Radix UI |
| Charts | Recharts |
| Auth | NextAuth |
| Database | Supabase PostgreSQL |
| Payments | Paystack |
| Notifications | Expo/Web Push, Termii SMS |
| Hosting | Vercel |

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000/admin/dashboard`.

## Required Environment

Use the same Supabase and service integrations as the main backend unless you intentionally deploy a separate admin backend.

Key variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `PAYSTACK_SECRET_KEY`
- `TERMII_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

## Validation

```bash
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

## Repository

GitHub: `TECHTUNE-I-T-SOLUTIONS/charter-keke-admin`

## License

Proprietary. Unauthorized copying, redistribution, or use is prohibited.
