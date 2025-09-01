// questionModel.js
import mongoose from "mongoose";
const questionSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.every(
            (tag) => typeof tag === "string" && tag.trim().length > 0
          );
        },
        message: "Tags must be non-empty strings",
      },
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    answersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
    attachments: [
      {
        url: String,
        type: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for performance
questionSchema.index({ subject: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ votes: -1 });
questionSchema.index({ views: -1 });
questionSchema.index({ createdAt: -1 });

export default mongoose.model("Question", questionSchema);
