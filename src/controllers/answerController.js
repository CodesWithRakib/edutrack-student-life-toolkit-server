import Question from "../models/questionModel.js";
import Answer from "../models/answerModel.js";
import User from "../models/userModel.js";
import { handleVote } from "../utils/voteHandler.js";
import { acceptAnswerUtil } from "../utils/answerHandler.js";

// @desc    Create a new answer
// @route   POST /api/answers
// @access  Private
export const createAnswer = async (req, res) => {
  try {
    const { questionId, content } = req.body;

    // Validate input
    if (!questionId || !content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question ID and content are required",
      });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Check if user already answered this question
    const existingAnswer = await Answer.findOne({
      question: questionId,
      user: req.user.uid,
    });

    if (existingAnswer) {
      return res.status(400).json({
        success: false,
        message: "You have already answered this question",
      });
    }

    const answer = await Answer.create({
      question: questionId,
      user: req.user.uid,
      content,
    });

    // Update question answers count
    await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } });

    // Award reputation for answering
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $inc: { reputation: 5 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        answer,
        newReputation: user.reputation,
      },
    });
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create answer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all answers for a question
// @route   GET /api/answers/question/:questionId
// @access  Public
export const getAnswersByQuestion = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // First, check if the question exists
    const questionExists = await Question.exists({
      _id: req.params.questionId,
    });
    if (!questionExists) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Fetch answers without populating user (since user is a string, not a reference)
    const answers = await Answer.find({ question: req.params.questionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get all unique user IDs from the answers
    const userIds = [...new Set(answers.map((ans) => ans.user))];

    // Fetch user data for all unique user IDs
    const users = await User.find({ firebaseUid: { $in: userIds } })
      .select("name avatar role firebaseUid reputation")
      .lean();

    // Create a map of user IDs to user data for quick lookup
    const userMap = {};
    users.forEach((user) => {
      userMap[user.firebaseUid] = user;
    });

    // Format answers for frontend to match the Answer interface
    const formattedAnswers = answers.map((ans) => {
      const formattedAnswer = { ...ans };

      if (formattedAnswer.isAnonymous) {
        formattedAnswer.user = {
          name: "Anonymous",
          avatar: null,
          reputation: 0,
          isTeacher: false,
        };
      } else {
        // Get user data from our map
        const userData = userMap[formattedAnswer.user];
        if (userData) {
          formattedAnswer.user = {
            name: userData.name,
            avatar: userData.avatar || null,
            reputation: userData.reputation || 0,
            isTeacher: userData.role === "teacher",
          };
        } else {
          // Fallback if user not found
          formattedAnswer.user = {
            name: "Unknown User",
            avatar: null,
            reputation: 0,
            isTeacher: false,
          };
        }
      }

      return formattedAnswer;
    });

    // Get total count for pagination
    const total = await Answer.countDocuments({
      question: req.params.questionId,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Return structured response matching GetAnswersResponse interface
    res.json({
      success: true,
      data: {
        answers: formattedAnswers,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch answers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update an answer
// @route   PUT /api/answers/:id
// @access  Private
export const updateAnswer = async (req, res) => {
  try {
    const { content } = req.body;

    // Validate input
    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const answer = await Answer.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      { content },
      { new: true }
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found or you don't have permission to update it",
      });
    }

    // Get user data for the updated answer to match the Answer interface
    const user = await User.findOne({ firebaseUid: answer.user })
      .select("name avatar role reputation")
      .lean();

    const formattedAnswer = {
      ...answer.toObject(),
      user: {
        name: user?.name || "Unknown User",
        avatar: user?.avatar || null,
        reputation: user?.reputation || 0,
        isTeacher: user?.role === "teacher",
      },
    };

    res.json({
      success: true,
      data: formattedAnswer,
    });
  } catch (error) {
    console.error("Error updating answer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update answer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete an answer
// @route   DELETE /api/answers/:id
// @access  Private
export const deleteAnswer = async (req, res) => {
  const session = await Answer.startSession();
  session.startTransaction();

  try {
    const answer = await Answer.findOne({
      _id: req.params.id,
      user: req.user.uid,
    }).session(session);

    if (!answer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Answer not found or you don't have permission to delete it",
      });
    }

    // Remove the answer
    await Answer.findByIdAndDelete(answer._id).session(session);

    // Update answer count in the question
    await Question.findByIdAndUpdate(
      answer.question,
      { $inc: { answersCount: -1 } },
      { session }
    );

    // If this was the accepted answer, update the question
    if (answer.isAccepted) {
      await Question.findByIdAndUpdate(
        answer.question,
        { solved: false, acceptedAnswer: null },
        { session }
      );
    }

    // Decrease reputation (reverse the reputation gained for this answer)
    const user = await User.findOneAndUpdate(
      { firebaseUid: answer.user },
      { $inc: { reputation: -5 } },
      { session, new: true }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Answer removed successfully",
      data: {
        newReputation: user.reputation,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting answer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete answer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Vote on an answer
// @route   POST /api/answers/:id/vote
// @access  Private
export const voteAnswer = async (req, res) => {
  try {
    const { type } = req.body;

    // Validate vote type
    if (!type || !["up", "down"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type",
      });
    }

    const answer = await handleVote({
      userId: req.user.uid,
      type,
      targetId: req.params.id,
      targetType: "answer",
      model: Answer,
    });

    // Get user data for the updated answer to match the Answer interface
    const user = await User.findOne({ firebaseUid: answer.user })
      .select("name avatar role reputation")
      .lean();

    const formattedAnswer = {
      ...answer.toObject(),
      user: {
        name: user?.name || "Unknown User",
        avatar: user?.avatar || null,
        reputation: user?.reputation || 0,
        isTeacher: user?.role === "teacher",
      },
    };

    res.json({
      success: true,
      data: formattedAnswer,
    });
  } catch (error) {
    console.error("Error voting on answer:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Accept an answer (mark as solution)
// @route   POST /api/answers/:id/accept
// @access  Private
export const acceptAnswer = async (req, res) => {
  try {
    const answer = await acceptAnswerUtil(req.params.id, req.user.uid);

    // Get user data for the updated answer to match the Answer interface
    const user = await User.findOne({ firebaseUid: answer.user })
      .select("name avatar role reputation")
      .lean();

    const formattedAnswer = {
      ...answer.toObject(),
      user: {
        name: user?.name || "Unknown User",
        avatar: user?.avatar || null,
        reputation: user?.reputation || 0,
        isTeacher: user?.role === "teacher",
      },
    };

    res.json({
      success: true,
      data: formattedAnswer,
    });
  } catch (error) {
    console.error("Error accepting answer:", error);

    if (error.message === "Not authorized to accept this answer") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
