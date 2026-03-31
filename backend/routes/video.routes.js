const express = require('express');
const { body } = require('express-validator');
const { listVideosForPlaylist, listVideosByLanguage } = require('../controllers/videoController');
const { completeVideo } = require('../controllers/journeyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.post(
  '/complete',
  [body('videoId').notEmpty().withMessage('videoId is required')],
  validate,
  asyncHandler(completeVideo),
);
router.get('/playlist/:playlistId', asyncHandler(listVideosForPlaylist));
router.get('/:language', asyncHandler(listVideosByLanguage));

module.exports = router;
