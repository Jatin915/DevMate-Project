const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, trim: true, default: null },
    playlistUrl: { type: String, required: true },
    playlistId: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

playlistSchema.index({ userId: 1, playlistId: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
