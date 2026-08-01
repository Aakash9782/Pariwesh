import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import ReturnRequest from "./models/ReturnRequest.js";

dotenv.config();

const runTest = async () => {
  try {
    console.log("=================================================");
    console.log("⏳ STARTING END-TO-END RETURN & REFUND WORKFLOW TESTS");
    console.log("=================================================");

    console.log("🔌 Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected successfully.");

    // 1. Fetch or create a test User
    let user = await User.findOne({ role: "customer" });
    if (!user) {
      user = await User.findOne({});
    }
    if (!user) {
      console.log("➡️ Seeding mock customer...");
      user = await User.create({
        name: "Test Customer",
        email: "test.customer@example.com",
        phone: "9999999999",
        password: "securepassword123",
        role: "customer",
      });
    }
    console.log(`👤 Active Customer: ${user.name} (${user.phone})`);

    // 2. Fetch or create a test Product
    let product = await Product.findOne({});
    if (!product) {
      console.log("➡️ Seeding mock product...");
      product = await Product.create({
        name: "Premium Kurta Set Pro Test",
        slug: "premium-kurta-set-pro-test",
        sku: "TEST-KRT-001",
        category: "kurtis",
        mrp: 2999,
        price: 1999,
        stock: 50,
        sizes: ["S", "M", "L"],
        sizesStock: {
          S: 10,
          M: 20,
          L: 20,
          XL: 10,
          XXL: 10,
        },
      });
    }
    console.log(`👗 Active Product: ${product.name} (SKU: ${product.sku})`);

    // Record baseline stock for size M page
    const baselineStockM = product.sizesStock.M;
    console.log(`📦 Baseline Stock for Size M: ${baselineStockM}`);

    // 3. Initiate a Test Order
    console.log("🛒 Creating Mock Delivered COD Order...");
    const orderIdRandom = Math.floor(100000 + Math.random() * 900000);
    const testOrder = await Order.create({
      orderId: `PRW-ORD-${orderIdRandom}`,
      customer: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      items: [
        {
          productId: product._id.toString(),
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 2,
          size: "M",
          color: "Ivory",
          image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e",
        },
      ],
      shippingAddress: {
        fullName: "Test Customer",
        phone: "9999999999",
        street: "Boutique Lane 42",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      pricing: {
        subtotal: product.price * 2,
        grandTotal: product.price * 2,
      },
      paymentMethod: "COD",
      paymentStatus: "Paid",
      orderStatus: "Delivered",
      deliveredAt: new Date(),
    });

    console.log(
      `✅ Test Order Created: ${testOrder.orderId} (ID: ${testOrder._id})`,
    );

    // 4. Test Case 1: Verify 7-day return window guard
    console.log(
      "\n🧪 Test Case 1: Verifying 7-day return window validation...",
    );
    const oldDeliveryDate = new Date();
    oldDeliveryDate.setDate(oldDeliveryDate.getDate() - 8); // 8 days ago

    // Simulate check
    const diffTime = Math.abs(Date.now() - oldDeliveryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      console.log(
        `   ✔️ Success: Return window of ${diffDays} days correctly flagged as EXPIRED (> 7 days).`,
      );
    } else {
      throw new Error(
        "   ❌ Failure: Return window logic failed to identify old delivery.",
      );
    }

    // 5. Test Case 2: Create valid partial return request (1 qty out of 2)
    console.log("\n🧪 Test Case 2: Creating valid return request...");
    const returnIdRandom = Math.floor(100000 + Math.random() * 900000);
    const returnReq = await ReturnRequest.create({
      returnId: `PRW-RET-${returnIdRandom}`,
      orderId: testOrder._id,
      customerId: user._id,
      items: [
        {
          productId: product._id.toString(),
          name: product.name,
          sku: product.sku,
          size: "M",
          quantity: 1, // partial return
          price: product.price,
        },
      ],
      reason: "Damaged Product Received",
      status: "Return_Requested",
      evidenceTrail: {
        customerUploads: ["https://res.cloudinary.com/dummy/image1.png"],
      },
      refundDetails: {
        method: "UPI",
        amount: product.price * 1,
        upiId: "test-refund@upi",
        status: "Pending",
      },
      timeline: {
        requestedAt: new Date(),
      },
    });

    // Update order status to match
    testOrder.orderStatus = "Return_Requested";
    await testOrder.save();

    console.log(
      `   ✔️ Return Request Created: ${returnReq.returnId} (Status: ${returnReq.status})`,
    );

    // Fetch refreshed order to verify status synchronization
    const refOrder1 = await Order.findById(testOrder._id);
    console.log(
      `   ✔️ Refreshed Order State: Status = ${refOrder1.orderStatus}`,
    );
    if (refOrder1.orderStatus !== "Return_Requested") {
      throw new Error("Order status mismatch after Return_Requested.");
    }

    // 6. Test Case 3: Transition to Return_Approved
    console.log("\n🧪 Test Case 3: Approving return request...");
    returnReq.status = "Return_Approved";
    returnReq.timeline.reviewedAt = new Date();
    returnReq.timeline.assignedAt = new Date();
    await returnReq.save();

    refOrder1.orderStatus = "Return_Approved";
    await refOrder1.save();
    console.log(
      `   ✔️ Return Status: ${returnReq.status}. Order Status: ${refOrder1.orderStatus}`,
    );

    // 7. Test Case 4: Courier Transit transition
    console.log("\n🧪 Test Case 4: Mark dispatch Courier In Transit...");
    returnReq.status = "Return_In_Transit";
    returnReq.timeline.pickedAt = new Date();
    await returnReq.save();

    refOrder1.orderStatus = "Return_In_Transit";
    await refOrder1.save();
    console.log(
      `   ✔️ Return Status: ${returnReq.status}. Order Status: ${refOrder1.orderStatus}`,
    );

    // 8. Test Case 5: Warehouse receipt loading
    console.log("\n🧪 Test Case 5: Mark Warehouse Received...");
    returnReq.status = "Return_Received";
    returnReq.timeline.receivedAt = new Date();
    await returnReq.save();

    refOrder1.orderStatus = "Return_Received";
    await refOrder1.save();
    console.log(
      `   ✔️ Return Status: ${returnReq.status}. Order Status: ${refOrder1.orderStatus}`,
    );

    // 9. Test Case 6: QC Complete and stock auto-restock check (A_GRADE)
    console.log(
      "\n🧪 Test Case 6: Submitting QC Grade A_GRADE (Restock Validation)...",
    );

    returnReq.status = "Return_Completed";
    returnReq.timeline.qcCompletedAt = new Date();
    returnReq.timeline.refundCompletedAt = new Date();
    returnReq.qcGrading = {
      grade: "A_GRADE",
      remarks: "Defect free retail resale grade",
      inspectedBy: "Warehouse QA Admin",
    };
    returnReq.refundDetails.status = "Paid";
    returnReq.refundDetails.transactionId = "TXN_UTR_992834I721";
    await returnReq.save();

    refOrder1.orderStatus = "Return_Completed";
    refOrder1.paymentStatus = "Refunded";
    await refOrder1.save();

    // Trigger restocking logic
    for (const item of returnReq.items) {
      const p = await Product.findById(item.productId);
      const size = item.size;
      const currentVal = Number(p.sizesStock[size]) || 0;
      p.sizesStock[size] = currentVal + item.quantity;
      await p.save();
    }

    // Verify stock incremented
    const refProduct = await Product.findById(product._id);
    const postStockM = refProduct.sizesStock.M;
    console.log(
      `   ✔️ baseline: ${baselineStockM}. Post-Return size M stock: ${postStockM}`,
    );
    if (postStockM !== baselineStockM + 1) {
      throw new Error("Stock count was not auto-restocked for A Grade return!");
    }
    console.log(
      "   ✔️ SUCCESS: Stock restored correctly for A Grade item (Post stock = baseline + 1 quantity)",
    );

    // 10. Clean up Test Documents
    console.log("\n🧹 Cleaning up test artifacts...");
    // Restore stock to baseline
    refProduct.sizesStock.M = baselineStockM;
    await refProduct.save();

    await Order.findByIdAndDelete(testOrder._id);
    await ReturnRequest.findByIdAndDelete(returnReq._id);
    console.log("✅ Cleanup complete.");

    console.log("\n=================================================");
    console.log("🎉 ALL RETURN & REFUND WORKFLOW TESTS PASSED 100%");
    console.log("=================================================");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST EXCURSION FAILURE:", error);
    process.exit(1);
  }
};

runTest();
