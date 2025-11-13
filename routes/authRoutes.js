const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User(req.body);
    await user.save();
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, profession: user.profession, experienceLevel: user.experienceLevel } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;

