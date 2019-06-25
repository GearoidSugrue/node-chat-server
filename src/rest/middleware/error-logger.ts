import { NextFunction, Request, Response } from 'express';

export function logErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // todo implement proper logger
  console.warn(err.message);
  next(err);
}
