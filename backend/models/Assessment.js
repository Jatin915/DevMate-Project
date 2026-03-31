const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    language: { type: String, required: true, index: true },
    taskTitle: { type: String, required: true },
    description: { type: String, required: true },
    starterCode: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'intermediate', 'hard'], default: 'intermediate' },
  },
  { timestamps: true },
);

assessmentSchema.index({ language: 1, taskTitle: 1 }, { unique: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
