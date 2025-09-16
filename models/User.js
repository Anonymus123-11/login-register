const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    isVerified: { type: Boolean, default: false },

    // OTP cho đăng ký và reset mật khẩu
    otpCode: { type: String },
    otpExpiresAt: { type: Date }
});

module.exports = mongoose.model("User", userSchema);
