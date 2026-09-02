import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import ActivityLog from "./models/ActivityLog.js";
import Notification from "./models/Notification.js";

// Load env variables
dotenv.config();

const Adjectives = [
  "Royal",
  "Ethereal",
  "Classic",
  "Heritage",
  "Festive",
  "Vibrant",
  "Imperial",
  "Vintage",
  "Mystic",
  "Summer",
  "Velvet",
  "Floral",
  "Elegant",
  "Graceful",
  "Midnight",
  "Blushing",
  "Golden",
  "Crimson",
  "Ivory",
  "Emerald",
  "Regal",
  "Dewy",
  "Lustrous",
  "Sublime",
  "Majestic",
];

const Colors = [
  "Rose",
  "Ivory",
  "Mustard",
  "Teal",
  "Maroon",
  "Peach",
  "Indigo",
  "Sage",
  "Pink",
  "Green",
  "Red",
  "Purple",
  "Lavender",
  "Turquoise",
  "Mint",
  "Beige",
  "Plum",
  "Gold",
  "Coral",
  "Lilac",
];

const ColorHexes = [
  "#FFC0CB",
  "#FFFFF0",
  "#FFDB58",
  "#008080",
  "#800000",
  "#FFDAB9",
  "#4B0082",
  "#9C9F84",
  "#FFC0CB",
  "#008000",
  "#FF0000",
  "#800080",
  "#E6E6FA",
  "#40E0D0",
  "#98FF98",
  "#F5F5DC",
  "#DDA0DD",
  "#FFD700",
  "#FF7F50",
  "#C8A2C8",
];

const SalwarNouns = [
  "Chanderi Suit Set",
  "Anarkali Ensemble",
  "Angrakha Salwar Suit",
  "Sharara Set",
  "Gharara Dress",
  "Cotton Kurta Pant Set",
  "Organza Dupatta Suit",
  "Silk Straight Suit",
  "Palazzo Suit Set",
  "Georgette Suit Set",
];

const KurtiNouns = [
  "Straight Kurti",
  "A-Line Tunic",
  "Short Kurti",
  "Anarkali Kurti",
  "Naira Cut Kurti",
  "Flared Kurta",
  "Printed Tunic",
  "Embroidered Kurta",
];

const EthnicNouns = [
  "Designer Saree",
  "Heritage Lehenga",
  "Silk Banarasi Dupatta",
  "Festive Gown",
  "Chaniya Choli",
  "Jacket Style Suit",
];

