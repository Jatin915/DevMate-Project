const mongoose = require('mongoose');
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const VideoProgress = require('../models/VideoProgress');
const User = require('../models/User');
const { HttpError } = require('../middleware/errorHandler');

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB'];

async function assertPlaylistOwner(playlistId, userId) {
  const playlist = await Playlist.findOne({ _id: playlistId, userId });
  if (!playlist) throw new HttpError(404, 'Playlist not found');
  return playlist;
}

async function listJourneyVideos(req, res, next) {
  try {
    const { playlistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      next(new HttpError(400, 'Invalid playlist id'));
      return;
    }

    const playlist = await assertPlaylistOwner(playlistId, req.userId);

    const videos = await Video.find({ playlistId }).sort({ order: 1 }).lean();
    const progress = await VideoProgress.find({ userId: req.userId, playlistId }).lean();
    const byVideo = new Map(progress.map((p) => [p.videoId.toString(), p]));

    res.json({
      success: true,
      playlist: {
        id: playlist._id,
        title: playlist.title,
        language: playlist.language || null,
      },
      videos: videos.map((v) => {
        const p = byVideo.get(v._id.toString());
        return {
          id: v._id,
          title: v.title,
          youtubeVideoId: v.youtubeVideoId,
          thumbnail: v.thumbnail,
          order: v.order,
          language: v.language || playlist.language || null,
          unlocked: !!p?.unlocked,
          completed: !!p?.completed,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}

async function mergePlaylistVideosForUser(playlist, language, userId) {
  const videos = await Video.find({ playlistId: playlist._id }).sort({ order: 1 }).lean();
  const progressRows = await VideoProgress.find({ userId, playlistId: playlist._id }).lean();
  const byVideo = new Map(progressRows.map((p) => [p.videoId.toString(), p]));
  return videos.map((v) => {
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
  });
}

async function completeVideo(req, res, next) {
  try {
    const { videoId, userId: bodyUserId } = req.body;
    if (bodyUserId && String(bodyUserId) !== String(req.userId)) {
      next(new HttpError(403, 'userId does not match authenticated user'));
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      next(new HttpError(400, 'Invalid videoId'));
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      next(new HttpError(404, 'Video not found'));
      return;
    }

    const playlist = await assertPlaylistOwner(video.playlistId, req.userId);
    const language = playlist.language || video.language || null;
    if (!language) {
      next(new HttpError(400, 'Playlist language not set'));
      return;
    }

    // Mark complete for this user (no requirements per product decision)
    const row = await VideoProgress.findOneAndUpdate(
      { userId: req.userId, videoId: video._id },
      {
        $set: {
          userId: req.userId,
          playlistId: playlist._id,
          videoId: video._id,
          language,
          completed: true,
          unlocked: true,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Unlock next by order
    const nextVideo = await Video.findOne({ playlistId: playlist._id, order: video.order + 1 });
    let nextUnlockedVideoId = null;
    if (nextVideo) {
      await VideoProgress.findOneAndUpdate(
        { userId: req.userId, videoId: nextVideo._id },
        {
          $set: {
            userId: req.userId,
            playlistId: playlist._id,
            videoId: nextVideo._id,
            language,
            unlocked: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      nextUnlockedVideoId = nextVideo._id;
    }

    // Check language completion (all videos completed)
    const total = await Video.countDocuments({ playlistId: playlist._id });
    const completedCount = await VideoProgress.countDocuments({
      userId: req.userId,
      playlistId: playlist._id,
      completed: true,
    });
    const languageCompleted = total > 0 && completedCount >= total;

    let nextLanguage = null;
    if (languageCompleted) {
      const user = await User.findById(req.userId);
      if (user) {
        const completed = Array.isArray(user.completedLanguages) ? user.completedLanguages : [];
        if (!completed.includes(language)) completed.push(language);
        user.completedLanguages = completed;

        const idx = LANGUAGE_ORDER.indexOf(language);
        nextLanguage = idx >= 0 && idx < LANGUAGE_ORDER.length - 1 ? LANGUAGE_ORDER[idx + 1] : null;
        user.currentLanguage = nextLanguage;
        user.upcomingLanguages = nextLanguage
          ? LANGUAGE_ORDER.slice(idx + 2)
          : [];
        await user.save();
      }
    }

    const updatedVideos = await mergePlaylistVideosForUser(playlist, language, req.userId);

    res.json({
      success: true,
      videos: updatedVideos,
      playlistId: playlist._id,
      language,
      completedVideoId: row.videoId,
      nextUnlockedVideoId,
      languageCompleted,
      nextLanguage,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { listJourneyVideos, completeVideo };

