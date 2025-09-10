import voteModel from "../models/voteModel.js";
import User from "../models/userModel.js";

export const handleVote = async ({
  userId,
  type,
  targetId,
  targetType,
  model,
}) => {
  if (!["up", "down"].includes(type)) {
    throw new Error("Invalid vote type. Use 'up' or 'down'");
  }

  // Check target existence
  const target = await model.findById(targetId);
  if (!target) throw new Error(`${targetType} not found`);

  // Check existing vote
  const existingVote = await voteModel.findOne({
    user: userId,
    [targetType]: targetId,
  });

  let voteChange = 0;
  if (existingVote) {
    if (existingVote.type === type) {
      // Remove vote
      await voteModel.findByIdAndDelete(existingVote._id);
      voteChange = type === "up" ? -1 : 1;
      target.votes += voteChange;
      // Adjust reputation
      await User.findOneAndUpdate(
        { firebaseUid: target.user },
        { $inc: { reputation: type === "up" ? -5 : 2 } }
      );
    } else {
      // Change vote type
      existingVote.type = type;
      await existingVote.save();
      voteChange = type === "up" ? 2 : -2;
      target.votes += voteChange;
      // Adjust reputation
      await User.findOneAndUpdate(
        { firebaseUid: target.user },
        { $inc: { reputation: type === "up" ? 7 : -7 } } // -5+2 or -2+5
      );
    }
  } else {
    // New vote
    await voteModel.create({
      user: userId,
      [targetType]: targetId,
      type,
    });
    voteChange = type === "up" ? 1 : -1;
    target.votes += voteChange;
    // Adjust reputation
    await User.findOneAndUpdate(
      { firebaseUid: target.user },
      { $inc: { reputation: type === "up" ? 5 : -2 } }
    );
  }

  await target.save();
  return target;
};
