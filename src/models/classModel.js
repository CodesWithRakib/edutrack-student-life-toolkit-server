import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
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
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    instructor: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "discussion"],
      required: true,
    },
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      required: true,
    },
    color: {
      type: String,
      default: function () {
        const colors = {
          lecture:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          lab: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          tutorial:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          discussion:
            "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        };
        return colors[this.type] || "bg-gray-100 text-gray-800";
      },
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    recurring: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
