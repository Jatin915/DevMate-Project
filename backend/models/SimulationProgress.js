const mongoose = require('mongoose');

const simulationProgressSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',            required: true, index: true },
    issueId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationIssue', required: true, index: true },
    status:       { type: String, enum: ['pending', 'submitted', 'completed'], default: 'pending' },
    solutionCode: { type: String, default: '' },
    aiScore:      { type: Number, min: 0, max: 100, default: null },
    feedback:     { type: String, default: '' },
    submittedAt:  { type: Date, default: null },
  },
  { timestamps: true },
);

// One submission record per user per issue
simulationProgressSchema.index({ userId: 1, issueId: 1 }, { unique: true });

module.exports = mongoose.model('SimulationProgress', simulationProgressSchema);
