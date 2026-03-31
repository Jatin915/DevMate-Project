const mongoose = require('mongoose');
const { body } = require('express-validator');
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const CodeSubmission = require('../models/CodeSubmission');
const VideoProgress = require('../models/VideoProgress');
const User = require('../models/User');
const { extractPlaylistId } = require('../utils/youtubeParser');
const { fetchPlaylistItems } = require('../utils/youtubeService');
const { HttpError } = require('../middleware/errorHandler');

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB'];

function normalizeLanguage(lang) {
  const v = (lang || '').trim();
  if (v === 'Node.js') return 'Node';
  if (v === 'Express.js') return 'Express';
  return v;
}

function playlistValidators() {
  return [
    body('playlistUrl').trim().notEmpty().withMessage('playlistUrl is required'),
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
  ];
}

function languagePlaylistValidators() {
  return [
    body('language').trim().notEmpty().withMessage('language is required'),
    body('playlistUrl').trim().notEmpty().withMessage('playlistUrl is required'),
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
  ];
}

async function createLanguagePlaylistForUser({ userId, language, playlistUrl, title, description }) {
  const normalizedLanguage = normalizeLanguage(language);
  if (!LANGUAGE_ORDER.includes(normalizedLanguage)) {
    throw new HttpError(400, `Unsupported language: ${normalizedLanguage}`);
  }

  const extracted = extractPlaylistId(playlistUrl);
  if (!extracted) {
    throw new HttpError(400, 'Could not parse a YouTube playlist ID from the URL');
  }

  const { items } = await fetchPlaylistItems(extracted);
  const displayTitle =
    title?.trim()
    || (items[0] ? `${normalizedLanguage}: ${items[0].title.split(' - ')[0]}…` : `${normalizedLanguage} Playlist`);

  const playlist = await Playlist.create({
    userId,
    language: normalizedLanguage,
    playlistUrl: playlistUrl.trim(),
    playlistId: extracted,
    title: displayTitle,
    description: description?.trim() || '',
    videos: [],
  });

  const videoDocs = [];
  if (items.length > 0) {
    for (const v of items) {
      const video = await Video.create({
        userId,
        playlistId: playlist._id,
        language: normalizedLanguage,
        title: v.title,
        youtubeVideoId: v.youtubeVideoId,
        thumbnail: v.thumbnail,
        order: v.order,
        duration: v.duration || 0,
        unlocked: v.order === 0,
        completed: false,
      });
      videoDocs.push(video._id);
    }
  }

  playlist.videos = videoDocs;
  await playlist.save();

  // Initialize per-user unlock state: first video unlocked
  const videoRows = await Video.find({ playlistId: playlist._id }).sort({ order: 1 }).select('_id order');
  if (videoRows.length > 0) {
    await VideoProgress.insertMany(
      videoRows.map((v, idx) => ({
        userId,
        playlistId: playlist._id,
        videoId: v._id,
        language: normalizedLanguage,
        unlocked: idx === 0,
        completed: false,
        completedAt: null,
      })),
    );
  }

  // Update user language queue
  const user = await User.findById(userId);
  if (user) {
    const completed = Array.isArray(user.completedLanguages) ? user.completedLanguages : [];
    const upcomingFromOrder = LANGUAGE_ORDER.filter((l) => !completed.includes(l) && l !== normalizedLanguage);
    user.currentLanguage = normalizedLanguage;
    user.upcomingLanguages = upcomingFromOrder;
    await user.save();
  }

  return { playlist, normalizedLanguage, videoRows };
}

async function assertPlaylistOwner(playlistId, userId) {
  const p = await Playlist.findOne({ _id: playlistId, userId });
  if (!p) throw new HttpError(404, 'Playlist not found');
  return p;
}

