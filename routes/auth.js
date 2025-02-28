const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google authentication callback
router.post('/google-auth', async (req, res) => {
  try {
    const { email, googleId, name, profilePicture, role } = req.body;

    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = new User({
        email,
        googleId,
        name,
        profilePicture,
        role
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ googleId: user.googleId }, 'your_jwt_secret');
    
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 