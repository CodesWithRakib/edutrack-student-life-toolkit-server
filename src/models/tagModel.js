// tagModel.js
import mongoose from "mongoose";
const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 30,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Add indexes
tagSchema.index({ count: -1 });
tagSchema.index({ name: 1 });

export default mongoose.model("Tag", tagSchema);
