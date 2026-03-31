const { body } = require('express-validator');
const ChatMessage = require('../models/ChatMessage');

function chatValidators() {
  return [body('message').trim().notEmpty().isLength({ max: 8000 }).withMessage('message is required')];
}

function buildPlaceholderResponse(message) {
  const preview = message.slice(0, 280);
  return (
    'DevMate assistant (demo): connect OPENAI_API_KEY or another provider to enable full AI answers. '
    + `You asked about: "${preview}${message.length > 280 ? '…' : ''}" — `
    + 'try breaking problems into smaller steps, write pseudocode first, then implement and test edge cases.'
  );
}

async function postMessage(req, res, next) {
  try {
    const { message } = req.body;
    const response = buildPlaceholderResponse(message);
    const doc = await ChatMessage.create({
      userId: req.userId,
      message,
      response,
    });
    res.status(201).json({ success: true, chat: doc });
  } catch (e) {
    next(e);
  }
}

async function getHistory(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const items = await ChatMessage.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, history: items.reverse() });
  } catch (e) {
    next(e);
  }
}

module.exports = { postMessage, getHistory, chatValidators };
