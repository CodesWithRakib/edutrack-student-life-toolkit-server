import User from "../models/userModel.js";

// Sync Firebase user with DB
export const createUserIfNotExist = async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    if (!uid || !email) {
      return res.status(400).json({ message: "Invalid Firebase user data." });
    }

    // Check if user exists in your database
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user in your database
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || "",
        avatar: "",
        role: "student", // Default role
      });
      return res.status(201).json({
        message: "User created successfully",
        user,
      });
    } else {
      // User already exists
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
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
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

    const users = await User.find();
    res.json(users);
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
