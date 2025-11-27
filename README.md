# Easely

Easely is a modern, full-featured campus ride-sharing platform built for the University of Ilorin community. It connects students for safe, affordable rides between campus and town, with a focus on security, convenience, and a beautiful user experience.

## Features

- **User & Driver Dashboards:**
  - Personalized dashboards for riders and drivers
  - Referral system for both user types
  - Wallet management and ride history
  - Notifications and earnings tracking

- **Admin Panel:**
  - Analytics dashboard
  - User, driver, payments, rides, and messages management
  - Security controls (2FA, login alerts, password management)
  - Real-time messaging and conversations with users

- **Authentication:**
  - Secure login and registration
  - OTP and push notification support

- **Payments:**
  - Integrated with Paystack for seamless transactions

- **Responsive UI:**
  - Optimized for desktop, tablet, and mobile
  - Modern design with framer-motion animations

- **Notifications:**
  - Real-time notifications for rides, payments, and system alerts

- **Privacy & Safety:**
  - Dedicated privacy, safety, and terms pages

- **Tech Stack:**
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - Radix UI
  - Sonner (toast notifications)
  - Supabase (planned for backend integration)

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Run the development server:**
   ```bash
   pnpm dev
   ```
3. **Build for production:**
   ```bash
   pnpm build
   ```

## Folder Structure

- `app/` - All Next.js pages and routes
- `components/` - Reusable UI and dashboard components
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries and context providers
- `public/` - Static assets
- `styles/` - Global CSS

## Planned Features

- Supabase integration for authentication, database, and real-time messaging
- Advanced analytics and reporting for admins
- Driver onboarding and verification
- Ride scheduling and matching algorithms

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

---

**Easely** — Making campus rides easy, safe, and affordable for everyone at Unilorin.