async function addPlaylist(req, res, next) {
  try {
    const { playlistUrl, title, description } = req.body;
    const extracted = extractPlaylistId(playlistUrl);
    if (!extracted) {
      next(new HttpError(400, 'Could not parse a YouTube playlist ID from the URL'));
      return;
    }

    const { items } = await fetchPlaylistItems(extracted);
    const displayTitle = title?.trim() || (items[0] ? `${items[0].title.split(' - ')[0]}…` : `Playlist ${extracted.slice(0, 8)}…`);
    const playlist = await Playlist.create({
      userId: req.userId,
      playlistUrl: playlistUrl.trim(),
      playlistId: extracted,
      title: displayTitle,
      description: description?.trim() || '',
      videos: [],
    });

    const videoDocs = [];
    if (items.length > 0) {
      for (const v of items) {
        const video = await Video.create({
          playlistId: playlist._id,
          title: v.title,
          youtubeVideoId: v.youtubeVideoId,
          thumbnail: v.thumbnail,
          order: v.order,
          duration: v.duration || 0,
        });
        videoDocs.push(video._id);
      }
    }

    playlist.videos = videoDocs;
    await playlist.save();

    const populated = await Playlist.findById(playlist._id).populate({
      path: 'videos',
      options: { sort: { order: 1 } },
    });

    res.status(201).json({ success: true, playlist: populated });
  } catch (e) {
    next(e);
  }
}

async function addLanguagePlaylist(req, res, next) {
  try {
    const { language, playlistUrl, title, description } = req.body;
    const { playlist, normalizedLanguage, videoRows } = await createLanguagePlaylistForUser({
      userId: req.userId,
      language,
      playlistUrl,
      title,
      description,
    });

    res.status(201).json({
      success: true,
      playlistId: playlist._id,
      language: normalizedLanguage,
      firstUnlockedVideoId: videoRows[0]?._id || null,
    });
  } catch (e) {
    next(e);
  }
}

async function loadLanguagePlaylist(req, res, next) {
  try {
    const { language, playlistUrl, title, description } = req.body;
    const { playlist, normalizedLanguage } = await createLanguagePlaylistForUser({
      userId: req.userId,
      language,
      playlistUrl,
      title,
      description,
    });
    const storedVideos = await Video.find({ playlistId: playlist._id }).sort({ order: 1 });
    res.status(201).json({
      success: true,
      playlistId: playlist._id,
      language: normalizedLanguage,
      videos: storedVideos,
    });
  } catch (e) {
    next(e);
  }
}

async function listUserPlaylists(req, res, next) {
  try {
    const playlists = await Playlist.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate({ path: 'videos', options: { sort: { order: 1 } } });
    res.json({ success: true, playlists });
  } catch (e) {
    next(e);
  }
}

async function getPlaylistById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      next(new HttpError(400, 'Invalid playlist id'));
      return;
    }
    const playlist = await Playlist.findOne({ _id: id, userId: req.userId }).populate({
      path: 'videos',
      options: { sort: { order: 1 } },
    });
    if (!playlist) {
      next(new HttpError(404, 'Playlist not found'));
      return;
    }
    res.json({ success: true, playlist });
  } catch (e) {
    next(e);
  }
}

async function deletePlaylist(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      next(new HttpError(400, 'Invalid playlist id'));
      return;
    }
    await assertPlaylistOwner(id, req.userId);

    const videos = await Video.find({ playlistId: id });
    const videoIds = videos.map((v) => v._id);
    const tasks = await Task.find({ videoId: { $in: videoIds } });
    const taskIds = tasks.map((t) => t._id);

    await Progress.deleteMany({ taskId: { $in: taskIds } });
    await CodeSubmission.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ videoId: { $in: videoIds } });
    await Video.deleteMany({ playlistId: id });
    await Playlist.deleteOne({ _id: id, userId: req.userId });

    res.json({ success: true, message: 'Playlist deleted' });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  addPlaylist,
  addLanguagePlaylist,
  loadLanguagePlaylist,
  listUserPlaylists,
  getPlaylistById,
  deletePlaylist,
  playlistValidators,
  languagePlaylistValidators,
  assertPlaylistOwner,
};
