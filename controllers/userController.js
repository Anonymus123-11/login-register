const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const User = require("../models/User");
const { sendOtpEmail } = require("../utils/mailer");
const fs = require("fs");
const path = require("path");
const Joi = require("joi");


// Đăng ký
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res
      .status(400)
      .json({ message: "Please provide username, email and password" });

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(409).json({ message: "Username or email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      otpCode,
      otpExpiresAt,
    });
    await newUser.save();

    await sendOtpEmail(email, otpCode);

    res
      .status(201)
      .json({ message: "User registered. Please verify OTP sent to email." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Xác thực OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });
    if (user.isVerified)
      return res.status(200).json({ message: "Already verified" });
    if (!user.otpCode || !user.otpExpiresAt)
      return res.status(400).json({ message: "No OTP to verify" });
    if (user.otpCode !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > user.otpExpiresAt)
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ message: "Verification successful" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Gửi lại OTP
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail(email, otpCode);
    res.json({ message: "OTP resent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Please provide username and password" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.role !== "admin" && !user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { user: { id: user.id, role: user.role } },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { user: { id: user.id, role: user.role } },
      process.env.JWT_REFRESH_SECRET || "refreshsecretkey",
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Login successful",
      user: { username: user.username, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Quên mật khẩu (forgot password)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email does not exist." });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    user.otp = otp;
    user.otpExpires = Date.now() + 300000; // 5 phút
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.status(200).json({ message: "OTP has been sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Error sending OTP email." });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid OTP or OTP has expired." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Error resetting password." });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refreshsecretkey",
      (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid refresh token" });

        const newAccessToken = jwt.sign(
          { user: { id: user.id, role: user.role } },
          process.env.JWT_SECRET || "secretkey",
          { expiresIn: "1h" }
        );

        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Forget password 
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email does not exist." });

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    user.otp = otp;
    user.otpExpires = Date.now() + 60000; // 1 phút
    await user.save();

    await sendOtpEmail(user.email, otp);
    res.status(200).json({ message: "OTP has been sent to your email." });
  } catch (err) {
    console.error("Forget Password Error:", err);
    res.status(500).json({ message: "Error sending OTP email." });
  }
};

// Admin: Lấy tất cả user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, isVerified } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Xoá user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Tạo user trực tiếp (không cần OTP)
exports.adminCreateUser = async (req, res) => {
  try {
    const { username, email, password, role, isVerified } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "username, email, password required" });

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(409).json({ message: "Username or email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: isVerified ?? true, // Admin tạo => mặc định verified
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, username, email, role: newUser.role, isVerified: newUser.isVerified },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Lấy user theo id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// User: Update own profile and avatar
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, password } = req.body;

    const schema = Joi.object({
      username: Joi.string().min(3).max(50).optional(),
      password: Joi.string().min(6).max(128).optional(),
      email: Joi.forbidden(),
      role: Joi.forbidden(),
      isVerified: Joi.forbidden(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    if (req.file) {
      const filename = req.file.filename;
      updateData.avatarUrl = `/uploads/${filename}`;
    }

    // Find current user to handle avatar replacement
    const current = await User.findById(userId);
    if (!current) return res.status(404).json({ message: "User not found" });

    // Delete old avatar file if replacing
    if (req.file && current.avatarUrl) {
      const oldPath = path.join(__dirname, "..", current.avatarUrl.replace(/^\//, ""));
      fs.unlink(oldPath, () => {});
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