const imagePool = [
  "/hero.png",
  "/hero.png",
  "/hero.png",
  "/hero.png",
  "/hero.png",
  "/hero.png",
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in environment");
    }

    console.log("📡 Connecting to Database...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database Connected.");

    // 1. DELETE EXISTING DATA
    console.log(
      "🧹 Clearing collections (Users, Products, Orders, ActivityLogs, Notifications)...",
    );
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    console.log("🧹 Collections cleared.");

    // 2. SEED ADMINS
    console.log("👥 Seeding Admins...");
    const admins = [
      {
        name: "Aakash Saini",
        email: "sainiaakash177@gmail.com",
        phone: "9782681155",
        role: "admin",
        status: "active",
        addresses: [],
      },
    ];
    const createdAdmins = await User.insertMany(admins);
    console.log(`✅ Seeded ${createdAdmins.length} Admin Users.`);

    // 3. SEED DUMMY CUSTOMERS
    console.log("👥 Seeding Customers...");
    const customersList = [
      {
        name: "Pooja Sharma",
        email: "pooja.sharma@example.com",
        phone: "9876543232",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Pooja Sharma",
            phone: "9876543232",
            street: "102, Royal Residency, Malviya Nagar",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302017",
            type: "Home",
          },
        ],
      },
      {
        name: "Anjali Verma",
        email: "anjali.v@example.com",
        phone: "8123456789",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Anjali Verma",
            phone: "8123456789",
            street: "Block C-4, DLF Phase 5",
            city: "Gurugram",
            state: "Haryana",
            pincode: "122002",
            type: "Office",
          },
        ],
      },
      {
        name: "Kriti Sen",
        email: "kriti.sen@example.com",
        phone: "9988776655",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Kriti Sen",
            phone: "9988776655",
            street: "Apt 501, Lodha Heights, Upper Worli",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400018",
            type: "Home",
          },
        ],
      },
      {
        name: "Preeti Singh",
        email: "preeti.s@example.com",
        phone: "9123456780",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Preeti Singh",
            phone: "9123456780",
            street: "HNo. 423, Sector 15",
            city: "Noida",
            state: "Uttar Pradesh",
            pincode: "201301",
            type: "Home",
          },
        ],
      },
      {
        name: "Meera Nair",
        email: "meera.nair@example.com",
        phone: "7012345678",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Meera Nair",
            phone: "7012345678",
            street: "12th Cross, Indiranagar",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560038",
            type: "Office",
          },
        ],
      },
      {
        name: "Riya Kapoor",
        email: "riya.kapoor@example.com",
        phone: "8989898989",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Riya Kapoor",
            phone: "8989898989",
            street: "B-201, Green Glen Layout",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560103",
            type: "Home",
          },
        ],
      },
      {
        name: "Tanya Goyal",
        email: "tanya.g@example.com",
        phone: "9312345678",
        role: "customer",
        status: "active",
        addresses: [
          {
            fullName: "Tanya Goyal",
            phone: "9312345678",
            street: "Flat 4B, Sector 62",
            city: "Noida",
            state: "Uttar Pradesh",
            pincode: "201309",
            type: "Home",
          },
        ],
      },
    ];
    const createdCustomers = await User.insertMany(customersList);
    console.log(`✅ Seeded ${createdCustomers.length} Customer Users.`);

    // 4. SEED PRODUCTS (50 Designer Suits/Kurtis/Ethnic Items)
    console.log("👗 Seeding 50 Dummy Products...");
    const productsData = [];
    const fabrics = [
      "Pure Cotton",
      "Chanderi Silk",
      "Georgette",
      "Organza",
      "Velvet",
      "Mulmul Cotton",
      "Silk Blend",
    ];

    for (let i = 1; i <= 50; i++) {
      // Determine category (approx 35 suits, 10 kurtis, 5 ethnic)
      let cat = "suits";
      if (i > 35 && i <= 45) cat = "kurtis";
      else if (i > 45) cat = "ethnic";

      // Build descriptors
      const adj = Adjectives[(i - 1) % Adjectives.length];
      const col = Colors[(i - 1) % Colors.length];

      let noun = "";
      if (cat === "suits") {
        noun = SalwarNouns[(i - 1) % SalwarNouns.length];
      } else if (cat === "kurtis") {
        noun = KurtiNouns[(i - 1) % KurtiNouns.length];
      } else {
        noun = EthnicNouns[(i - 1) % EthnicNouns.length];
      }

      const name = `${adj} ${col} ${noun} ${i}`; // unique name
      const sku = `PARI-${cat.toUpperCase().slice(0, 3)}-${100 + i}`;
      const fabric = fabrics[(i - 1) % fabrics.length];

      const mrp = 1999 + ((i * 137) % 4000);
      const discountPct = 30 + (i % 26); // 30% to 55% discount
      const price = Math.round(mrp * (1 - discountPct / 100));

      // Stock configurations
      let stockLevel = 15;
      let sStk = { M: 10, L: 10, XL: 10, XXL: 10 };

      if (i === 7 || i === 21) {
        // Out of stock
        stockLevel = 0;
        sStk = { M: 0, L: 0, XL: 0, XXL: 0 };
      } else if (i === 15 || i === 33) {
        // Low Stock
        stockLevel = 3;
        sStk = { M: 1, L: 1, XL: 1, XXL: 0 };
      } else {
        stockLevel = 16 + (i % 24);
        const val = Math.floor(stockLevel / 4);
        sStk = {
          M: val,
          L: val,
          XL: val,
          XXL: stockLevel - val * 3,
        };
      }

      productsData.push({
        name,
        sku,
        category: cat,
        fabric,
        washCare: i % 2 === 0 ? "Dry Clean Only" : "Gentle Hand Wash",
        color: col,
        colorHex: ColorHexes[(i - 1) % ColorHexes.length],
        sizes: ["M", "L", "XL", "XXL"],
        sizesStock: sStk,
        mrp,
        discount: discountPct,
        price,
        stock: stockLevel,
        subCategory:
          cat === "suits" ? "Premium Suit Set" : "Festive Collection",
        brand: "Pariwesh",
        gst: 5,
        hsnCode: `HSN${5208 + i}`,
        material: fabric,
        weight: "450g",
        countryOfOrigin: "India",
        returnDays: 7,
        featured: i % 3 === 0,
        trending: i % 4 === 0,
        bestSeller: i % 5 === 0,
        newArrival: i % 2 === 0,
        recommended: i % 6 === 0,
        images: [
          imagePool[(i - 1) % imagePool.length],
          imagePool[i % imagePool.length],
        ],
        description: `Experience luxury like never before with our premium quality ${name}. Made with love from high-grade ${fabric} fabric and intricately detailed for a rich royal finish. Ideal for functions, semi-formal get-togethers, and festive occasions.`,
      });
    }

    const createdProd = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${createdProd.length} Products/Suites.`);

    // 5. SEED DUMMY ORDERS (To make the admin dashboard analytics show beautiful dynamic data)
    console.log(
      "📦 Seeding 15 Dummy Orders with historic dates for dashboard charts...",
    );
    const orderStatuses = [
      "Placed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    const paymentMethods = ["COD", "ONLINE"];
    const ordersData = [];

    // Let's create orders from the last 30 days
    const today = new Date();

    for (let oNum = 1; oNum <= 15; oNum++) {
      const customerUser =
        createdCustomers[(oNum - 1) % createdCustomers.length];
      const address = customerUser.addresses[0];

      // Select 1 or 2 random products
      const pIdx1 = (oNum * 3) % createdProd.length;
      const pIdx2 = (oNum * 7) % createdProd.length;

      const prod1 = createdProd[pIdx1];
      const prod2 = createdProd[pIdx2];

      const qty1 = 1;
      const qty2 = oNum % 3 === 0 ? 1 : 0; // sometimes 1 item, sometimes 2 items

      const items = [
        {
          productId: prod1._id.toString(),
          name: prod1.name,
          sku: prod1.sku,
          price: prod1.price,
          quantity: qty1,
          size: "M",
          color: prod1.color,
          image: prod1.images[0],
        },
      ];

      if (qty2 > 0) {
        items.push({
          productId: prod2._id.toString(),
          name: prod2.name,
          sku: prod2.sku,
          price: prod2.price,
          quantity: qty2,
          size: "L",
          color: prod2.color,
          image: prod2.images[0],
        });
      }

      const subtotal = items.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0,
      );
      const delivery = subtotal > 1500 ? 0 : 99;
      const discount = oNum % 4 === 0 ? 150 : 0;
      const gst = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + delivery + gst - discount;

      const method = paymentMethods[oNum % 2];
      const status = orderStatuses[oNum % orderStatuses.length];

      let pStatus = "Pending";
      if (status === "Delivered") pStatus = "Paid";
      else if (method === "ONLINE") pStatus = "Paid";

      // Set order date spanning over past 30 days
      const daysAgo = (oNum * 2) % 30;
      const orderDate = new Date();
      orderDate.setDate(today.getDate() - daysAgo);
      orderDate.setHours(10 + (oNum % 10), 15 + (oNum % 40), 0, 0);

      ordersData.push({
        orderId: `OD${100000 + oNum}`,
        customer: {
          userId: customerUser._id.toString(),
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone,
        },
        items,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        pricing: {
          subtotal,
          delivery,
          gst,
          discount,
          grandTotal,
        },
        paymentMethod: method,
        paymentStatus: pStatus,
        orderStatus: status,
        trackingId:
          status === "Shipped" || status === "Delivered"
            ? `TRK${892010 + oNum}`
            : "",
        shippingProvider:
          status === "Shipped" || status === "Delivered" ? "Delhivery" : "",
        customerNotes: oNum % 3 === 0 ? "Please deliver in afternoon." : "",
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }

    const createdOrders = await Order.insertMany(ordersData);
    console.log(`✅ Seeded ${createdOrders.length} Historic Orders.`);

    // 6. SEED SOME HEALTHY ACTIVITY LOGS
    console.log("📝 Seeding Activity Logs...");
    const logsData = [
      {
        adminName: "Pariwesh Admin Desk",
        action: "Database cleared & re-seeded with 50 products",
        device: "Chrome / Windows",
        ipAddress: "192.168.1.13",
      },
      {
        adminName: "Pariwesh Admin Desk",
        action: "Updated general festive banner settings",
        device: "Chrome / Windows",
        ipAddress: "192.168.1.13",
      },
      {
        adminName: "Pariwesh Super Admin",
        action: "Admin login successful",
        device: "Chrome / macOS",
        ipAddress: "182.72.10.45",
      },
    ];
    await ActivityLog.insertMany(logsData);
    console.log("✅ Seeded Activity Logs.");

    // 7. SEED LOW STOCK NOTIFICATIONS
    console.log("🔔 Seeding Notification alerts...");
    const notifsData = [
      {
        type: "stock_alert",
        message:
          "Product 'Mystic Coralstraight Suit' is low on stock (Size: S)",
        read: false,
      },
      {
        type: "stock_alert",
        message: "Product 'Crimson Mustard Salwar Set' is out of stock",
        read: false,
      },
    ];
    await Notification.insertMany(notifsData);
    console.log("✅ Seeded notifications.");

    console.log("\n🚀 DB SEEDING COMPLETED SUCCESSFUL!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
};

seedDatabase();
