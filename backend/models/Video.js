const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', required: true, index: true },
    language: { type: String, trim: true, default: null, index: true },
    title: { type: String, required: true, trim: true },
    youtubeVideoId: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '' },
    order: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

videoSchema.index({ playlistId: 1, order: 1 });

module.exports = mongoose.model('Video', videoSchema);
