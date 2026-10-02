import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import EmailLog from "../models/EmailLog.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

// @desc    List outbound emails (admin mail inbox)
// @route   GET /api/v1/emails
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      status,
      type,
      search,
      timeframe,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { to: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { from: { $regex: q, $options: "i" } },
      ];
    }

    if (timeframe && timeframe !== "all") {
      const now = new Date();
      if (timeframe === "today") {
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
        );
        filter.createdAt = { $gte: todayStart };
      } else if (timeframe === "7d") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filter.createdAt = { $gte: sevenDaysAgo };
      } else if (timeframe === "30d") {
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        filter.createdAt = { $gte: thirtyDaysAgo };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [emails, total, sentCount, failedCount, skippedCount] =
      await Promise.all([
        EmailLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select("-html -text")
          .lean(),
        EmailLog.countDocuments(filter),
        EmailLog.countDocuments({ status: "sent" }),
        EmailLog.countDocuments({ status: "failed" }),
        EmailLog.countDocuments({ status: "skipped" }),
      ]);

    return sendSuccess(res, "Emails retrieved successfully", {
      emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
        total: sentCount + failedCount + skippedCount,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

// @desc    Get single email with full body
// @route   GET /api/v1/emails/:id
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const email = await EmailLog.findById(req.params.id).lean();
    if (!email) {
      return sendError(res, "Email not found", 404);
    }
    return sendSuccess(res, "Email retrieved successfully", email);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

// @desc    Resend an existing outbound email
// @route   POST /api/v1/emails/:id/resend
router.post("/:id/resend", protect, authorize("admin"), async (req, res) => {
  try {
    const original = await EmailLog.findById(req.params.id).lean();
    if (!original) {
      return sendError(res, "Original email log not found", 404);
    }

    if (original.type === "otp") {
      return sendError(
        res,
        "OTP emails cannot be resent for security reasons. Please ask the customer to generate a fresh OTP.",
        400,
      );
    }

    const recipient = req.body.to?.trim() || original.to;
    const result = await sendMail({
      to: recipient,
      subject: original.subject,
      html: original.html,
      text: original.text,
      type: original.type,
      meta: {
        ...(original.meta || {}),
        resentFromId: original._id,
        resentAt: new Date().toISOString(),
        resentBy: req.user?.email || "admin",
      },
    });

    if (!result.ok) {
      return sendError(res, result.error || "Failed to deliver email", 500);
    }

    return sendSuccess(res, `Email resent successfully to ${recipient}`, result);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

// @desc    Send a diagnostic test email to verify live delivery
// @route   POST /api/v1/emails/send-test
router.post("/send-test", protect, authorize("admin"), async (req, res) => {
  try {
    const recipient = (req.body.to || req.user?.email || "").trim();
    if (!recipient) {
      return sendError(res, "Recipient email is required for test email", 400);
    }

    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #8a1c14; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #8a1c14; margin: 0; font-size: 22px; font-family: serif; letter-spacing: 1.5px;">PARIWESH ATELIER</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Live Diagnostic Delivery Check</p>
        </div>
        <p style="color: #1e293b; font-size: 14px; line-height: 1.6;">
          Hello Admin,<br><br>
          This is a verified test email sent from your <strong>PARIWESH Admin Mailer</strong>. Your store's outbound mailing pipeline is healthy, connected, and delivering messages normally.
        </p>
        <div style="background: #fafaf9; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 18px 0; font-size: 12px; color: #475569; line-height: 1.8;">
          <strong>Target Recipient:</strong> ${recipient}<br>
          <strong>Dispatched At:</strong> ${new Date().toLocaleString("en-IN")}<br>
          <strong>Status:</strong> Active & Operational
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          © ${new Date().getFullYear()} PARIWESH. All rights reserved.
        </p>
      </div>
    `;

    const result = await sendMail({
      to: recipient,
      subject: "PARIWESH - Outbound Mail Service Test",
      html: testHtml,
      text: `PARIWESH - Outbound Mail Service Test\n\nThis is a verified test email sent from the PARIWESH Admin Mailer at ${new Date().toLocaleString("en-IN")}. Your outbound email delivery pipeline is operational.`,
      type: "admin_order_notification",
      meta: {
        isTestMail: true,
        dispatchedBy: req.user?.email || "admin",
      },
    });

    if (!result.ok) {
      return sendError(res, result.error || "Failed to dispatch test email", 500);
    }

    return sendSuccess(
      res,
      `Diagnostic test email delivered successfully to ${recipient}`,
      result,
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

export default router;
