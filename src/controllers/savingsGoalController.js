import SavingsGoal from "../models/savingsGoalModel.js";

// @desc    Create or update savings goal
// @route   POST /api/savings-goals
// @access  Private
export const setSavingsGoal = async (req, res) => {
  try {
    const { target, current, description } = req.body;

    // Check if savings goal exists for the user
    let savingsGoal = await SavingsGoal.findOne({ user: req.user._id });

    if (savingsGoal) {
      // Update existing goal
      savingsGoal.target = target;
      savingsGoal.current = current;
      savingsGoal.description = description;
      await savingsGoal.save();
    } else {
      // Create new goal
      savingsGoal = await SavingsGoal.create({
        user: req.user._id,
        target,
        current,
        description,
      });
    }

    res.json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get savings goal for the logged-in user
// @route   GET /api/savings-goals
// @access  Private
export const getSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({ user: req.user._id });

    if (!savingsGoal) {
      return res.status(404).json({ message: "Savings goal not set" });
    }

    res.json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings-goals
// @access  Private
export const updateSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true }
    );

    res.json(savingsGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
