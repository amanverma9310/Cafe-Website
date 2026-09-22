import { ApiError } from '../utils/ApiError.js';
import { cleanStrings, stripOperators } from '../utils/sanitize.js';

/** Validates req.body with a zod schema and replaces it with the parsed (typed, stripped) result. */
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};

export const validateQuery = (schema) => (req, _res, next) => {
  req.validQuery = schema.parse(req.query ?? {});
  next();
};

/** Sanitises body and params. */
export function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = cleanStrings(stripOperators(req.body));
  if (req.params) for (const k of Object.keys(req.params)) req.params[k] = String(req.params[k]).replace(/[^\w-]/g, '');
  next();
}

/** multipart requests send structured data as a JSON string in `payload`. */
export function parsePayload(req, _res, next) {
  if (typeof req.body?.payload === 'string') {
    try {
      req.body = { ...JSON.parse(req.body.payload) };
    } catch {
      throw ApiError.badRequest('The form data could not be read.');
    }
  }
  next();
}
