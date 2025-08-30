// middleware/authorize.js
import User from "../models/userModel.js";

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { uid } = req.user;

      if (!uid) {
        return res.status(400).json({ message: "Invalid Firebase user data." });
      }

      // Find user in database
      const user = await User.findOne({ firebaseUid: uid });

      if (!user) {
        return res.status(404).json({ message: "User not found in database." });
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      // Attach database user to request for future use
      req.dbUser = user;
      req.user.role = user.role;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Server error during authorization." });
    }
  };
};

// Specific role middlewares for convenience
export const requireAdmin = requireRole(["admin"]);
export const requireTeacher = requireRole(["teacher", "admin"]);
export const requireStudent = requireRole(["student", "teacher", "admin"]);
