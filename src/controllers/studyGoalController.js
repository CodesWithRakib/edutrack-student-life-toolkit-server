import StudyGoal from "../models/studyGoalModel.js";
import StudySession from "../models/studySessionModel.js";

// @desc    Create a new study goal
// @route   POST /api/study-goals
// @access  Private
export const createStudyGoal = async (req, res) => {
  try {
    const { subject, targetHours, period, startDate, endDate } = req.body;

    // Check if a goal for this subject and period already exists
    const existingGoal = await StudyGoal.findOne({
      user: req.user._id,
      subject,
      period,
    });

    if (existingGoal) {
      return res.status(400).json({
        message: `You already have a ${period} goal for ${subject}`,
      });
    }

    const studyGoal = await StudyGoal.create({
      user: req.user._id,
      subject,
      targetHours,
      period,
      startDate,
      endDate,
    });

    res.status(201).json(studyGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all study goals for the logged-in user
// @route   GET /api/study-goals
// @access  Private
export const getStudyGoals = async (req, res) => {
  try {
    const { period } = req.query;
    let filter = { user: req.user._id };

    // Apply period filter if provided
    if (period) {
      filter.period = period;
    }

    const studyGoals = await StudyGoal.find(filter);

    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(
      studyGoals.map(async (goal) => {
        // Calculate completed hours based on completed study sessions
        const completedHours = await calculateCompletedHours(
          req.user._id,
          goal.subject,
          goal.period,
          goal.startDate,
          goal.endDate
        );

        // Update the goal with the calculated hours
        goal.completedHours = completedHours;
        await goal.save();

        return goal.toObject();
      })
    );

    res.json(goalsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate completed hours
const calculateCompletedHours = async (
  userId,
  subject,
  period,
  startDate,
  endDate
) => {
  let filter = {
    user: userId,
    subject,
    completed: true,
  };

  // Apply date filter based on period
  const now = new Date();
  if (period === "daily") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filter.date = { $gte: today };
  } else if (period === "weekly") {
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );
    filter.date = { $gte: weekStart };
  } else if (period === "monthly") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filter.date = { $gte: monthStart };
  } else if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const completedSessions = await StudySession.find(filter);

  // Sum up the hours from completed sessions
  let totalHours = 0;
  completedSessions.forEach((session) => {
    // Parse duration (e.g., "2 hours" -> 2)
    const duration = parseFloat(session.duration);
    if (!isNaN(duration)) {
      totalHours += duration;
    }
  });

  return totalHours;
};

// @desc    Update a study goal
// @route   PUT /api/study-goals/:id
// @access  Private
export const updateStudyGoal = async (req, res) => {
  try {
    const studyGoal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!studyGoal) {
      return res.status(404).json({ message: "Study goal not found" });
    }

    // Recalculate completed hours
    studyGoal.completedHours = await calculateCompletedHours(
      req.user._id,
      studyGoal.subject,
      studyGoal.period,
      studyGoal.startDate,
      studyGoal.endDate
    );

    await studyGoal.save();

    res.json(studyGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a study goal
// @route   DELETE /api/study-goals/:id
// @access  Private
export const deleteStudyGoal = async (req, res) => {
  try {
    const studyGoal = await StudyGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!studyGoal) {
      return res.status(404).json({ message: "Study goal not found" });
    }

    res.json({ message: "Study goal removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
