const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  resetOtp: {
    type: String,
  },
  resetOtpExpiry: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyOtp: {
    type: String,
  },
  verifyOtpExpiry: {
    type: Date,
  },
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  }, 
  avatar: { 
    type: String, 
    default: "" 
  },
});

module.exports = mongoose.model("User", userSchema);
