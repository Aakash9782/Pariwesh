import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { sendMail } from "../utils/mailer.js";
import EmailLog from "../models/EmailLog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

async function run() {
  const recipient =
    process.argv[2] ||
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.NODEMAILER_USER;
  if (!recipient) {
    console.error(
      "error: Please specify a recipient email address as an argument or set EMAIL_FROM_ADDRESS / NODEMAILER_USER in your environment.",
    );
    process.exit(1);
  }

  console.log(`[Test] Connecting to Database...`);
  await connectDB();

  console.log(`[Test] Sending test email to ${recipient}...`);
  const result = await sendMail({
    to: recipient,
    subject: "PARIWESH Email System Migration Test",
    html: `<h3>Test Email</h3><p>This is a test email validating the Brevo transactional port 443 integration.</p>`,
    text: "This is a test email validating the Brevo transactional port 443 integration.",
    type: "other",
    meta: { testRun: true },
  });

  console.log("\n--- Send Result ---");
  console.log(`ok:        ${result.ok}`);
  console.log(`messageId: ${result.messageId || "N/A"}`);
  console.log(`provider:  ${result.provider}`);
  if (!result.ok) {
    console.log(`error:     ${result.error}`);
  }
  console.log("-------------------\n");

  if (result.ok && result.messageId) {
    console.log("[Test] Verifying EmailLog in MongoDB...");
    const log = await EmailLog.findOne({ messageId: result.messageId });
    if (log) {
      console.log("✅ EmailLog Entry Verified:");
      console.log(`- ID: ${log._id}`);
      console.log(`- To: ${log.to}`);
      console.log(`- Status: ${log.status}`);
      console.log(`- Provider: ${log.provider}`);
      console.log(`- HTTP Status: ${log.statusCode}`);
      console.log(`- Latency: ${log.latencyMs}ms`);
      console.log(`- Retries: ${log.retryCount}`);
    } else {
      console.error("❌ EmailLog Entry NOT found in database.");
    }
  }

  await mongoose.disconnect();
  console.log("[Test] Database Disconnected.");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
