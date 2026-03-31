const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('./errorHandler');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new HttpError(500, 'JWT_SECRET is not configured'));
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

/** Load full user document (without password) for profile routes */
async function attachUser(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      next(new HttpError(401, 'User not found'));
      return;
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(new HttpError(403, 'Forbidden'));
      return;
    }
    next();
  };
}

module.exports = { authMiddleware, attachUser, requireRole };
