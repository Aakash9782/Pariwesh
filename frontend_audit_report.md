# PHASE 1 — FRONTEND STRUCTURE & CODE QUALITY AUDIT (SAFE MODE)

**Project Name**: Pariwesh Premium E-Commerce  
**Audit Standard**: Safe Frontend Customizations (Read-Only Backend)  
**Target Scope**: `client/src/` Components, Pages, CSS, and Layouts

---

## 1.1 Page-by-Page Audit & Frontend Pass/Fail Status

Below is the Page-by-Page audit detailing Pass/Fail statuses, identified UI defects, and safe frontend fixes:

### 1. Home Page (`Home.jsx`)

- **Status**: ⚠️ **WARNING**
- **Structure**: Uses standard header navbar, main sections (Hero slider, Category curations, Editorial, Vibes grid, trending grid), and footer.
- **Audit Findings**:
  - **Header & Announcements**: **PASS**. Clear layout.
  - **Featured Hero Slider**: **FAIL**. Holds static text elements (`Spring / Summer 2026 Collection`) in client script files.
  - **Boutique Curations Circles**: **FAIL**. Category details and Unsplash picture URLs are hardcoded in local array blocks.
  - **Trending Classics Feed**: **PASS**. Renders dynamic product cards faithfully.
  - **Pick Your Vibe Card Grids**: **FAIL**. Grayscale vibe configuration lists are statically stored.
- **Safe Frontend Fixes**:
  - Unify border styling variables across category hover circles.
  - Add content loading indicators to prevent CLS shift during image load.

### 2. Shop Listings (`ShopListings.jsx`)

- **Status**: ⚠️ **WARNING**
- **Structure**: Renders catalog page, filters sidebar, active tag lists, and product search grids.
- **Audit Findings**:
  - **Filter Widgets**: **PASS**. Wraps correctly.
  - **Zero Results display**: **FAIL**. Lacks smart fallback recommendations when filters return empty listings.
- **Safe Frontend Fixes**:
  - Design a rich, responsive "No Products Found" empty state component containing pre-configured tags link shortcuts.

### 3. Product Details Page (`ProductDetails.jsx`)

- **Status**: ⚠️ **WARNING**
- **Structure**: Handles image displays, inventory status alerts, size selectors, and trust badges.
- **Audit Findings**:
  - **Size badges selection**: **FAIL**. Features a hardcoded static size fallback `M` if inventory arrays are empty.
  - **Out-of-Stock warnings alert**: **PASS**. Admin check alerts display nicely.
  - **Trust badges**: **FAIL**. Guarantee texts (`100% Cotton Handwoven Certified`) are hardcoded.
- **Safe Frontend Fixes**:
  - Bind size badge layouts to map dynamic product criteria without static string fallback overrides.

### 4. Cart Page (`Cart.jsx`)

- **Status**: ❌ **FAIL**
- **Structure**: Renders product grid lists, address checkout forms, and Razorpay modal elements.
- **Audit Findings**:
  - **Address Entry forms**: **FAIL**. Input elements lack browser autofill tags and default validation masks.
  - **Coupon verification check**: **FAIL**. Local client fallback values (`PARIWESHGOLD`, `FESTIVE35`) bypass API validations.
- **Safe Frontend Fixes**:
  - Apply standard input autocomplete parameters to forms.

### 5. Profile Page (`Profile.jsx`)

- **Status**: ⚠️ **WARNING**
- **Structure**: Handles dynamic order lists, address settings tabs, and return requests inputs.
- **Audit Findings**:
  - **Returns Request form**: **PASS**. Uploading evidence images checks file capacities cleanly.
  - **Order Timeline list**: **FAIL**. Tracking changes lack visual timelines.
- **Safe Frontend Fixes**:
  - Introduce responsive graphic steppers to visualize order tracking levels.

---

## 1.2 Custom Component-by-Component Audit

### 1. Global Navigation Header (`MainLayout.jsx`)

- **Status**: ⚠️ **WARNING**
- **Audit Findings**:
  - **Accent Theme selector**: **FAIL**. Bypasses keyboard-focusable outlines.
  - **Search results list**: **FAIL**. Dropdown list cannot be scanned using Up/Down arrow keys.
- **Safe Frontend Fixes**:
  - Map dynamic keyboard event listeners (`keydown`) to let users select search results.

### 2. Base Button (`components/common/Button.jsx`)

- **Status**: **PASS**
- **Audit Findings**: Standard CSS button styles render reliably.

### 3. Base Card (`components/common/Card.jsx`)

- **Status**: **PASS**
- **Audit Findings**: Custom visual borders frame product photos cleanly.

### 4. Custom Dialog Modals (`components/common/Modal.jsx`)

- **Status**: ⚠️ **WARNING**
- **Audit Findings**: Active modal overlays do not block Tab keystrokes, allowing users to select background elements.
- **Safe Frontend Fixes**:
  - Mount focus trapping effect hooks to confine key selections within modal margins.

### 5. Tables layouts (`components/common/Table.jsx`)

- **Status**: ⚠️ **WARNING**
- **Audit Findings**: Table headers compress text columns on tablet breakpoints.
- **Safe Frontend Fixes**:
  - Apply CSS overflow patterns and horizontal sweeps to tables wrapper layouts.

---

## 1.3 Design System & Theme Consistency Audit

- **1. Border Radius Tokens (Status: FAIL)**
  - **Details**: Uses `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, and `rounded-full` simultaneously across pages.
  - **Safe Fix**: Lock spacing settings in client variables to 3 values: Sharp (0px for boutique cards), Soft (4px for input frames), and Round (999px for navigation circles).
- **2. Box Shadow Patterns (Status: FAIL)**
  - **Details**: Multi-shade shadows (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-inner`) are arbitrarily applied.
  - **Safe Fix**: Set one flat, standard shadow style (`shadow-premium`) to establish boutique style consistency.
- **3. Heading Sizes (Status: PASS)**
  - **Details**: H1 to H4 configurations follow the brand specification cleanly.

---

## 1.4 Code Quality & Technical Debt Audit

- **God Files**: `Home.jsx` (1089 lines) and `Settings.jsx` (1007 lines) handle too many layout blocks individually.
- **Safe Fix**: Fragment large visual sections into modular client files (e.g. `FeaturedCarousel.jsx`, `VibesSection.jsx`) within `client/src/components/` folders.
- **Central Icons Bypass**: Components import icons directly from `@react-icons/ri` in every file.
- **Safe Fix**: Refactor all pages imports to read icons strictly from `src/theme/icons.js`, enabling treeshaking optimization on Vite build compilation.

---

## 1.5 Backend Changes Required (Not Implemented)

The following improvements require server-side database schema changes or route modifications, and thus have **not been implemented** to preserve 100% backend compatibility:

1. **WhatsApp Dynamic Configuration**:
   - _Dependency_: Backend `Setting` model modifications to support dynamic WhatsApp contact settings.
2. **Hero Slider Content Management**:
   - _Dependency_: Database collection additions to hold seasonal titles, captions, and slider image objects.
3. **Curations Circle Categories Mapping**:
   - _Dependency_: Backend database schema modifications and route creations to deliver custom curated categories via API.
4. **Grayscale Vibe Grids Management**:
   - _Dependency_: Analytics or marketing model fields expansions to manage vibe lists.
5. **Secure Coupon Authentication**:
   - _Dependency_: Removal of raw client fallbacks requires server validate code blocks enhancement to guarantee coupon checks under network issues.
6. **Dynamic Razorpay settings**:
   - _Dependency_: Server-side payment settings endpoint changes to store client checkout color keys.
