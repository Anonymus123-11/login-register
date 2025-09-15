const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
{
username: {
type: String,
trim: true,
},
email: {
type: String,
required: true,
unique: true,
trim: true,
lowercase: true,
},
password: {
type: String,
required: true,
select: false,
},
// Email verification
isVerified: {
type: Boolean,
default: false,
},
emailOTPHash: { type: String, select: false },
emailOTPExpiresAt: { type: Date, select: false },

// Forgot/reset password
resetOTPHash: { type: String, select: false },
resetOTPExpiresAt: { type: Date, select: false },

// Optional session management
refreshToken: { type: String, select: false },
},
{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);