# PARIWESH - PHASE 1: SOFTWARE ARCHITECTURE, DATABASE SCHEMAS, & SPECIFICATION

This document outlines the complete Software Architecture, Database Schemas, API Planning, UI/UX Navigation Flow, State Management, and Roadmap for **PARIWESH**, a Premium E-Commerce Platform.

---

## 1. PROJECT DIRECTORY STRUCTURE

The project is structured as a monorepo for clean, decoupled development of client, server, and shared validation logic.

```text
pariwesh/
├── docs/                             # Project specifications & API definitions
│   └── architecture_specification.md
├── shared/                           # Shared utility models or validations (e.g., Zod schemas)
│   └── validation/
├── client/                           # React 19 + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                   # Images, logos, fonts
│   │   ├── components/               # Global reusable UI components
│   │   │   ├── common/               # Button, Modal, Dropdown, Skeletons
│   │   │   ├── form/                 # Input, Select, Checkbox, Hook Form wrappers
│   │   │   └── product/              # ProductCard, ProductGrid, CountdownTimer
│   │   ├── layouts/                  # MainLayout, AdminLayout, AuthLayout
│   │   ├── pages/                    # Main Pages
│   │   │   ├── shop/                 # ProductListings, ProductDetails, Cart, Checkout
│   │   │   ├── user/                 # Profile, MyOrders, Addresses, Wishlist
│   │   │   └── admin/                # Dashboard, CRUD panels, Analytics
│   │   ├── routes/                   # AppRoutes, PrivateRoute, AdminRoute setup
│   │   ├── hooks/                    # Custom React hooks (e.g., useAuth, useCart)
│   │   ├── contexts/                 # Theme, Notification contexts
│   │   ├── redux/                    # Redux Toolkit setup
│   │   │   ├── store.js
│   │   │   └── slices/               # authSlice, cartSlice, wishlistSlice
│   │   ├── services/                 # API client configurations (Axios wrappers)
│   │   ├── api/                      # Query/Mutation hooks (TanStack Query)
│   │   ├── utils/                    # Formatting, helper methods
│   │   ├── styles/                   # index.css (custom tailwind configuration/tokens)
│   │   ├── types/                    # TypeScript interfaces (if TS is used)
│   │   └── validations/              # Zod client schemas
│   ├── index.html
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.js
└── server/                           # Node.js + Express backend
    ├── config/                       # DB, Passport, JWT configurations
    ├── model/                        # Mongoose schemas/models
    ├── controller/                   # Business logic (MVC controller layer)
    ├── middleware/                   # Authentication, Rate Limiters, Errors, File Uploads
    ├── route/                        # Express routers mapped to endpoints
    ├── service/                      # External services (Cloudinary, Nodemailer, Razorpay)
    ├── validator/                    # Express Validator schemas
    ├── job/                          # Cron jobs (Offer expiration, Cart cleanup)
    ├── logs/                         # File logging output (using Morgan/Winston)
    ├── utils/                        # Error handlers, response formatters
    ├── app.js                        # App setup (middleware registration)
    ├── server.js                     # Server instantiation & listeners
    └── package.json
```

---

## 2. DATABASE SCHEMAS (MONGOOSE / MONGOOSE MODELS)

All schemas are engineered to support maximum performance, scalability, and indexed properties for querying.

### 2.1 Users & Auth

```javascript
// User Schema
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    mobile: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    avatarUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true },
);
```

### 2.2 Roles & Permissions

```javascript
// Role Schema
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 'Admin', 'User', 'Staff'
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
});

// Permission Schema
const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. 'MANAGE_PRODUCTS', 'VIEW_REPORTS'
  description: { type: String },
});
```

### 2.3 Products, Categories, Subcategories, Brands, & Collections

```javascript
// Category Schema
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// SubCategory Schema
const SubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Brand Schema
const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logoUrl: { type: String },
    description: { type: String },
  },
  { timestamps: true },
);

// Collection Schema (Curated groups e.g., "Festive Edit", "Summer Glow")
const CollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    bannerUrl: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Product Schema
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String },
    description: { type: String, required: true },
    specifications: [
      {
        key: { type: String }, // e.g. "Fabric"
        value: { type: String }, // e.g. "Premium Cotton"
      },
    ],
    washCare: { type: String },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    images: [{ type: String, required: true }],
    videoUrl: { type: String },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    variants: [
      {
        color: { type: String, required: true }, // e.g. "Luxury Gold"
        colorHex: { type: String }, // e.g. "#D4AF37"
        size: { type: String, required: true }, // e.g. "S", "M", "L"
        stock: { type: Number, default: 0 },
      },
    ],
    tags: [{ type: String }],
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Offer" }],
    ratings: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
```

### 2.4 Carts & Wishlists (Persistent Storage)

```javascript
// Cart Schema
const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        variant: {
          color: { type: String, required: true },
          size: { type: String, required: true },
        },
      },
    ],
  },
  { timestamps: true },
);

// Wishlist Schema
const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);
```

### 2.5 Orders & Payments

