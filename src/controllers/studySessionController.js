import StudySession from "../models/studySessionModel.js";

// @desc    Create a new study session
// @route   POST /api/study-sessions
// @access  Private
export const createStudySession = async (req, res) => {
  try {
    const { subject, topic, duration, date, time, priority, notes } = req.body;

    const studySession = await StudySession.create({
      user: req.user._id,
      subject,
      topic,
      duration,
      date,
      time,
      priority,
      notes,
    });

    res.status(201).json(studySession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all study sessions for the logged-in user
// @route   GET /api/study-sessions
// @access  Private
export const getStudySessions = async (req, res) => {
  try {
    const { period, completed } = req.query;
    let filter = { user: req.user._id };

    // Apply period filter if provided
    if (period) {
      const now = new Date();
      let startDate;

      switch (period) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 7
          );
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      filter.date = { $gte: startDate };
    }

    // Apply completion filter if provided
    if (completed !== undefined) {
      filter.completed = completed === "true";
    }

    const studySessions = await StudySession.find(filter).sort({
      date: 1,
      time: 1,
    });
    res.json(studySessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a study session
// @route   PUT /api/study-sessions/:id
// @access  Private
export const updateStudySession = async (req, res) => {
  try {
    const studySession = await StudySession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!studySession) {
      return res.status(404).json({ message: "Study session not found" });
    }

    res.json(studySession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle completion status of a study session
// @route   PATCH /api/study-sessions/:id/toggle
// @access  Private
export const toggleStudySessionCompletion = async (req, res) => {
  try {
    const studySession = await StudySession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!studySession) {
      return res.status(404).json({ message: "Study session not found" });
    }

    studySession.completed = !studySession.completed;
    await studySession.save();

    res.json(studySession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a study session
// @route   DELETE /api/study-sessions/:id
// @access  Private
export const deleteStudySession = async (req, res) => {
  try {
    const studySession = await StudySession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!studySession) {
      return res.status(404).json({ message: "Study session not found" });
    }

    res.json({ message: "Study session removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
