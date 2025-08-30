import admin from "../config/firebase.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or invalid" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    console.log(decoded);
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    res.status(401).json({ message: "Invalid token" });
  }
};
