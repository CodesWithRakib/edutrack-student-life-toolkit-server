import Question from "../models/questionModel.js";
import Answer from "../models/answerModel.js";
import voteModel from "../models/voteModel.js";

// @desc    Create a new answer
// @route   POST /api/answers
// @access  Private
export const createAnswer = async (req, res) => {
  try {
    const { questionId, content } = req.body;

    const answer = await Answer.create({
      question: questionId,
      user: req.user.uid,
      content,
    });

    // Update answer count in the question
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answersCount: 1 },
    });

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all answers for a question
// @route   GET /api/answers/question/:questionId
// @access  Public
export const getAnswersByQuestion = async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .sort({ createdAt: -1 })
      .populate("user", "name avatar");

    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an answer
// @route   PUT /api/answers/:id
// @access  Private
export const updateAnswer = async (req, res) => {
  try {
    const answer = await Answer.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      req.body,
      { new: true }
    );

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an answer
// @route   DELETE /api/answers/:id
// @access  Private
export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findOneAndDelete({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Update answer count in the question
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answersCount: -1 },
    });

    // If this was the accepted answer, update the question
    if (answer.isAccepted) {
      await Question.findByIdAndUpdate(answer.question, {
        solved: false,
        acceptedAnswer: null,
      });
    }

    res.json({ message: "Answer removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on an answer
// @route   POST /api/answers/:id/vote
// @access  Private
export const voteAnswer = async (req, res) => {
  try {
    const { type } = req.body;
    if (!["up", "down"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid vote type. Use 'up' or 'down'" });
    }
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    // Check existing vote
    const existingVote = await voteModel.findOne({
      user: req.user.uid,
      answer: req.params.id,
    });
    if (existingVote) {
      // Toggle vote if same type, otherwise change vote
      if (existingVote.type === type) {
        await voteModel.findByIdAndDelete(existingVote._id);
        answer.votes += type === "up" ? -1 : 1;
      } else {
        existingVote.type = type;
        await existingVote.save();
        answer.votes += type === "up" ? 2 : -2; // Adjust by 2 (remove old + add new)
      }
    } else {
      // New vote
      await voteModel.create({
        user: req.user.uid,
        answer: req.params.id,
        type,
      });
      answer.votes += type === "up" ? 1 : -1;
    }
    await answer.save();
    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept an answer (mark as solution)
// @route   POST /api/answers/:id/accept
// @access  Private
export const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate("question");

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if the user is the owner of the question
    if (answer.question.user.toString() !== req.user.uid.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to accept this answer" });
    }

    // Unaccept all other answers for this question
    await Answer.updateMany(
      { question: answer.question._id, _id: { $ne: answer._id } },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    // Update the question
    await Question.findByIdAndUpdate(answer.question._id, {
      solved: true,
      acceptedAnswer: answer._id,
    });

    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
