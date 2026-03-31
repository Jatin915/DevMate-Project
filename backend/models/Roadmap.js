const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, required: true, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    miniProjectsCompleted: { type: Number, default: 0, min: 0 },
    tasksCompleted: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

roadmapSchema.index({ userId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);
