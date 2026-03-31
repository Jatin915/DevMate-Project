const mongoose = require('mongoose');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const VideoProgress = require('../models/VideoProgress');
const { HttpError } = require('../middleware/errorHandler');

function normalizeLanguage(lang) {
  const v = (lang || '').trim();
  if (v === 'Node.js') return 'Node';
  if (v === 'Express.js') return 'Express';
  return v;
}

async function listVideosForPlaylist(req, res, next) {
  try {
    const { playlistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      next(new HttpError(400, 'Invalid playlist id'));
      return;
    }
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.userId });
    if (!playlist) {
      next(new HttpError(404, 'Playlist not found'));
      return;
    }
    const videos = await Video.find({ playlistId }).sort({ order: 1 });
    res.json({ success: true, videos });
  } catch (e) {
    next(e);
  }
}

async function listVideosByLanguage(req, res, next) {
  try {
    const language = normalizeLanguage(req.params.language);
    if (!language) {
      next(new HttpError(400, 'Invalid language'));
      return;
    }

    const playlist = await Playlist.findOne({ userId: req.userId, language }).sort({ createdAt: -1 });
    if (!playlist) {
      res.json({ success: true, language, playlistId: null, videos: [] });
      return;
    }

    const videos = await Video.find({ playlistId: playlist._id }).sort({ order: 1 }).lean();
    const progressRows = await VideoProgress.find({ userId: req.userId, playlistId: playlist._id }).lean();
    const byVideo = new Map(progressRows.map((p) => [p.videoId.toString(), p]));

    res.json({
      success: true,
      language,
      playlistId: playlist._id,
      videos: videos.map((v) => {
        const p = byVideo.get(v._id.toString());
        return {
          id: v._id,
          language: v.language || language,
          title: v.title,
          youtubeVideoId: v.youtubeVideoId,
          thumbnail: v.thumbnail,
          order: v.order,
          unlocked: p ? !!p.unlocked : !!v.unlocked,
          completed: p ? !!p.completed : !!v.completed,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { listVideosForPlaylist, listVideosByLanguage };
