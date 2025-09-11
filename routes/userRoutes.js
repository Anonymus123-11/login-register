  const express = require("express");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const User = require("../models/User");
  const authMiddleware = require("../middleware/authMiddleware");

  const router = express.Router();

  // Register API
  router.post("/register", async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
          return res.status(400).json({ message: "Please provide username and password" });
      }

      try {
          const existingUser = await User.findOne({ username });
          if (existingUser) {
              return res.status(409).json({ message: "Username already exists" });
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          const newUser = new User({ username, password: hashedPassword });
          await newUser.save();

          return res.status(201).json({ message: "User registered successfully" });
      } catch (err) {
          console.error(err.message);
          return res.status(500).json({ message: "Server error" });
      }
  });

  // Khang: Login API
  router.post("/login", async (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
          return res.status(400).json({ message: "Please provide username and password" });
      }

      try {
          const user = await User.findOne({ username });
          if (!user) {
              return res.status(400).json({ message: "Invalid credentials" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(400).json({ message: "Invalid credentials" });
          }

          const payload = {
              user: {
                  id: user.id,
              },
          };

          const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
              expiresIn: "1h",
          });

          res.json({ token });
      } catch (err) {
          console.error(err.message);
          res.status(500).json({ message: "Server error" });
      }
  });

  // Khang: Protected API Demo
  router.get("/protected", authMiddleware, (req, res) => {
      res.json({ message: "This is a protected route", user: req.user });
  });

  module.exports = router;
