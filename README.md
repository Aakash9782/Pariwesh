# PARIWESH

Premium ethnic-wear e-commerce monorepo: Vite/React storefront + Express/MongoDB API + admin hub.

## Structure

```
Pariwesh/
├── client/          # React 19 + Vite + Redux + Tailwind
├── server/          # Express + Mongoose API
├── docs/            # Architecture notes (partially aspirational)
├── FIX_LIST.md      # Tracked fixes / roadmap
└── .env.example     # Env template (no secrets)
```

## Setup

```bash
# From Pariwesh/
npm run install-all

# Copy env and fill secrets
cp .env.example server/.env
# Edit server/.env: MONGO_URI, JWT_*, NODEMAILER_*, RAZORPAY_*, etc.

npm run dev
```

- Client: http://localhost:5173  
- API: http://localhost:5001 (see `PORT` in `server/.env`)

Use **one** env file: `server/.env` (server loads it with override).

## Features (current)

| Area | Status |
|------|--------|
| Shop / PDP / cart / wishlist | Working (API data; no mock catalog) |
| Auth | Email + password login; signup + **email OTP** verify |
| Checkout | Login required; COD + Razorpay ONLINE |
| Emails | Order placed, payment success/failed, OTP |
| Admin hub | Dashboard, products, orders, customers, inventory, marketing, analytics, settings, returns |

## Auth notes

- **Signup:** name, email, phone, password → OTP to email → verify  
- **Login:** email + password (OTP only if account not verified yet)  
- **Admin:** emails listed in `ADMIN_EMAILS` in `.env` get `role=admin` on signup  

## Payments

Set real Razorpay **Test** keys in `server/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...   # not another rzp_test_ id
```

ONLINE: order created → Razorpay checkout → signature verify → `Paid`.  
If Razorpay init fails, order is **not** kept.

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Client + server |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | API only |
| `npm run build:client` | Production client build |

## Deploy hints

- Client: Vercel / Netlify (`client/vercel.json`, `client/netlify.toml`)  
- API: e.g. Render — set `FRONTEND_URL` and all secrets  

## Not done yet

See `FIX_LIST.md` — e.g. Collections page, cart/wishlist DB sync, real shipping AWB, tests/CI.
