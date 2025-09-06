import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Science", "Mathematics", "History", "Literature", "Other"],
    },
    type: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["PDF", "Document", "Presentation", "Video", "Image", "Other"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    uploadedBy: {
      type: String, // Firebase UID
      required: true,
    },
    uploadedByName: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    studentsCount: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
resourceSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Resource", resourceSchema);
