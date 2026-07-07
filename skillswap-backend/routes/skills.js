const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const protect = require('../middleware/auth');

// Get all skills
router.get('/', async (req, res) => {
  try {
    const { category, type, search, page = 1, limit = 16 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) query.$text = { $search: search };
    const skills = await Skill.find(query)
      .populate('user', 'name university avatar')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Skill.countDocuments(query);
    res.json({ success: true, count: skills.length, total, skills });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add skill
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, description, level, type, tags } = req.body;
    const skill = await Skill.create({
      user: req.user._id,
      title, category, description, level, type, tags
    });
    res.status(201).json({ success: true, skill });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update skill
router.put('/:id', protect, async (req, res) => {
  try {
    let skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, skill });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete skill
router.delete('/:id', protect, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await skill.deleteOne();
    res.json({ success: true, message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;