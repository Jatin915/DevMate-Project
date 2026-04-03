const express = require('express');
const { getRoadmap, updateRoadmap, roadmapUpdateValidators, resetRoadmap } = require('../controllers/roadmapController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/',        asyncHandler(getRoadmap));
router.post('/update', roadmapUpdateValidators(), validate, asyncHandler(updateRoadmap));
router.post('/reset',  asyncHandler(resetRoadmap));

module.exports = router;
