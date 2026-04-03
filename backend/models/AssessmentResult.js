const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language:      { type: String, required: true, index: true },
    submittedCode: { type: String, required: true },
    score:         { type: Number, min: 0, max: 100, required: true },
    passed:        { type: Boolean, default: false },
    feedback:      { type: String, default: '' },
    errors:        [{ type: String }],
    suggestions:   [{ type: String }],
  },
  { timestamps: true },
);

assessmentResultSchema.index({ userId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);
