export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.isApiError = true;
  }
  static badRequest(m, d) { return new ApiError(400, m, d); }
  static unauthorized(m = 'Please sign in to continue.') { return new ApiError(401, m); }
  static forbidden(m = 'You do not have permission to do that.') { return new ApiError(403, m); }
  static notFound(m = 'That item could not be found.') { return new ApiError(404, m); }
  static conflict(m, d) { return new ApiError(409, m, d); }
  static invalid(m, d) { return new ApiError(422, m, d); }
}
