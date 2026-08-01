# Pariwesh — Fix List (One by One)

Fix in priority order: **P0 → P1 → P2**.  
Backend and frontend are listed separately. Matching pairs (e.g. B1 + F1) should be done together.

**Suggested start order:** B2 → B3 → F2 → F3 → B1 → F1 → B4 → B5 → then Razorpay (B6 + F4).

---

## Backend

### P0 — Must fix (security)

| ID | Problem | Where |
|----|---------|--------|
| **B1** | Add real OTP send + verify APIs (store hashed OTP + expiry on User) | `userController.js`, `userRoutes.js` — **DONE** (Twilio + register/login/verify) |
| **B2** | Protect `POST /orders` with auth middleware (require logged-in user) | `orderRoutes.js` — **DONE** |
| **B3** | Never trust client `paymentStatus` — force ONLINE → `Pending` until gateway verifies | `orderController.js` — **DONE** |
| **B4** | Remove hardcoded JWT fallback secrets; fail startup if secrets missing | `validateEnv.js` + `utils/jwt.js` — **DONE** |
| **B5** | Move admin phone allowlist to env/DB (not hardcoded in code) | `ADMIN_EMAILS` / `ADMIN_PHONES` in env — **DONE** |

### P1 — Before launch

| ID | Problem | Where |
|----|---------|--------|
| **B6** | Integrate Razorpay: create-order + verify/webhook; mark `Paid` only after verify | `paymentController.js`, `orderController.js` — **DONE** (verify signature; webhook optional later) |
| **B7** | Wire Nodemailer for order confirmation / OTP email fallback | `mailer.js`, `emailTemplates.js` — **DONE** (order placed + payment success/failed) |
| **B8** | Use `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` from env (currently hardcoded `15m` / `7d`) | `utils/jwt.js` — **DONE** |
| **B9** | Replace mock AWB/courier on Shipped with real shipping API or admin-entered AWB | Admin enters real AWB + courier; shipped email — **DONE** |
| **B10** | Add `.env.example` (no secrets) documenting all required vars | repo root |

### P2 — Polish

| ID | Problem | Where |
|----|---------|--------|
| **B11** | Persist cart & wishlist in MongoDB (models + routes) | `Cart`/`Wishlist` models + `/cart` `/wishlist` — **DONE** |
| **B12** | Add Category / Brand / Collection models + APIs (docs vs reality gap) | Category/Brand APIs + admin Catalog — **DONE** (Collections earlier) |
| **B13** | Remove unused deps: `bcryptjs`, `multer`, `express-validator` (or actually use them) | `server/package.json` |
| **B14** | Fix `server.js` port-kill logic for macOS (Windows `netstat`/`taskkill` only) | `server.js` — **DONE** (lsof/kill on macOS/Linux) |
| **B15** | Add automated API tests + CI; clean up ad-hoc `test_*.js` scripts | `server/tests/`, `.github/workflows/ci.yml` — **DONE** |
| **B16** | Align client/server default ports (docs/client often `5001`, server default `5000`) | Default port `5001` in `server.js` — **DONE** |

---

## Frontend

### P0 — Must fix (security)

| ID | Problem | Where |
|----|---------|--------|
| **F1** | Replace mock OTP `setTimeout` with real send/verify API calls | `Login.jsx` — **DONE** (signup/login + Twilio OTP) |
| **F2** | Stop sending `paymentStatus: "Paid"` for ONLINE — wait for Razorpay success | `Cart.jsx` — **DONE** |
| **F3** | Require auth before checkout / place order (redirect to login if guest) | `Cart.jsx` — **DONE** |

### P1 — Before launch

| ID | Problem | Where |
|----|---------|--------|
| **F4** | Add Razorpay Checkout JS / payment UI after order create | `Cart.jsx` — **DONE** |
| **F5** | Remove or hide `/otp-demo` from production routes | `main.jsx` — **DONE** (route + file removed) |
| **F6** | Build real Collections page (currently `PlaceholderPage`) | `Collections.jsx` + `CollectionDetail.jsx` — **DONE** |
| **F7** | Prefer API catalog; remove or gate `MOCK_CATALOG` fallbacks | `ShopListings`, `ProductDetails`, `Home` — **DONE** |

### P2 — Polish

| ID | Problem | Where |
|----|---------|--------|
| **F8** | Use TanStack Query for server data (provider exists but unused) | `client/src/` |
| **F9** | Use `react-hook-form` + `zod` for forms (deps installed, never imported) | forms / admin pages |
| **F10** | Sync wishlist/cart with backend after **B11** | `hydrateCommerce.js` — **DONE** |
| **F11** | Delete leftover Vite `App.jsx` / `App.css`; clean dead code | `client/src/` — **DONE** |
| **F12** | Split huge admin pages (e.g. Products ~1400 LOC) into smaller components | `client/src/pages/admin/` |
| **F13** | Update `README.md` with setup, scripts, and truthful feature notes | `README.md` — **DONE** |

---

## Progress checklist

Copy and tick as you go:

### Backend
- [x] B1 — OTP APIs
- [x] B2 — Protect create order
- [x] B3 — Trustworthy paymentStatus
- [x] B4 — JWT secrets from env only
- [x] B5 — Admin phones from env/DB
- [x] B6 — Razorpay
- [x] B7 — Nodemailer
- [x] B8 — JWT expiry from env
- [x] B9 — Real AWB / shipping
- [x] B10 — `.env.example`
- [x] B11 — Cart/Wishlist DB
- [x] B12 — Category/Brand/Collection
- [ ] B13 — Unused deps cleanup
- [x] B14 — macOS port-kill fix
- [x] B15 — Tests + CI
- [x] B16 — Port alignment

### Frontend
- [x] F1 — Real OTP UI
- [x] F2 — No fake Paid
- [x] F3 — Auth before order
- [x] F4 — Razorpay UI
- [x] F5 — Remove otp-demo
- [x] F6 — Collections page
- [x] F7 — No mock catalog (or gated)
- [ ] F8 — TanStack Query
- [ ] F9 — react-hook-form + zod
- [x] F10 — Sync cart/wishlist
- [x] F11 — Delete leftover App files
- [ ] F12 — Split admin pages
- [x] F13 — README

---

## Notes

- **COD demo:** B2, B3, F2, F3 are enough to harden checkout without full OTP/Razorpay.
- **Real users:** Finish all P0, then B6 + F4 (payments) and B1 + F1 (OTP).
- Architecture doc (`docs/architecture_specification.md`) oversells Phase-1 — update it when features land (F13 / docs sync).
