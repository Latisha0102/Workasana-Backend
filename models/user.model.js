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

newUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 2. CRITICAL FIX: Add the comparePassword method to the schema methods
newUserSchema.methods.comparePassword = async function (candidatePassword) {
  // candidatePassword is the plain text password from the login form (req.body)
  // this.password is the hashed password stored in the database
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("NewUser", newUserSchema);
