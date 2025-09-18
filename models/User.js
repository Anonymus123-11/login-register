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
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    refreshToken: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // OTP for registration verification
    otpCode: {
        type: String,
    },
    otpExpiresAt: {
        type: Date,
    },
    // OTP for password reset flow
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    avatarUrl: {
        type: String,
    }
});

module.exports = mongoose.model("User", userSchema);
