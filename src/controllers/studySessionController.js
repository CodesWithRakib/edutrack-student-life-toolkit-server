import StudySession from "../models/studySessionModel.js";

// @desc    Create a new study session
// @route   POST /api/study-sessions
// @access  Private
export const createStudySession = async (req, res) => {
  try {
    const { subject, topic, durationMinutes, date, time, priority, notes } =
      req.body;

    const studySession = await StudySession.create({
      user: req.user.uid,
      subject,
      topic,
      durationMinutes,
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
    const filter = { user: req.user.uid };

    const now = new Date();
    if (period) {
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

    if (completed !== undefined) filter.completed = completed === "true";

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
      { _id: req.params.id, user: req.user.uid },
      req.body,
      { new: true }
    );

    if (!studySession)
      return res.status(404).json({ message: "Study session not found" });

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
      user: req.user.uid,
    });

    if (!studySession)
      return res.status(404).json({ message: "Study session not found" });

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
      user: req.user.uid,
    });

    if (!studySession)
      return res.status(404).json({ message: "Study session not found" });

    res.json({ message: "Study session removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
