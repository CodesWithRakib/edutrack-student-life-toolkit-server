import Answer from "../models/answerModel.js";
import Question from "../models/questionModel.js";
import User from "../models/userModel.js";

export const acceptAnswerUtil = async (answerId, userId) => {
  const answer = await Answer.findById(answerId).populate("question");
  if (!answer) throw new Error("Answer not found");

  const question = answer.question;

  // Check if the user is the owner of the question
  if (question.user.toString() !== userId.toString()) {
    throw new Error("Not authorized to accept this answer");
  }

  // Unaccept all other answers for this question
  await Answer.updateMany(
    { question: question._id, _id: { $ne: answer._id } },
    { isAccepted: false }
  );

  // Accept this answer
  answer.isAccepted = true;
  await answer.save();

  // Award reputation to the answer author
  await User.findOneAndUpdate(
    { firebaseUid: answer.user },
    { $inc: { reputation: 10 } }
  );

  // Update the question
  question.solved = true;
  question.acceptedAnswer = answer._id;
  await question.save();

  return answer;
};
