const express = require('express');
const { body } = require('express-validator');
const {
  addPlaylist,
  addLanguagePlaylist,
  loadLanguagePlaylist,
  listUserPlaylists,
  getPlaylistById,
  deletePlaylist,
  changeLanguagePlaylist,
  playlistValidators,
  languagePlaylistValidators,
} = require('../controllers/playlistController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.post('/add',                    playlistValidators(), validate, asyncHandler(addPlaylist));
router.post('/add-language-playlist',  languagePlaylistValidators(), validate, asyncHandler(addLanguagePlaylist));
router.post('/load',                   languagePlaylistValidators(), validate, asyncHandler(loadLanguagePlaylist));
router.put(
  '/change',
  [
    body('language').trim().notEmpty().withMessage('language is required'),
    body('playlistUrl').trim().notEmpty().withMessage('playlistUrl is required'),
  ],
  validate,
  asyncHandler(changeLanguagePlaylist),
);
router.get('/user',   asyncHandler(listUserPlaylists));
router.get('/:id',    asyncHandler(getPlaylistById));
router.delete('/:id', asyncHandler(deletePlaylist));

module.exports = router;
