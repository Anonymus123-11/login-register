const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");
const userController = require("../controllers/userController");
const upload = require("../middleware/upload");
/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User authentication and management
 *   - name: Admin
 *     description: Admin management for user accounts
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user and send OTP to email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered. OTP sent to email.
 *       400:
 *         description: Missing or invalid fields
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post("/register", userController.register);

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: Verify user registration with OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post("/verify-otp", userController.verifyOtp);

/**
 * @swagger
 * /api/users/resend-otp:
 *   post:
 *     summary: Resend OTP to user's email
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
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: Bad request / User not found
 *       500:
 *         description: Server error
 */
router.post("/resend-otp", userController.resendOtp);

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
 *       403:
 *         description: Email not verified (for non-admin users)
 *       500:
 *         description: Server error
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Send a password reset OTP to the user's email (5 minutes)
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
router.post('/forgot-password', userController.forgotPassword);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid OTP or OTP has expired
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', userController.resetPassword);

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
 *         description: No refresh token provided
 *       403:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh", userController.refreshToken);

/**
 * @swagger
 * /api/users/forget-password:
 *   post:
 *     summary: Send a password reset OTP to the user's email (1 minute) — alternative endpoint
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
router.post('/forget-password', userController.forgetPassword);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile (info + avatar)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put("/profile", authMiddleware, upload.single("avatar"), userController.updateProfile);

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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: (Admin) Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get("/", adminAuth, userController.getAllUsers);

/**
 * @swagger
 * /api/users/admin-create:
 *   post:
 *     summary: (Admin) Create a user directly
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing fields
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post("/admin-create", adminAuth, userController.adminCreateUser);

/**
 * @swagger
 * /api/users/admin/{id}:
 *   get:
 *     summary: (Admin) Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/admin/:id", adminAuth, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: (Admin) Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.delete("/:id", adminAuth, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: (Admin) Update a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.put("/:id", adminAuth, userController.updateUser);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;
