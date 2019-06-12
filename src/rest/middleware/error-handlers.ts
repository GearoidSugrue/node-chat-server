import { AssertionError } from 'assert';
import { NextFunction, Request, Response } from 'express';

type ErrorResponse = {
  type: string;
  message: string;
};

/**
 * This error RequestHandler checks for an Assertion Error.
 * Responds with BadRequest (400) if it is one.
 * Otherwise it passes the error onto the next error handler
 *
 * @params (RequestHandler) params
 */
export function assertionErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next?: NextFunction
): Response {
  if (error instanceof AssertionError) {
    const errorResponse: ErrorResponse = {
      type: 'AssertionError',
      message: error.message
    };
    return res.status(400).json(errorResponse);
  }
  next(error);
}

/**
 * This error handler is intended to be the fallback error handler.
 * Order matters! It should be passed to app.use last so all of
 * the other error handlers get a chance to deal with the error.
 *
 * @params (RequestHandler) params
 */
export function defaultErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorResponse: ErrorResponse = {
    type: 'Internal Server Error',
    message: 'Uh oh spaghettios! Something went wrong!'
  };
  res.status(500).send(errorResponse);
}
