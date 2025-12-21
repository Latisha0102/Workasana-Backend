// routes/team.route.js (Fixed/Updated)
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const Teams = require("../models/team.model");
const NewUser = require("../models/user.model"); // Need to import User model

const router = express.Router();

// GET all teams
router.get("/", authenticateToken, async (req, res) => {
  try {
    const teams = await Teams.find()
      .populate("members", "name email")
      .sort({ name: 1 });
    res.status(200).json({ teams });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: error.message });
  }
});

// GET a single team (for teamDetail.jsx)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Teams.findById(id).populate("members", "name email");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(200).json({ team });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching team", error: error.message });
  }
});

// POST a new team (Updated to handle initial members)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, members = [] } = req.body; // Expect members array

    // Simple validation for name
    if (!name) {
      return res.status(400).json({ message: "Team name is required." });
    }

    const newTeam = new Teams({ name, description, members });
    await newTeam.save();

    const populatedTeam = await Teams.findById(newTeam._id).populate(
      "members",
      "name email"
    );

    res
      .status(201)
      .json({ message: "Team created successfully", team: populatedTeam });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Team name already exists." });
    }
    res
      .status(500)
      .json({ message: "Error creating team", error: error.message });
  }
});

// PUT (Update) a team (General update)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent members array from being fully overwritten by this general update route.
    delete updates.members;

    const team = await Teams.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("members", "name email");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(200).json({ message: "Team updated successfully", team });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating team", error: error.message });
  }
});

// NEW ROUTE: POST /teams/:id/members - Add members to a team
router.post("/:id/members", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newMembers } = req.body; // Expect an array of user IDs

    if (!newMembers || newMembers.length === 0) {
      return res.status(400).json({ message: "No members provided to add." });
    }

    const team = await Teams.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Add only new members (filter out duplicates)
    // Map existing members to string to ensure correct comparison
    const existingMemberIds = team.members.map((m) => m.toString());
    const membersToAdd = newMembers.filter(
      (memberId) => !existingMemberIds.includes(memberId)
    );

    if (membersToAdd.length === 0) {
      // Fetch and return team even if no new members were added
      const populatedTeam = await Teams.findById(id).populate(
        "members",
        "name email"
      );
      return res
        .status(200)
        .json({
          message: "All members already in the team.",
          team: populatedTeam,
        });
    }

    team.members.push(...membersToAdd);
    await team.save();

    const populatedTeam = await Teams.findById(id).populate(
      "members",
      "name email"
    );

    res
      .status(200)
      .json({ message: "Members added successfully", team: populatedTeam });
  } catch (error) {
    console.error("Error adding members to team:", error);
    res
      .status(500)
      .json({ message: "Error adding members to team", error: error.message });
  }
});

// DELETE a team
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Teams.findByIdAndDelete(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting team", error: error.message });
  }
});

module.exports = router;
