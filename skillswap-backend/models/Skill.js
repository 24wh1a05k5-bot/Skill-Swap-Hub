const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Skill title is required'],
    trim: true,
    maxlength: [80, 'Title cannot exceed 80 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Design', 'Music', 'Language', 'Math', 'Science', 'Arts', 'Business', 'Other']
  },
  description: { type: String, maxlength: [500, 'Description cannot exceed 500 characters'] },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  type: {
    type: String,
    enum: ['offer', 'request'],
    required: true
  },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

SkillSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Skill', SkillSchema);