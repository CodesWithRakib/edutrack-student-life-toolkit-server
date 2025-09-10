// controllers/statsController.js

import Question from "../models/questionModel.js";
import Answer from "../models/answerModel.js";
import User from "../models/userModel.js";

export const getWeeklyStats = async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Weekly questions & answers
    const weeklyQuestions = await Question.find({
      createdAt: { $gte: oneWeekAgo },
    });

    const weeklyAnswers = await Answer.find({
      createdAt: { $gte: oneWeekAgo },
    });

    // Leaderboard (activity count = questions + answers)
    const userActivityMap = {};
    weeklyQuestions.forEach((q) => {
      userActivityMap[q.user] = (userActivityMap[q.user] || 0) + 1;
    });
    weeklyAnswers.forEach((a) => {
      userActivityMap[a.user] = (userActivityMap[a.user] || 0) + 1;
    });

    const mostActiveUsers = await User.find({
      firebaseUid: { $in: Object.keys(userActivityMap) },
    })
      .select("name avatar reputation role firebaseUid")
      .lean();

    const activeUsersRanked = mostActiveUsers
      .map((u) => ({
        ...u,
        activityCount: userActivityMap[u.firebaseUid] || 0,
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10);

    // Fastest answered question
    const questionsWithAnswers = await Question.find({
      createdAt: { $gte: oneWeekAgo },
      answersCount: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    let fastestQuestion = null;
    let minTime = Infinity;

    for (let q of questionsWithAnswers) {
      const firstAnswer = await Answer.findOne({ question: q._id })
        .sort({ createdAt: 1 })
        .lean();

      if (firstAnswer) {
        const timeDiff =
          new Date(firstAnswer.createdAt) - new Date(q.createdAt);
        if (timeDiff < minTime) {
          minTime = timeDiff;
          fastestQuestion = {
            question: { _id: q._id, title: q.title },
            firstAnswer: { _id: firstAnswer._id, content: firstAnswer.content },
            timeToAnswer: Math.floor(minTime / 1000 / 60), // minutes
          };
        }
      }
    }

    // Trending tags
    const trendingTagsAgg = await Question.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      thisWeek: {
        questions: weeklyQuestions.length,
        answers: weeklyAnswers.length,
      },
      leaderboard: activeUsersRanked,
      fastestAnswered: fastestQuestion,
      trendingTags: trendingTagsAgg,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGlobalStats = async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();
    const totalAnswers = await Answer.countDocuments();
    const totalUsers = await User.countDocuments({ status: "active" });

    res.json({
      totals: {
        questions: totalQuestions,
        answers: totalAnswers,
        users: totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
