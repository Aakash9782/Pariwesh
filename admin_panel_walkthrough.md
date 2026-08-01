# Pariwesh Hub: Enterprise Admin Panel Walkthrough

This document compiles the architecture, features, and implementation roadmap of the **Pariwesh Hub** admin control center. The admin panel is fully responsive, and styled to maintain the high-end dark slate boutique identity.

---

## 🗺️ Architectural Enhancements

### 1. Database Schema Extensions

- **ActivityLog Model (`ActivityLog.js`):** Track all major administrative data manipulations.
  - `adminId`, `adminName`, `action` (e.g., product updates, coupon creation).
  - `ipAddress`, `device` (HTTP headers parser).
- **User Schema (`User.js`):** Added a `status` enum (`active`, `suspended`).
- **Order Schema (`Order.js`):** Added dynamic support fields for logistics:
  - `customerNotes` and `internalNotes` (operation tracking).
- **Settings Schema (`Setting.js`):** Schema-less database keys for announcements, logo configurations, and campaigns storage.

### 2. Guarded Routings & Authorization Middleware

- Applied backend checks: `protect` (session token validation) paired with `authorize("admin")` role checks for administrative routes:
  - `/api/v1/products` write requests.
  - `/api/v1/orders` status modifications.
  - `/api/v1/coupons` management.
  - `/api/v1/settings` parameter commits.
- **MainLayout Navigation Guards:** Prevents non-admin accounts or unauthenticated requests from loading administrative paths (e.g., redirects automatically to `/login` or matches standard roles).

---

## 🖥️ Platform Administrative UI Modules

Each module is integrated into the Left Sidebar of the platform dashboard:

1.  **Dashboard Hub (`Dashboard.jsx`):**
    - Visualizes real-time metrics (Gross Revenue, Active Users, Inventory volumes).
    - Displays recent activity audits and direct shortcuts.
2.  **Products Ledger (`Products.jsx`):**
    - CRUD panel supporting image uploads, video links, product tagging, SEO titles/descriptions, and HSN/GST billing specs.
    - Bulk actions drawer and CSV import/export template for store inventories.
3.  **Logistics & Orders (`Orders.jsx`):**
    - Dispatch tracker containing search query parameters and active filters (AWB status, Date parameters, Payment channels).
    - Direct HTML invoice layout print button and AWB label builder popup.
    - Inspect Drawer with operational controls to modify order state (`Placed` ➜ `Shipped` ➜ `Delivered`) and add notes.
4.  **CRM Customers Directory (`Customers.jsx`):**
    - Roster tracking lifetime purchases and order frequency counts.
    - Admin controls to dynamically Toggle Account Access state (`Lock user` / `Unlock user`).
    - Side drawer displaying order history records for the selected customer.
5.  **Inline Inventory Controller (`Inventory.jsx`):**
    - Adjust size stocks (S, M, L, XL, XXL) inline directly from list tables.
    - Alert triggers indicating critical volumes (`Out of Stock`, `Low Stock`).
6.  **Campaigns & Coupons Marketing (`Marketing.jsx`):**
    - Festive timer layouts containing headline labels, scheduled discount countdowns, and cover promotional banner uploads.
    - Creation ledger for active Checkout coupons, including minimum balance requirements and expiration limits.
7.  **Deep Analytics (`Analytics.jsx`):**
    - Aggregates order metrics into line charts (order frequency paths) and radial fulfillment dials.
    - Calculates Average Ticket values and COD vs UPI payment ratios.
8.  **Settings & Access Control (`Settings.jsx`):**
    - Modify operational numbers, GSTIN numbers, logos, base delivery fees, or activate store quarantine/maintenance.
    - Revoke admin rights or assign administrative roles by phone validation.
    - Inspect security login and modification audit logs.

---

## 🛠️ Launch & Local Test Instructions

To launch the dev services:

1.  **Start API Engine Server:**

    ```bash
    cd server
    npm run dev
    ```

    _Server initiates on port 5001 with active MongoDB connections._

2.  **Start Vite React Server:**

    ```bash
    cd client
    npm run dev
    ```

    _Client initiates on port 5173._

3.  **Validate Admin Authentication:**
    - Open `http://localhost:5173/login`.
    - Input the Master Admin phone number: `9782681155`.
    - Provide the mock verification OTP code: `1234`.
    - _The platform redirects automatically to `/admin/dashboard`!_
