const { validationResult } = require('express-validator');
const { HttpError } = require('./errorHandler');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((e) => e.msg)
      .join('; ');
    next(new HttpError(400, msg));
    return;
  }
  next();
}

module.exports = validate;
