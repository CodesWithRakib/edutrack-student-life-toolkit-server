import StudyGoal from "../models/studyGoalModel.js";
import StudySession from "../models/studySessionModel.js";

// Helper function to calculate completed hours
const calculateCompletedHours = async (
  userId,
  subject,
  period,
  startDate,
  endDate
) => {
  const match = {
    user: userId,
    subject,
    completed: true,
  };

  const now = new Date();
  if (period === "daily") {
    match.date = {
      $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  } else if (period === "weekly") {
    match.date = {
      $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
    };
  } else if (period === "monthly") {
    match.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (startDate && endDate) {
    match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const result = await StudySession.aggregate([
    { $match: match },
    { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } },
  ]);

  return result.length ? result[0].totalMinutes / 60 : 0; // convert minutes to hours
};

// @desc    Create a new study goal
// @route   POST /api/study-goals
// @access  Private
export const createStudyGoal = async (req, res) => {
  try {
    const { subject, targetHours, period, startDate, endDate } = req.body;

    const existingGoal = await StudyGoal.findOne({
      user: req.user.uid,
      subject,
      period,
    });
    if (existingGoal) {
      return res.status(400).json({
        message: `You already have a ${period} goal for ${subject}`,
      });
    }

    const studyGoal = await StudyGoal.create({
      user: req.user.uid,
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
    const filter = { user: req.user.uid };
    if (period) filter.period = period;

    const studyGoals = await StudyGoal.find(filter);

    const goalsWithProgress = await Promise.all(
      studyGoals.map(async (goal) => {
        const completedHours = await calculateCompletedHours(
          req.user.uid,
          goal.subject,
          goal.period,
          goal.startDate,
          goal.endDate
        );

        goal.completedHours = completedHours;
        goal.achieved = completedHours >= goal.targetHours;
        await goal.save();

        return goal.toObject();
      })
    );

    res.json(goalsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a study goal
// @route   PUT /api/study-goals/:id
// @access  Private
export const updateStudyGoal = async (req, res) => {
  try {
    const studyGoal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      req.body,
      { new: true }
    );

    if (!studyGoal)
      return res.status(404).json({ message: "Study goal not found" });

    studyGoal.completedHours = await calculateCompletedHours(
      req.user.uid,
      studyGoal.subject,
      studyGoal.period,
      studyGoal.startDate,
      studyGoal.endDate
    );
    studyGoal.achieved = studyGoal.completedHours >= studyGoal.targetHours;

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
      user: req.user.uid,
    });

    if (!studyGoal)
      return res.status(404).json({ message: "Study goal not found" });

    res.json({ message: "Study goal removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
