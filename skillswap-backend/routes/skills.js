const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');

// GET all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add skill
router.post('/', async (req, res) => {
  try {
    const { name, description, userId } = req.body;
    const skill = new Skill({ name, description, userId });
    await skill.save();
    res.status(201).json({ message: 'Skill added', skill });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;