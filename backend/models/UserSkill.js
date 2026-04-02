const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    knownLanguages: [{ type: String, trim: true }],
    assessmentCompleted: { type: Boolean, default: false },
    passedLanguages: [{ type: String, trim: true }],
    recommendedNextLanguage: { type: String, default: null },
    startMode: { type: String, enum: ['assessment', 'beginner', 'custom'], default: 'assessment' },
    currentLanguage: { type: String, default: null },
    journeyStarted: { type: Boolean, default: false },
    customLanguages: [{ type: String, trim: true }], // ordered list for custom journeys
  },
  { timestamps: true },
);

module.exports = mongoose.model('UserSkill', userSkillSchema);
