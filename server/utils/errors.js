export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}

export function isHttpError(error) {
  return Boolean(error && typeof error.statusCode === 'number');
}
