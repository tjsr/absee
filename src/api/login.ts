import { IPAddress, SnowflakeType } from '../types';

import { ABSeeRequest } from '../session';
import { AuthenticationRestResult } from '../types/apicalls';
import { UserModel } from '../types/model';
import { basicMySqlInsert } from '../database/basicMysqlInsert';
import express from 'express';
import { getDbUserByEmail } from '../database/mysql';
import { getIp } from '../server';
import { getSnowflake } from '../snowflake';
import { validateEmailString } from '../utils';

export const login = async (req: ABSeeRequest, res: express.Response) => {
  try {
    const email: string = req.body.email;
    if (!validateEmailString(email)) {
      res.status(400);
      return;
    }

    const user: UserModel = await getDbUserByEmail(email);

    if (!user) {
      const result: AuthenticationRestResult = {
        email: undefined,
        isLoggedIn: false,
        message: 'Invalid email',
      };
      req.session.userId = undefined;
      req.session.email = undefined;
      req.session.save((err) => {
        if (err) {
          console.error(`Failed saving session`, err);
        }
      });

      res.statusCode = 403;
      console.error(`User tried to log in with invalid email ${email}`);
      return res.send({ message: 'Invalid email' });
    }

    const result: AuthenticationRestResult = {
      email: email,
      isLoggedIn: true,
      sessionId: req.session.id,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('x-session-id', req.session.id);
    res.cookie('sessionId', req.session.id);

    req.session.userId = user.userId;
    req.session.email = email;
    console.log(`User ${email} logged in and has userId ${user.userId}`);
    req.session.save((err) => {
      if (err) {
        console.error(`Failed saving session`, err);
      }
    });

    await saveUserLogin(user.userId, email, req.session.id, getIp(req));

    console.log(`Logged in user ${email} and sent HTTP 200 status with result body.`);
    res.status(200);
    res.send(result);
  } catch (e) {
    console.warn(`Failed logging in user and sent HTTP 500 status with empty body`);
    res.status(500);
    console.log(e);
    res.send();
  } finally {
    res.end();
  }
};
export const saveUserLogin =
  async (userId: string, email: string, sessionId: string, loginIp: IPAddress): Promise<void> => {
    const idSnowflake: SnowflakeType = getSnowflake();
    return basicMySqlInsert('UserLogins',
      ['id', 'userId', 'email', 'sessionId', 'loginTime', 'loginIp'],
      [idSnowflake, userId, email, sessionId, new Date(), loginIp]);
  };

