const mongoose = require('mongoose');

const simulationIssueSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    tags:        [{ type: String, trim: true }],
    difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    language:    { type: String, trim: true, default: '' },
    codeSnippet: { type: String, default: '' },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SimulationIssue', simulationIssueSchema);
