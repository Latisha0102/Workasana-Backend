const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// User Schema
const newUserSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name
  email: { type: String, required: true, unique: true }, // Email must be unique
  password: {
    type: String,
    required: true,
  },
});

// Instance method to compare password
newUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("NewUser", newUserSchema);
