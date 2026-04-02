const mongoose = require('mongoose');

const codeSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    code: { type: String, required: true },
    isDraft: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
    executionResult: {
      output:        String,
      error:         String,
      score:         { type: Number, min: 0, max: 100 },
      optimizedCode: { type: String, default: null },
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

codeSubmissionSchema.index({ userId: 1, submittedAt: -1 });

module.exports = mongoose.model('CodeSubmission', codeSubmissionSchema);
