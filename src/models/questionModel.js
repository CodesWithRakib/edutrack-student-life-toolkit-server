import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    votes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    answersCount: {
      type: Number,
      default: 0,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
