import Assignment from "../models/assignmentModel.js";

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private
export const createAssignment = async (req, res) => {
  try {
    const { title, subject, dueDate, priority, description } = req.body;
    const assignment = await Assignment.create({
      user: req.user._id,
      title,
      subject,
      dueDate,
      priority,
      description,
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
    const { completed, priority } = req.query;
    let filter = { user: req.user._id };

    if (completed !== undefined) {
      filter.completed = completed === "true";
    }

    if (priority) {
      filter.priority = priority;
    }

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
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

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
      user: req.user._id,
    });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
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
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
