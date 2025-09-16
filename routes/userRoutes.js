const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com', 
        pass: process.env.GMAIL_APP_PASSWORD || 'your-gmail-app-password' 
    }
});
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and management
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing username or password
 *       409:
 *         description: Username already exists
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Please provide username and password" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(409).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user and get access + refresh token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Please provide username and password" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { user: { id: user.id } }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid refresh token" });

      const newAccessToken = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/users/forget-password:
 *   post:
 *     summary: Send a password reset OTP to the user's email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error or failed to send email
 */
router.post('/forget-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        user.otp = otp;
        user.otpExpires = Date.now() + 60000; 

        await user.save();

        const mailOptions = {
            from: process.env.GMAIL_USER || 'your-email@gmail.com',
            to: user.email,
            subject: 'Your Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It will expire in 1 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP has been sent to your email.' });

    } catch (error) {
        console.error('Forget Password Error:', error);
        res.status(500).json({ message: 'Error sending OTP email.' });
    }
});
/**
 * @swagger
 * /api/users/protected:
 *   get:
 *     summary: Access protected route (JWT required)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorized access
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
