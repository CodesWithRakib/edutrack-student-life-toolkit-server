import Class from "../models/classModel.js";

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private
export const createClass = async (req, res) => {
  try {
    const {
      title,
      time,
      location,
      instructor,
      type,
      day,
      description,
      startDate,
      endDate,
      recurring,
    } = req.body;

    const newClass = await Class.create({
      user: req.user._id,
      title,
      time,
      location,
      instructor,
      type,
      day,
      description,
      startDate,
      endDate,
      recurring,
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all classes for the logged-in user
// @route   GET /api/classes
// @access  Private
export const getClasses = async (req, res) => {
  try {
    const { day, type } = req.query;
    let filter = { user: req.user._id };

    // Apply filters if provided
    if (day) filter.day = day;
    if (type) filter.type = type;

    const classes = await Class.find(filter).sort({ day: 1, time: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get classes by day
// @route   GET /api/classes/day/:day
// @access  Private
export const getClassesByDay = async (req, res) => {
  try {
    const { day } = req.params;
    const classes = await Class.find({
      user: req.user._id,
      day: day.toLowerCase(),
    }).sort({ time: 1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming classes
// @route   GET /api/classes/upcoming
// @access  Private
export const getUpcomingClasses = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const daysOrder = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDayIndex = daysOrder.indexOf(currentDay);
    const orderedDays = [
      ...daysOrder.slice(currentDayIndex),
      ...daysOrder.slice(0, currentDayIndex),
    ];

    const upcomingClasses = [];
    for (const day of orderedDays) {
      const dayClasses = await Class.find({
        user: req.user._id,
        day,
      }).sort({ startTime: 1 });

      for (const cls of dayClasses) {
        if (day === currentDay) {
          if (cls.startTime <= currentTime) continue;
        }
        upcomingClasses.push(cls);
        if (upcomingClasses.length >= parseInt(limit)) break;
      }
      if (upcomingClasses.length >= parseInt(limit)) break;
    }
    res.json(upcomingClasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weekly schedule
// @route   GET /api/classes/weekly
// @access  Private
export const getWeeklySchedule = async (req, res) => {
  try {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const weeklySchedule = {};

    for (const day of days) {
      const classes = await Class.find({
        user: req.user._id,
        day,
      }).sort({ time: 1 });

      weeklySchedule[day] = classes;
    }

    res.json(weeklySchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private
export const updateClass = async (req, res) => {
  try {
    const classItem = await Class.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private
export const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json({ message: "Class removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
