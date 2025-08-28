import Question from "../models/questionModel.js";
import Answer from "../models/answerModel.js";
import Tag from "../models/tagModel.js";

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
export const createQuestion = async (req, res) => {
  try {
    const { title, content, subject, tags } = req.body;

    const question = await Question.create({
      user: req.user._id,
      title,
      content,
      subject,
      tags,
    });

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

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all questions with filtering and search
// @route   GET /api/questions
// @access  Public
export const getQuestions = async (req, res) => {
  try {
    const { subject, search, page = 1, limit = 10 } = req.query;
    let filter = {};

    // Apply subject filter if provided
    if (subject && subject !== "all") {
      filter.subject = subject;
    }

    // Apply search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("user", "name avatar");

    const total = await Question.countDocuments(filter);

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single question by ID
// @route   GET /api/questions/:id
// @access  Public
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("user", "name avatar")
      .populate("acceptedAnswer");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Delete all answers associated with this question
    await Answer.deleteMany({ question: req.params.id });

    // Update tag counts
    if (question.tags && question.tags.length > 0) {
      for (const tagName of question.tags) {
        await Tag.findOneAndUpdate({ name: tagName }, { $inc: { count: -1 } });
      }
    }

    res.json({ message: "Question removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on a question
// @route   POST /api/questions/:id/vote
// @access  Private
export const voteQuestion = async (req, res) => {
  try {
    const { type } = req.body; // "up" or "down"

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (type === "up") {
      question.votes += 1;
    } else if (type === "down") {
      question.votes -= 1;
    } else {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get popular tags
// @route   GET /api/questions/tags
// @access  Public
export const getPopularTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ count: -1 }).limit(20);
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json({
      totalQuestions,
      totalAnswers,
      solvedQuestions,
      successRate:
        totalQuestions > 0
          ? Math.round((solvedQuestions / totalQuestions) * 100)
          : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
