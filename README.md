# LAUTECH Market 🛒

> The official online marketplace for LAUTECH students in Ogbomosho, Oyo State, Nigeria.

**Live site:** [lautechmarket.com.ng](https://lautechmarket.com.ng)

LAUTECH Market connects verified campus vendors with student buyers — 100% free, mobile-first, and built for life on campus.

---

## Features

- 🛍️ **Multi-vendor marketplace** — vendors register, list products, manage orders
- 🔍 **Browse & search** — filter by category, price, vendor rating
- 📦 **Order tracking** — buyers track purchases end-to-end
- 🏆 **Vendor leaderboard** — ranked by store visits and order count
- 📊 **Admin dashboard** — curated lists, market intelligence, feedback management
- 🔒 **Secure auth** — Firebase Authentication with role-based access (buyer / vendor / admin)
- 📱 **PWA-ready** — installable on Android & iOS with offline support
- ⚡ **Rate limiting** — client-side abuse protection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Cloudflare Worker (image uploads) |
| Hosting | Vercel |
| PWA | Custom Service Worker (`/public/sw.js`) |

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A Firebase project (Firestore + Authentication enabled)
- A Cloudflare Worker for image uploads (optional for dev)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/lautech-market.git
cd lautech-market

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in your Firebase credentials

# 4. Start the dev server
npm run dev
```

> The app runs at `http://localhost:5173` by default.

---

## Deployment

This project is deployed on **Vercel**. Push to the `main` branch to trigger an automatic deployment.

```bash
# Build the production bundle locally (optional check)
npm run build
```

Environment variables must be configured in the Vercel dashboard under **Project → Settings → Environment Variables** using the same keys from `.env.example`.

---

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/         # Firebase initialization
├── context/        # React Context providers (Auth, Cart, etc.)
├── middleware/      # Rate limiter
├── pages/          # Route-level page components
├── services/       # Firestore data-access layer
├── types/          # TypeScript type definitions
└── utils/          # Helpers (logger, formatting, etc.)
public/
├── sw.js           # Service Worker (PWA, network-first for bundles)
└── site.webmanifest
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with a clear message
4. Open a Pull Request describing what you changed and why

---

## License

MIT License — see [LICENSE.md](LICENSE.md) for details.

**Author:** Timothy Bayode — [timothybayode76@gmail.com](mailto:timothybayode76@gmail.com)