```javascript
// Order Schema
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true }, // Custom human-readable format e.g. PARIWESH-2026-10023
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        variant: {
          color: { type: String },
          size: { type: String },
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    billingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    pricing: {
      subTotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      shippingCharges: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Placed",
    },
    paymentDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    trackingId: { type: String },
    courierPartner: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

// Payment Schema
const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    transactionId: { type: String, index: true }, // Razorpay transaction/payment id
    razorpayOrderId: { type: String },
    razorpaySignature: { type: String },
    method: {
      type: String,
      enum: ["COD", "Razorpay", "Card", "Stripe", "PayPal"],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Success", "Pending", "Failed", "Refunded"],
      required: true,
    },
    refundDetails: {
      refundId: { type: String },
      refundedAmount: { type: Number },
    },
  },
  { timestamps: true },
);

// Address Schema (User book)
const AddressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);
```

### 2.6 Coupons, Offers, Promotionals, & Banners

```javascript
// Coupon Schema
const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "FixedAmount"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // Overall limit
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Offer Schema
const OfferSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Normal", "FlashSale", "Festival", "ComingSoon"],
      required: true,
    },
    discountPercentage: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Banner Schema
const BannerSchema = new mongoose.Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String }, // Redirection route
    order: { type: Number, default: 0 },
    device: {
      type: String,
      enum: ["Mobile", "Desktop", "All"],
      default: "All",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Homepage Sections Config (Dynamically handles sections order and content)
const HomepageSectionsSchema = new mongoose.Schema({
  sectionName: { type: String, required: true }, // e.g. "Hero Banner Slider", "Flash Sale"
  sectionType: { type: String, required: true }, // e.g. "grid", "slider", "banner"
  order: { type: Number, required: true },
  content: { type: mongoose.Schema.Types.Mixed }, // Arbitrary JSON
  isActive: { type: Boolean, default: true },
});
```

### 2.7 Reviews, Settings, and Logs

```javascript
// Review Schema
const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: false }, // Admin approval verification
  },
  { timestamps: true },
);

// Settings Schema
const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "PARIWESH" },
  companyAddress: { type: String },
  supportEmail: { type: String },
  contactPhone: { type: String },
  taxPercentage: { type: Number, default: 12 }, // default GST
  freeShippingThreshold: { type: Number, default: 1500 },
});

// Notifications
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Audit Logs
const AuditLogsSchema = new mongoose.Schema(
  {
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // e.g. "DELETE_PRODUCT", "UPDATE_ORDER_STATUS"
    module: { type: String, required: true }, // e.g. "Products", "Orders"
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);
```

---

## 3. API ROUTES ARCHITECTURE & ENDPOINTS

All APIs follow JSON REST payload guidelines and use HTTP Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`).

### Auth API (`/api/v1/auth`)

- `POST /register` - Form values validation & new user insertion.
- `POST /login` - Password validation -> Returns Access token in response, stores HTTPS-Only Refresh Token.
- `POST /refresh-token` - Checks JWT cookie -> Auto-creates a new Access Token.
- `POST /logout` - Clears cookie & databases.
- `POST /otp/send` - Dispatches validation token.
- `POST /otp/verify` - Confirms user status.

### Products API (`/api/v1/products`)

- `GET /` - Dynamic filter, searching, and pagination queries.
- `GET /:slug` - Single product verification with aggregate ratings.
- `POST /` (Admin) - Create new product details.
- `PUT /:id` (Admin) - Edit pricing, categories, and attributes.
- `DELETE /:id` (Admin) - Marks item inactive or deletes metadata.

### Orders API (`/api/v1/orders`)

- `GET /` (User/Admin) - Fetches order arrays with filter indices.
- `GET /:orderId` - Specific tracking parameters.
- `POST /checkout` - Validates quantities, processes payment signatures, initiates transactions.
- `PUT /:id/status` (Admin) - Sets shipping statuses.

---

## 4. AUTHENTICATION & SECURITY FLOWS

```text
[CLIENT]                                                 [SERVER]
   | --- 1. Submits Credentials --------------------------> |
   | <--- 2. Sends short-lived Access Token & Set-Cookie -- | (HttpOnly, Secure Refresh Token)
   |
   | --- 3. Request (Headers: Authorization Bearer JWT) --> | (Validates Access Token)
   | <--- 4. Data Response -------------------------------- |
   |
   | (AccessToken Expires)
   |
   | --- 5. Request (without header) ---------------------> | (Access Token expired error)
   | --- 6. POST /refresh-token (Cookies: Send RT) ------> | (Validates Refresh Token)
   | <--- 7. Returns New Access Token & New RT ------------- | (Refresh Token Rotated)
```

---

## 5. STATE MANAGEMENT STRATEGY

Using **Redux Toolkit** for central client state and **TanStack Query** (React Query) for server states:

1.  **Redux Store:**
    - `authSlice`: Authenticated status, user session tags, role designations.
    - `cartSlice`: Local UI interactions for items, counts, calculations.
    - `wishlistSlice`: Quick toggles.
2.  **TanStack Query:**
    - Queries for products, category listings, coupon checks, order logs.
    - Automatic caching & stale-while-revalidate configurations to ensure speed.

---

## 6. DEVELOPMENT ROADMAP & NEXT PHASES

- **PHASE 2:** Project Setup, config initialization, environmental validation, directories creation.
- **PHASE 3:** MongoDB configuration, model creation.
- **PHASE 4:** Controller classes, security setup, email service connections, and authentication routes.
- **PHASE 5:** Admin Panel dashboard, management interfaces for Products, Orders, Banners.
- **PHASE 6:** Redux integrations, Product Details page, Infinite Scroll, advanced search.
- **PHASE 7:** Checkout pipeline, Razorpay integrations, Order success tracking.
- **PHASE 8:** End-to-end optimization, tests validation, automated deployment configuration.
