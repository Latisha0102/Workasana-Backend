const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const Task = require("../models/task.model");

const router = express.Router();

router.get("/last-week", authenticateToken, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const tasks = await Task.find({
      status: "Completed",
      updatedAt: { $gte: oneWeekAgo },
    }).populate("project team owners tags");

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching last week's tasks",
      error: error.message,
    });
  }
});

router.get("/pending", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $ne: "Completed" } });
    const totalPendingDays = tasks.reduce(
      (sum, task) => sum + task.timeToComplete,
      0
    );

    res.status(200).json({ totalPendingDays });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating pending work",
      error: error.message,
    });
  }
});

router.get("/closed-tasks", authenticateToken, async (req, res) => {
  try {
    const { groupBy } = req.query;

    let groupField;
    switch (groupBy) {
      case "team":
        groupField = "$team";
        break;
      case "owner":
        groupField = "$owners";
        break;
      case "project":
        groupField = "$project";
        break;
      default:
        return res.status(400).json({
          message:
            "Invalid groupBy parameter. Use 'team', 'owner', or 'project'.",
        });
    }

    const report = await Task.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: groupField, count: { $sum: 1 } } },
    ]);

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({
      message: "Error generating closed tasks report",
      error: error.message,
    });
  }
});

module.exports = router;
