import { IdNamespace, UserSessionMiddlewareRequestHandler, getUserIdFromSession } from '@tjsr/user-session-middleware';

import { HttpStatusCode } from '@tjsr/user-session-middleware';
import { NextFunction } from 'express';
import { UserId } from '../types.js';
import { asyncHandlerWrap } from '../utils/asyncHandlerWrap.js';
import { endWithJsonMessage } from '@tjsr/user-session-middleware';
import { getAppUserIdNamespace } from '../../../user-session-middleware/dist/esm/auth/userNamespace.js';

const getUserAsync: UserSessionMiddlewareRequestHandler = async (
  request,
  response,
  next: NextFunction
): Promise<void> => {
  const idNamespace: IdNamespace = getAppUserIdNamespace(request.app);
  const userId: UserId | undefined = await getUserIdFromSession(idNamespace, request.session);
  console.debug(getUserAsync, 'Getting user data for userId:', userId);
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
