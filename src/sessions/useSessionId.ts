import { ABSeeRequest } from '../session';
import { createRandomUserId } from '../auth/user';
import express from 'express';
import { uuid5 } from '../types';

export const useSessionId = (
  req: ABSeeRequest,
  res: express.Response,
  next: () => void
) => {
  const sessionId = req.header('x-session-id') || req.session.id;
  if (sessionId && sessionId !== 'undefined') {
    if (!req.sessionID) {
      req.sessionID = sessionId;
    }
    // retrieve session from session store using sessionId
    req.sessionStore.get(sessionId, (err, sessionData) => {
      if (!err) {
        req.session.save();
      }
      if (sessionData) {
        req.session = Object.assign(req.session, sessionData);
        if (req.session.userId == undefined) {
          const userId: uuid5 = createRandomUserId();
          console.log(
            `Assigned a new userId ${userId} to session ${sessionId}`
          );
          req.session.userId = userId;
        }
      }
      next();
    });
  } else {
    // if (req.session.userId == undefined) {
    const userId: uuid5 = createRandomUserId();
    console.log(
      `Assigned a new userId ${userId} to session ${req.session.id}`
    );
    req.session.userId = userId;
    // }

    next();
  }
};
