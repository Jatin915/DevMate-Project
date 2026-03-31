const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', required: true, index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    language: { type: String, required: true, trim: true, index: true },
    unlocked: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

videoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });
videoProgressSchema.index({ userId: 1, playlistId: 1, language: 1 });

module.exports = mongoose.model('VideoProgress', videoProgressSchema);

