// routes/project.route.js (Fixed/Updated)
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const Projects = require("../models/project.model");

const router = express.Router();

// GET all projects
router.get("/", authenticateToken, async (req, res) => {
  try {
    const projects = await Projects.find().sort({ createdAt: -1 });
    res.status(200).json({ projects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

// GET a single project
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Projects.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ project });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid project ID format." });
    }
    res
      .status(500)
      .json({ message: "Error fetching project", error: error.message });
  }
});

// POST a new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newProject = new Projects({ name, description });
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Project name already exists" });
    }
    res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
  }
});

// PUT (Update) a project
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const project = await Projects.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating project", error: error.message });
  }
});

// DELETE a project
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Projects.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
});

module.exports = router;
