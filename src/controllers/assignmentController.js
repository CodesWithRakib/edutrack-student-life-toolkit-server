import Assignment from "../models/assignmentModel.js";

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      subject,
      dueDate,
      priority,
      description,
      grade,
      maxGrade,
      durationMinutes,
    } = req.body;

    const assignment = await Assignment.create({
      user: req.user.uid,
      title,
      subject,
      date: new Date(),
      dueDate,
      priority,
      description,
      grade,
      maxGrade: maxGrade || 100,
      achieved: grade ? grade >= (maxGrade || 100) * 0.6 : false, // threshold example
      completed: !!grade,
      graded: !!grade,
      durationMinutes: durationMinutes || 0,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments for the logged-in user
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res) => {
  try {
    const { completed, priority, graded, subject } = req.query;
    let filter = { user: req.user.uid };

    if (completed !== undefined) filter.completed = completed === "true";
    if (priority) filter.priority = priority;
    if (graded !== undefined) filter.graded = graded === "true";
    if (subject) filter.subject = subject;

    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an assignment
// @route   PUT /api/assignments/:id
// @access  Private
export const updateAssignment = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Update achieved and graded status if grade is provided
    if (updates.grade !== undefined) {
      updates.graded = true;
      updates.completed = true;
      updates.achieved = updates.grade >= (updates.maxGrade || 100) * 0.6;
    }

    // Ensure durationMinutes is a number, default to 0 if missing
    if (updates.durationMinutes === undefined) {
      updates.durationMinutes = 0;
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      updates,
      { new: true }
    );

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle completion status of an assignment
// @route   PATCH /api/assignments/:id/toggle
// @access  Private
export const toggleAssignmentCompletion = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    assignment.completed = !assignment.completed;
    await assignment.save();

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    res.json({ message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
