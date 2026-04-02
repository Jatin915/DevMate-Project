const express = require('express');

const authRoutes = require('./auth.routes');
const playlistRoutes = require('./playlist.routes');
const videoRoutes = require('./video.routes');
const taskRoutes = require('./task.routes');
const progressRoutes = require('./progress.routes');
const dashboardRoutes = require('./dashboard.routes');
const jobReadinessRoutes = require('./jobReadiness.routes');
const chatRoutes = require('./chat.routes');
const roadmapRoutes = require('./roadmap.routes');
const codeRoutes = require('./code.routes');
const journeyRoutes = require('./journey.routes');
const userRoutes = require('./user.routes');
const assessmentRoutes = require('./assessment.routes');
const aiRoutes = require('./ai.routes');
const taskGenerationRoutes = require('./taskGeneration.routes');
const miniProjectsRoutes = require('./miniProjects.routes');
const simulationRoutes   = require('./simulation.routes');
const { submitCodeLegacy } = require('../controllers/codeSubmissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/playlists', playlistRoutes);
router.use('/videos', videoRoutes);
router.use('/tasks', taskRoutes);
router.use('/progress', progressRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/job-readiness', jobReadinessRoutes);
router.use('/chat', chatRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/code', codeRoutes);
router.use('/journey', journeyRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);
router.use('/mini-projects', miniProjectsRoutes);
router.use('/simulation',   simulationRoutes);
router.use('/', taskGenerationRoutes);
router.use('/', assessmentRoutes);

/** Legacy demo snippet (CodeBackground): POST { code } — requires Authorization like other APIs */
router.post('/submit', authMiddleware, asyncHandler(submitCodeLegacy));

module.exports = router;
