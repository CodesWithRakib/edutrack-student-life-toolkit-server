// src/controllers/userController.js
import admin from "../config/firebase.js";
import User from "../models/userModel.js";

// ------------------
// Sync Firebase user with DB
// ------------------
export const createUserIfNotExist = async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ message: "Invalid Firebase user data." });
    }

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || "",
        avatar: "",
        role: "student",
        status: "active",
        lastLogin: new Date(),
        reputation: 0,
      });

      return res.status(201).json({
        message: "User created successfully",
        user,
      });
    } else {
      const updates = {};
      if (name && name !== user.name) updates.name = name;
      if (email !== user.email) updates.email = email;
      if (!user.lastLogin || Object.keys(updates).length > 0) {
        updates.lastLogin = new Date();
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

// ------------------
// Get own profile
// ------------------
export const getMyProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ status: "active" })
      .sort({ reputation: -1 })
      .limit(20)
      .select("name avatar reputation role");

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Update own profile
// ------------------
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

// ------------------
// Get all users (Admin only) with pagination
// ------------------
export const getAllUsers = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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

// ------------------
// Update user role (Admin only)
// ------------------
export const updateUserRole = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
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

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Update user status (Admin only)
// ------------------
export const updateUserStatus = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const { status } = req.body;
    if (!["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Delete user (Admin + Firebase)
// ------------------
export const deleteUser = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete from Firebase Auth
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        console.error("Firebase delete error:", firebaseError);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Suspend user (Admin only)
// ------------------
export const suspendUser = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Activate user (Admin only)
// ------------------
export const activateUser = async (req, res) => {
  try {
    const requestingUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------
// Utility: get user by ID
// ------------------
export const getUserById = async (id) => {
  return await User.findById(id);
};
