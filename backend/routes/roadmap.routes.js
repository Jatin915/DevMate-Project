const express = require('express');
const { getRoadmap, updateRoadmap, roadmapUpdateValidators } = require('../controllers/roadmapController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getRoadmap));
router.post('/update', roadmapUpdateValidators(), validate, asyncHandler(updateRoadmap));

module.exports = router;
