const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/auth');

// Get all users
router.get('/', protect, async (req, res) => {
  try {
    const { skill, university, page = 1, limit = 12 } = req.query;
    const query = { _id: { $ne: req.user._id } };
    if (skill) {
      query.$or = [
        { skillsOffered: { $regex: skill, $options: 'i' } },
        { skillsWanted: { $regex: skill, $options: 'i' } }
      ];
    }
    if (university) query.university = { $regex: university, $options: 'i' };
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ success: true, count: users.length, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get one user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, university, skillsOffered, skillsWanted, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, university, skillsOffered, skillsWanted, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Smart matches
router.get('/me/matches', protect, async (req, res) => {
  try {
    const me = req.user;
    const matches = await User.find({
      _id: { $ne: me._id },
      skillsOffered: { $in: me.skillsWanted }
    }).select('-password').limit(20);
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;