import db from "../models/index.js";

const User = db.user;

/**
 * Middleware that resolves the authenticated user's work_location
 * and attaches it to req.workLocation for downstream controllers.
 * Must be used AFTER the authenticate middleware.
 */
const attachLocation = async (req, res, next) => {
  try {
    // Skip for demo mode
    if (req.user?.isDemo) {
      req.workLocation = null;
      return next();
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      req.workLocation = null;
      return next();
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'work_location']
    });

    if (!user) {
      req.workLocation = null;
      return next();
    }

    req.workLocation = user.work_location || null;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error("Error in attachLocation middleware:", err.message);
    req.workLocation = null;
    next();
  }
};

export default attachLocation;
