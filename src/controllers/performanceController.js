import Grade from "../models/gradeModel.js";
import StudySession from "../models/studySessionModel.js";
import Assignment from "../models/assignmentModel.js";
import StudyGoal from "../models/studyGoalModel.js";

// @desc    Get overall performance data
// @route   GET /api/performance/overview
// @access  Private
export const getPerformanceOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get overall average grade
    const grades = await Grade.find({ user: userId });
    const overallAverage =
      grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length
        : 0;

    // Get study hours this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklySessions = await StudySession.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const weeklyHours = weeklySessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );

    // Get completed assignments
    const totalAssignments = await Assignment.countDocuments({ user: userId });
    const completedAssignments = await Assignment.countDocuments({
      user: userId,
      submitted: true,
    });

    // Get achieved goals
    const totalGoals = await StudyGoal.countDocuments({ user: userId });
    const achievedGoals = await StudyGoal.countDocuments({
      user: userId,
      achieved: true,
    });

    res.json({
      overallAverage: Math.round(overallAverage * 10) / 10,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      completedAssignments: `${completedAssignments}/${totalAssignments}`,
      completionRate:
        totalAssignments > 0
          ? Math.round((completedAssignments / totalAssignments) * 100)
          : 0,
      achievedGoals: `${achievedGoals}/${totalGoals}`,
      goalsProgress:
        totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get grades data
// @route   GET /api/performance/grades
// @access  Private
export const getGradesData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get grades by subject
    const grades = await Grade.find({ user: userId }).sort({ subject: 1 });

    // Get grade history for line chart
    const assignments = await Assignment.find({
      user: userId,
      graded: true,
    }).sort({ date: 1 });

    res.json({
      grades,
      gradeHistory: assignments.map((assignment) => ({
        name: assignment.title,
        grade: assignment.grade,
        date: assignment.date.toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study analytics data
// @route   GET /api/performance/analytics
// @access  Private
export const getStudyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get weekly study pattern
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklySessions = await StudySession.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });

    // Group by day of week
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyProgressData = daysOfWeek.map((day) => {
      const dayIndex = daysOfWeek.indexOf(day);
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + dayIndex);

      const daySessions = weeklySessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return sessionDate.getDay() === dayIndex;
      });

      const hours = daySessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );

      return { day, hours: Math.round(hours * 10) / 10 };
    });

    // Get subject distribution
    const allSessions = await StudySession.find({ user: userId });
    const subjectHours = {};

    allSessions.forEach((session) => {
      if (!subjectHours[session.subject]) {
        subjectHours[session.subject] = 0;
      }
      subjectHours[session.subject] += session.duration;
    });

    const totalHours = Object.values(subjectHours).reduce(
      (sum, hours) => sum + hours,
      0
    );

    const subjectDistributionData = Object.entries(subjectHours).map(
      ([name, value]) => ({
        name,
        value: Math.round((value / totalHours) * 100),
      })
    );

    // Get study goals
    const goals = await StudyGoal.find({ user: userId });

    res.json({
      weeklyProgressData,
      subjectDistributionData,
      goals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study recommendations
// @route   GET /api/performance/recommendations
// @access  Private
export const getStudyRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get grades to identify weak subjects
    const grades = await Grade.find({ user: userId });
    const weakSubjects = grades
      .filter((grade) => grade.trend === "down" || grade.grade < 80)
      .map((grade) => grade.subject);

    // Get study sessions to check consistency
    const sessions = await StudySession.find({ user: userId });
    const studyDays = new Set(
      sessions.map(
        (session) => new Date(session.date).toISOString().split("T")[0]
      )
    );

    const isConsistent = studyDays.size >= 5; // Studied at least 5 different days

    // Get upcoming assignments
    const now = new Date();
    const upcomingAssignments = await Assignment.find({
      user: userId,
      dueDate: { $gte: now },
      submitted: false,
    }).sort({ dueDate: 1 });

    // Get goals progress
    const goals = await StudyGoal.find({ user: userId, achieved: false });

    // Generate recommendations
    const recommendations = [];

    if (weakSubjects.length > 0) {
      recommendations.push({
        type: "focus",
        title: `Focus Area: ${weakSubjects[0]}`,
        description: `Your ${weakSubjects[0]} scores have decreased. Consider spending more time reviewing key concepts.`,
        icon: "Award",
      });
    }

    if (!isConsistent) {
      recommendations.push({
        type: "consistency",
        title: "Study Consistency",
        description:
          "Your study patterns are inconsistent. Try to establish a regular study schedule to improve retention.",
        icon: "Clock",
      });
    }

    if (upcomingAssignments.length > 0) {
      const daysUntilDue = Math.ceil(
        (upcomingAssignments[0].dueDate - now) / (1000 * 60 * 60 * 24)
      );
      recommendations.push({
        type: "upcoming",
        title: "Upcoming Assessments",
        description: `You have a ${upcomingAssignments[0].subject} assignment due in ${daysUntilDue} days. Start preparing now to avoid last-minute cramming.`,
        icon: "Calendar",
      });
    }

    if (goals.length > 0) {
      recommendations.push({
        type: "goal",
        title: "Goal Setting",
        description:
          "Set specific targets for each study session to increase productivity and focus.",
        icon: "Target",
      });
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
