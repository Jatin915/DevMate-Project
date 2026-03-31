const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    starterCode: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    hints: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ videoId: 1, order: 1 });

module.exports = mongoose.model('Task', taskSchema);
