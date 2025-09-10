import Question from "../models/questionModel.js";
import Tag from "../models/tagModel.js";
import User from "../models/userModel.js";

export const createQuestionUtil = async (userId, questionData) => {
  const { title, content, subject, tags, attachments, isAnonymous } =
    questionData;

  const question = await Question.create({
    user: userId,
    title,
    content,
    subject,
    tags,
    attachments,
    isAnonymous: isAnonymous || false,
  });

  // Award reputation for asking a question
  await User.findOneAndUpdate(
    { firebaseUid: userId },
    { $inc: { reputation: 2 } }
  );

  // Update tag counts
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      await Tag.findOneAndUpdate(
        { name: tagName },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    }
  }

  return question;
};

export const updateQuestionUtil = async (userId, questionId, updateData) => {
  const { title, content, subject, tags, attachments } = updateData;

  const question = await Question.findOneAndUpdate(
    { _id: questionId, user: userId },
    { title, content, subject, tags, attachments },
    { new: true }
  );

  if (!question) throw new Error("Question not found");

  // Update tag counts
  if (tags && tags.length > 0) {
    const originalTags = question.tags || [];

    // Decrement old tags
    for (const tagName of originalTags) {
      if (!tags.includes(tagName)) {
        await Tag.findOneAndUpdate({ name: tagName }, { $inc: { count: -1 } });
      }
    }

    // Increment new tags
    for (const tagName of tags) {
      if (!originalTags.includes(tagName)) {
        await Tag.findOneAndUpdate({ name: tagName }, { $inc: { count: 1 } });
      }
    }
  }

  return question;
};
