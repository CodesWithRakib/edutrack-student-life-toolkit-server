import Class from "../models/classModel.js";

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private
export const createClass = async (req, res) => {
  try {
    const {
      title,
      startTime,
      endTime,
      location,
      instructor,
      type,
      day,
      description,
      recurring,
      color,
    } = req.body;

    const newClass = await Class.create({
      user: req.user.uid,
      title,
      startTime,
      endTime,
      location,
      instructor,
      type,
      day: day.toLowerCase(),
      description,
      recurring: recurring || "weekly",
      color: color || getDefaultColor(type), // Use provided color or default based on type
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get default color based on class type
const getDefaultColor = (type) => {
  const defaultColors = {
    lecture:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30",
    lab: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30",
    tutorial:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800/30",
    discussion:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30",
  };
  return (
    defaultColors[type] ||
    "bg-gray-100 text-gray-800 border border-gray-200 dark:border-gray-700"
  );
};

// @desc    Get all classes for the logged-in user
// @route   GET /api/classes
// @access  Private
export const getClasses = async (req, res) => {
  try {
    const { day, type, startDate, endDate } = req.query;
    let filter = { user: req.user.uid };

    if (day) filter.day = day.toLowerCase();
    if (type) filter.type = type;

    // Add date range filtering
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const classes = await Class.find(filter).sort({ day: 1, startTime: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private
export const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findOne({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classItem);
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
      user: req.user.uid,
      day: day.toLowerCase(),
    }).sort({ startTime: 1 });

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
    const { limit = 5, offset = 0 } = req.query;
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const toMinutes = (time) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

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
    let skipCount = 0;

    for (const day of orderedDays) {
      const dayClasses = await Class.find({
        user: req.user.uid,
        day,
      }).sort({ startTime: 1 });

      for (const cls of dayClasses) {
        if (
          day === currentDay &&
          toMinutes(cls.startTime) <= toMinutes(currentTime)
        )
          continue;

        // Skip classes until we reach the offset
        if (skipCount < parseInt(offset)) {
          skipCount++;
          continue;
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
    // Only get the days used in the frontend (Monday through Saturday)
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const { weekOffset = 0 } = req.query;

    // Calculate the start of the week based on the offset
    const now = new Date();
    now.setDate(now.getDate() + parseInt(weekOffset) * 7);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start from Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday

    const classes = await Class.find({
      user: req.user.uid,
      day: { $in: days },
    }).sort({
      day: 1,
      startTime: 1,
    });

    const weeklySchedule = {};
    days.forEach((day) => {
      weeklySchedule[day] = classes.filter((cls) => cls.day === day);
    });

    // Add week dates to the response
    res.json({
      weeklySchedule,
      weekDates: {
        start: startOfWeek,
        end: endOfWeek,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get classes organized by time slots
// @route   GET /api/classes/timeslots
// @access  Private
export const getClassesByTimeSlots = async (req, res) => {
  try {
    const { day } = req.query;
    let filter = { user: req.user.uid };

    if (day) {
      filter.day = day.toLowerCase();
    }

    const classes = await Class.find(filter).sort({ startTime: 1 });

    // Create time slots from 8:00 to 21:00
    const timeSlots = {};
    for (let hour = 8; hour <= 21; hour++) {
      const timeSlot = `${hour}:00`;
      timeSlots[timeSlot] = classes.filter((cls) => {
        const startHour = parseInt(cls.startTime.split(":")[0]);
        return startHour === hour;
      });
    }

    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private
export const updateClass = async (req, res) => {
  try {
    const { day, color, ...updates } = req.body;

    if (day) {
      updates.day = day.toLowerCase();
    }

    // If color is being updated, use it directly
    if (color) {
      updates.color = color;
    }

    const classItem = await Class.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      updates,
      { new: true, runValidators: true }
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
      user: req.user.uid,
    });

    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json({ message: "Class removed", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get class statistics (analytics)
// @route   GET /api/classes/stats
// @access  Private
export const getClassStats = async (req, res) => {
  try {
    const { weekOffset = 0 } = req.query;

    // Calculate the start and end of the week based on the offset
    const now = new Date();
    now.setDate(now.getDate() + parseInt(weekOffset) * 7);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start from Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday

    // Get classes for the specified week
    const classes = await Class.find({
      user: req.user.uid,
      day: {
        $in: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      },
    });

    if (classes.length === 0) {
      return res.json({
        busiestDay: null,
        totalHours: 0,
        classCount: 0,
        classesByType: {},
        classesByDay: {},
      });
    }

    // Count classes by day
    const dayCount = {};
    // Count classes by type
    const typeCount = {};
    // Calculate total minutes
    let totalMinutes = 0;

    classes.forEach((cls) => {
      // Count by day
      dayCount[cls.day] = (dayCount[cls.day] || 0) + 1;

      // Count by type
      typeCount[cls.type] = (typeCount[cls.type] || 0) + 1;

      // Calculate duration
      const [sh, sm] = cls.startTime.split(":").map(Number);
      const [eh, em] = cls.endTime.split(":").map(Number);
      totalMinutes += eh * 60 + em - (sh * 60 + sm);
    });

    // Find busiest day
    const busiestDay = Object.entries(dayCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Format total hours to one decimal place
    const totalHours = (totalMinutes / 60).toFixed(1);

    res.json({
      busiestDay,
      totalHours,
      classCount: classes.length,
      classesByType: typeCount,
      classesByDay: dayCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk create classes
// @route   POST /api/classes/bulk
// @access  Private
export const bulkCreateClasses = async (req, res) => {
  try {
    const { classes } = req.body;

    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: "No classes provided" });
    }

    const newClasses = await Class.insertMany(
      classes.map((cls) => ({
        ...cls,
        user: req.user.uid,
        day: cls.day.toLowerCase(),
        recurring: cls.recurring || "weekly",
        color: cls.color || getDefaultColor(cls.type),
      }))
    );

    res.status(201).json(newClasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update only class color
// @route   PATCH /api/classes/:id/color
// @access  Private
export const updateClassColor = async (req, res) => {
  try {
    const { color } = req.body;
    const classItem = await Class.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      { color },
      { new: true, runValidators: true }
    );

    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
