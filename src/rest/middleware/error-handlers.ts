import { NextFunction, Request, Response } from 'express';
import { VError } from 'verror';

type ErrorResponse = {
  type: string;
  message: string;
};

enum ErrorNames {
  AssertionError = 'AssertionError [ERR_ASSERTION]',
  Unauthorized = 'Unauthorized'
}

/**
 * This error RequestHandler checks for an Assertion Error.
 * Responds with BadRequest (400) if it is.
 * Otherwise, it passes the error onto the next error handler
 *
 * @params (RequestHandler) params
 */
export function assertionErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next?: NextFunction
): Response {
  const assertionError = VError.findCauseByName(err, ErrorNames.AssertionError);

  if (assertionError) {
    const errorResponse: ErrorResponse = {
      type: 'AssertionError',
      message: assertionError.message
    };
    return res.status(400).json(errorResponse);
  }
  next(err);
}

// todo: add database error handler.
// This error handler will log but won't return much info to the user.
// Perhaps: http code: 503 (Service Unavailable), message: "Database Error"

/**
 * This error RequestHandler checks for an Unauthorized Error.
 * Responds with BadRequest (401) if it is.
 * Otherwise, it passes the error onto the next error handler
 *
 * @params (RequestHandler) params
 */
export function unauthorizedErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next?: NextFunction
): Response {
  const unauthorizedError = VError.findCauseByName(
    err,
    ErrorNames.Unauthorized
  );

  if (unauthorizedError) {
    const errorResponse: ErrorResponse = {
      type: ErrorNames.Unauthorized,
      message: unauthorizedError.message
    };
    return res.status(401).json(errorResponse);
  }
  next(err);
}

/**
 * This error handler is intended to be the fallback error handler.
 * It logs the full stack trace for the error.
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
  console.error(VError.fullStack(err));

  const errorResponse: ErrorResponse = {
    type: 'Internal Server Error',
    message: 'Uh oh spaghettios! Something went wrong!'
  };
  res.status(500).send(errorResponse);
}
