const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { authenticateToken } = require("./middleware/auth");
const reportRoutes = require("./routes/report");
const NewUser = require("./models/user.model");
const Task = require("./models/task.model");
const Teams = require("./models/team.model");
const Projects = require("./models/project.model");
const Tags = require("./models/tag.model");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log(error);
  });

app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await NewUser.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists. Please login" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new NewUser({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "4h" });
    res.status(201).json({ message: "User registered", token, email });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await NewUser.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    res
      .status(200)
      .json({ message: "Login Successfully", token, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error while login", error: error });
  }
});

app.get("/auth/login", authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user details" });
  }
});

app.post("/teams", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  try {
    const newTeam = new Teams({ name, description });
    await newTeam.save();
    res
      .status(201)
      .json({ message: "Team created successfully", team: newTeam });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating team", error: error.message });
  }
});

app.get("/teams", authenticateToken, async (req, res) => {
  try {
    const teams = await Teams.find();
    res.status(200).json({ teams });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: error.message });
  }
});

app.post("/projects", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newProject = new Projects({ name, description });
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
  }
});

app.get("/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await Projects.find();
    res.status(200).json({ projects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

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

app.post("/tasks", authenticateToken, async (req, res) => {
  const { name, project, team, owners, tags, timeToComplete, status } =
    req.body;
  try {
    const task = new Task({
      name,
      project,
      team,
      owners,
      tags,
      timeToComplete,
      status,
    });
    await task.save();
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
});

app.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const { team, owner, tags, project, status } = req.query;
    let filter = {};
    if (team) filter.team = team;
    if (owner) filter.owners = owner;
    if (tags) filter.tags = { $in: tags.split(",") };
    if (project) filter.project = project;
    if (status) filter.status = status;

    const tasks = await Task.find(filter).populate("project team owners tags");
    res.status(200).json({ tasks });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
});

app.put("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
});

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

// Use report routes
app.use("/report", reportRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log("Server is running on ", PORT));
