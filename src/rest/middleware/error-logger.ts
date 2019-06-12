import { NextFunction, Request, Response } from 'express';

export function logErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack); // todo implement proper logger and vError and related stuff
  next(err);
}
