// questionController.js
import Question from "../models/questionModel.js";
import Answer from "../models/answerModel.js";
import Tag from "../models/tagModel.js";
import User from "../models/userModel.js";
import {
  createQuestionUtil,
  updateQuestionUtil,
} from "../utils/questionHandler.js";
import { validationResult } from "express-validator";
import { handleVote } from "../utils/voteHandler.js";

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
export const createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const question = await createQuestionUtil(req.user.uid, req.body);

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all questions with advanced filtering
// @route   GET /api/questions
// @access  Public
export const getQuestions = async (req, res) => {
  try {
    const {
      subject,
      tags,
      search,
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};
    let sortOptions = {};

    // Apply filters
    if (subject && subject !== "all") filter.subject = subject;

    let tagArray = [];
    if (tags) {
      tagArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $all: tagArray };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Sorting options
    switch (sort) {
      case "most-voted":
        sortOptions = { votes: -1 };
        break;
      case "most-viewed":
        sortOptions = { views: -1 };
        break;
      default: // newest
        sortOptions = { createdAt: -1 };
    }

    const questions = await Question.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get a single question by ID
// @route   GET /api/questions/:id
// @access  Public
export const getQuestionById = async (req, res) => {
  try {
    // Fetch question
    let question = await Question.findById(req.params.id).lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Increment views
    await Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Get user data for the question
    if (!question.isAnonymous) {
      const user = await User.findOne({ firebaseUid: question.user })
        .select("name avatar role reputation")
        .lean();

      if (user) {
        question.user = {
          name: user.name,
          avatar: user.avatar,
          reputation: user.reputation,
          isTeacher: user.role === "teacher",
        };
      } else {
        question.user = {
          name: "Unknown User",
          avatar: null,
          reputation: 0,
          isTeacher: false,
        };
      }
    } else {
      question.user = {
        name: "Anonymous",
        avatar: null,
        reputation: 0,
        isTeacher: false,
      };
    }

    // Fetch all answers with user info
    const answers = await Answer.find({ question: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Get all unique user IDs from the answers
    const userIds = [...new Set(answers.map((ans) => ans.user))];

    // Fetch user data for all unique user IDs
    const users = await User.find({ firebaseUid: { $in: userIds } })
      .select("name avatar role reputation")
      .lean();

    // Create a map of user IDs to user data for quick lookup
    const userMap = {};
    users.forEach((user) => {
      userMap[user.firebaseUid] = user;
    });

    // Format answers to include user data
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

    question.answers = formattedAnswers;

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private
export const updateQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const question = await updateQuestionUtil(
      req.user.uid,
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    if (error.message === "Question not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error updating question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Delete all answers associated with this question
    await Answer.deleteMany({ question: req.params.id });

    // Update tag counts
    if (question.tags && question.tags.length > 0) {
      for (const tagName of question.tags) {
        await Tag.findOneAndUpdate({ name: tagName }, { $inc: { count: -1 } });
      }
    }

    res.json({
      success: true,
      message: "Question removed successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Vote on a question
// @route   POST /api/questions/:id/vote
// @access  Private
export const voteQuestion = async (req, res) => {
  try {
    const question = await handleVote({
      userId: req.user.uid,
      type: req.body.type,
      targetId: req.params.id,
      targetType: "question",
      model: Question,
    });

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Error voting on question:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get popular tags
// @route   GET /api/questions/tags
// @access  Public
export const getPopularTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ count: -1 }).limit(20);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular tags",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get statistics
// @route   GET /api/questions/stats
// @access  Public
export const getStats = async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();
    const totalAnswers = await Answer.countDocuments();
    const solvedQuestions = await Question.countDocuments({ solved: true });
    const totalTags = await Tag.countDocuments();

    res.json({
      success: true,
      data: {
        totalQuestions,
        totalAnswers,
        solvedQuestions,
        totalTags,
        successRate:
          totalQuestions > 0
            ? Math.round((solvedQuestions / totalQuestions) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
