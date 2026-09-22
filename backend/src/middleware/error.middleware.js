import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, _res, next) => next(ApiError.notFound(`Route ${req.method} ${req.path} not found.`));

const uploadMessages = {
  LIMIT_FILE_SIZE: 'That file is too large.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
  LIMIT_FILE_COUNT: 'Too many files were uploaded.',
};

export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let details = err.details;

  if (err instanceof ZodError) {
    status = 422;
    message = 'Please fix the highlighted fields.';
    details = Object.fromEntries(err.issues.map((i) => [i.path.join('.') || '_', i.message]));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Please fix the highlighted fields.';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404;
    message = 'That item could not be found.';
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    message = `That ${field} is already in use.`;
  } else if (err?.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
    message = uploadMessages[err.code] || 'The upload could not be processed.';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'The request is too large.';
  }

  if (status >= 500) {
    if (env.NODE_ENV !== 'test') console.error(`[${req.method} ${req.originalUrl}]`, err.message);
    // Only unexpected crashes are masked. Deliberate ApiErrors (e.g. "media storage is not configured") are safe and useful to show.
    if (!err.isApiError) {
      message = 'Something went wrong on our side. Please try again.';
      details = undefined;
    }
  }
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
