import { ABSeeRequest } from '../session.js';
import { AuthenticationRestResult } from '../types/apicalls.js';
import { UserId } from '../types.js';
import express from 'express';
import { getUserId } from '../auth/user.js';

export const logout = async (request: ABSeeRequest, res: express.Response) => {
  const userId: UserId = getUserId(request);
  console.log(`Got logout userId ${userId}`);
  const result: AuthenticationRestResult = {
    email: undefined,
    isLoggedIn: false,
  };
  try {
    request.session.userId = undefined;
    request.session.email = undefined;
    request.session.username = undefined;
    request.session.save((err:any) => {
      if (err) {
        console.error(`Failed saving session`, err);
      }
    });

    res.status(200);
    res.send(result);
  } catch (e) {
    res.status(500);
    console.log(e);
    res.send(result);
  } finally {
    res.end();
  }
};
