import { NextFunction, Request, RequestHandler, Response } from 'express';

/* Express has an issue where it won't catch async errors.
 * This can be avoided by ensure anything that can throw is wrapped in a try/catch.
 * This sounds ok, but it gets very repetitive when there are many routes.
 *
 * This wrapper catches async errors and passes them to the error handlers.
 */
export const asyncWrapper = (fn: RequestHandler) => (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise.resolve(fn(req, res, next)).catch(next);
