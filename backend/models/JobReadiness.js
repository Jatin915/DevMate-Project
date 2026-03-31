const mongoose = require('mongoose');

const jobReadinessSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    codingScore: { type: Number, default: 0 },
    debuggingScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    conceptAccuracy: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

module.exports = mongoose.model('JobReadiness', jobReadinessSchema);
