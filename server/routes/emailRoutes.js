import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import EmailLog from "../models/EmailLog.js";
import { sendSuccess, sendError } from "../utils/responseFormatter.js";

const router = express.Router();

// @desc    List outbound emails (admin mail inbox)
// @route   GET /api/v1/emails
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      status,
      type,
      search,
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

export default router;
