const mongoose = require("mongoose");
// Team Schema
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Team names must be unique
  description: { type: String }, // Optional description for the team
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: "NewUser" }, // NEW: Array of user references
  ],
});
module.exports = mongoose.model("Team", teamSchema);
