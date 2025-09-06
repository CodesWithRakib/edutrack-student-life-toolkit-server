import fs from "fs";
import Resource from "../models/resourceModel.js";

// @desc    Get all resources with filtering and pagination
// @route   GET /api/resources
// @access  Private (Students, Teachers, Admins)
export const getResources = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      search,
      sortBy = "uploadDate",
      sortOrder = "desc",
    } = req.query;
    const query = {};
    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }
    // Filter by type
    if (type) {
      query.type = type;
    }
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    const resources = await Resource.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const total = await Resource.countDocuments(query);
    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private (Students, Teachers, Admins)
export const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }
    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (Teachers, Admins)
export const createResource = async (req, res) => {
  try {
    // Add user info from Firebase token
    req.body.uploadedBy = req.user.uid;
    req.body.uploadedByName = req.user.name;
    const resource = await Resource.create(req.body);
    res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Resource owner or Admin)
export const updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }
    // Check ownership or admin role
    if (resource.uploadedBy !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this resource",
      });
    }
    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Resource owner or Admin)
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }
    // Check ownership or admin role
    if (resource.uploadedBy !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this resource",
      });
    }
    // Delete file from filesystem (optional)
    if (fs.existsSync(resource.fileUrl)) {
      fs.unlinkSync(resource.fileUrl);
    }
    await Resource.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Download resource
// @route   GET /api/resources/:id/download
// @access  Private (Students, Teachers, Admins)
export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }
    // Increment download count
    resource.downloads += 1;
    await resource.save();
    // If student, increment student count
    if (req.user.role === "student") {
      resource.studentsCount += 1;
      await resource.save();
    }
    res.status(200).json({
      success: true,
      downloadUrl: resource.fileUrl,
      message: "Download started",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get resource categories
// @route   GET /api/resources/categories
// @access  Private (Students, Teachers, Admins)
export const getCategories = async (req, res) => {
  try {
    const categories = await Resource.distinct("category");
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
