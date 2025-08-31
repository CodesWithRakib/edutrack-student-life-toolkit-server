import User from "../models/userModel.js";

// Sync Firebase user with DB
export const createUserIfNotExist = async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ message: "Invalid Firebase user data." });
    }

    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      // Create new user with proper defaults including lastLogin
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || "",
        avatar: "",
        role: "student",
        status: "active",
        lastLogin: new Date(),
      });

      return res.status(201).json({
        message: "User created successfully",
        user,
      });
    } else {
      // Update existing user info if changed
      const updates = {};
      if (name && name !== user.name) updates.name = name;
      if (email !== user.email) updates.email = email;

      // Add lastLogin update if needed
      if (!user.lastLogin || Object.keys(updates).length > 0) {
        updates.lastLogin = new Date(); // Update lastLogin on any change
      }

      if (Object.keys(updates).length > 0) {
        user = await User.findOneAndUpdate({ firebaseUid: uid }, updates, {
          new: true,
        });
      }

      return res.status(200).json({
        message: "User already exists",
        user,
      });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get own profile
export const getMyProfile = async (req, res) => {
  const { uid } = req.user;
  try {
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
export const updateMyProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      updates,
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { uid } = req.user;
    // Check if requesting user is admin
    const requestingUser = await User.findOne({ firebaseUid: uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by newest first

    const totalUsers = await User.countDocuments();

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { uid } = req.user; // Get Firebase UID
    // First check if the requesting user is an admin
    const requestingUser = await User.findOne({ firebaseUid: uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const { role } = req.body;
    if (!role || !["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New utility functions
export const getUserById = async (id) => {
  return await User.findById(id);
};

export const suspendUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { status: "suspended" },
    { new: true }
  );
  return user;
};

export const activateUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { status: "active" },
    { new: true }
  );
  return user;
};
