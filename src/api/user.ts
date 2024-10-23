import { UserSessionMiddlewareRequestHandler, getUserIdFromSession } from '@tjsr/user-session-middleware';

import { HttpStatusCode } from '@tjsr/user-session-middleware';
import { NextFunction } from 'express';
import { UserId } from '../types.js';
import { asyncHandlerWrap } from '../utils/asyncHandlerWrap.js';
import { endWithJsonMessage } from '@tjsr/user-session-middleware';

const getUserAsync: UserSessionMiddlewareRequestHandler = async (
  request,
  response,
  next: NextFunction
): Promise<void> => {
  const userId: UserId | undefined = await getUserIdFromSession(request.session);
  if (userId === undefined) {
    return endWithJsonMessage(response, HttpStatusCode.UNAUTHORIZED, 'Invalid user', next);
  }

  response.status(HttpStatusCode.OK);
  response.send({
    userId: userId,
  });
  next();
};

export const getUser: UserSessionMiddlewareRequestHandler = asyncHandlerWrap(getUserAsync);
