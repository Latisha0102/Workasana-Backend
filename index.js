require("dotenv").config();

const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const { authenticateToken } = require("./middleware/auth");
const teamRoutes = require("./routes/teams.route");
const projectRoutes = require("./routes/project.route");
const reportRoutes = require("./routes/report.route.");

const Task = require("./models/task.model");

const Tags = require("./models/tag.model");
const NewUser = require("./models/user.model");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;

const corsOption = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await NewUser.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid credentials: User not found." });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid credentials: Incorrect password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({
      message: "Server error during login. Check server console for details.",
      error: error.message,
    });
  }
});

app.get("/auth/login", authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user details" });
  }
});

// app.post("/teams", authenticateToken, async (req, res) => {
//   const { name, description } = req.body;
//   try {
//     const newTeam = new Teams({ name, description });
//     await newTeam.save();
//     res
//       .status(201)
//       .json({ message: "Team created successfully", team: newTeam });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating team", error: error.message });
//   }
// });

// app.get("/teams", authenticateToken, async (req, res) => {
//  try {
//     const teams = await Teams.find().populate("members", "name email").sort({ name: 1 });
//     res.status(200).json({ teams });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching teams", error: error.message });
//   }
// });

// app.
// app.post("/projects", authenticateToken, async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const newProject = new Projects({ name, description });
//     await newProject.save();
//     res
//       .status(201)
//       .json({ message: "Project created successfully", project: newProject });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Project name already exists" });
//     }
//     res
//       .status(500)
//       .json({ message: "Error creating project", error: error.message });
//   }
// });

// app.get("/projects", authenticateToken, async (req, res) => {
//   try {
//     const projects = await Projects.find().sort({ createdAt: -1 });
//     res.status(200).json({ projects });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching projects", error: error.message });
//   }
// });

// app.get("/projects/:projectId", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const project = await Projects.findById(id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     res.status(200).json({ project });
//   } catch (error) {
//     if (error.name === "CastError") {
//       return res.status(400).json({ message: "Invalid project ID format." });
//     }
//     res
//       .status(500)
//       .json({ message: "Error fetching project", error: error.message });
//   }
// });

// app.put("/projects/:projectId", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;
//     const project = await Projects.findByIdAndUpdate(id, updates, {
//       new: true,
//     });
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     res.status(200).json({ message: "Project updated successfully", project });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating project", error: error.message });
//   }
// });

// app.delete("/projects/:projectId", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const project = await Projects.findByIdAndDelete(id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     res.status(200).json({ message: "Project deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error deleting project", error: error.message });
//   }
// });
app.post("/tags", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const newTag = new Tags({ name });
    await newTag.save();
    res.status(201).json({ message: "Tag created successfully", tag: newTag });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating tag", error: error.message });
  }
});

app.get("/tags", authenticateToken, async (req, res) => {
  try {
    const tags = await Tags.find();
    res.status(200).json({ tags });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tags", error: error.message });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  try {
    // Select only non-sensitive and necessary fields
    const users = await NewUser.find({})
      .select("_id name email")
      .sort({ name: 1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// --- STANDALONE TASK ROUTES (Kept here for simplicity) ---  

// POST a new task
app.post("/tasks", authenticateToken, async (req, res) => {
  try {
    const { name, project, team, owners, tags, timeToComplete, status } =
      req.body;

    // Handle tags: Split comma-separated string, find or create tags, get IDs
    const tagNames = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const tagIds = await Promise.all(
      tagNames.map(async (tagName) => {
        let tag = await Tags.findOne({ name: tagName });
        if (!tag) {
          tag = new Tags({ name: tagName });
          await tag.save();
        }
        return tag._id;
      })
    );

    const newTask = new Task({
      name,
      project,
      team,
      owners,
      tags: tagIds, // Save the array of tag ObjectIds
      timeToComplete,
      status,
    });

    await newTask.save();

    const populatedTask = await Task.findById(newTask._id).populate(
      "project team owners tags"
    );

    res
      .status(201)
      .json({ message: "Task created successfully", task: populatedTask });
  } catch (error) {
    console.error("Task creation error:", error);
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
});

// GET all tasks (with filtering)
app.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const { owner, tags, project, status } = req.query;
    let filter = {};

    if (owner) filter.owners = owner;
    if (tags) filter.tags = { $in: tags.split(",").filter(Boolean) };
    if (project) filter.project = project;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("project team owners tags")
      .sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
});

// PUT (Update) a task
app.put("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle tags update separately
    if (updates.tags && typeof updates.tags === "string") {
      const tagNames = updates.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const tagIds = await Promise.all(
        tagNames.map(async (tagName) => {
          let tag = await Tags.findOne({ name: tagName });
          if (!tag) {
            tag = new Tags({ name: tagName });
            await tag.save();
          }
          return tag._id;
        })
      );
      updates.tags = tagIds;
    }

    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("project team owners tags");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
});

// DELETE a task
app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: error.message });
  }
});

// --- USE DEDICATED ROUTE FILES ---
app.use("/projects", projectRoutes);
app.use("/teams", teamRoutes);
//app.use("/tags", tagRoutes);
app.use("/reports", reportRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
