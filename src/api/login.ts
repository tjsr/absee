import { IPAddress, SnowflakeType } from '../types.js';

import { ABSeeRequest } from '../session.js';
import { AuthenticationRestResult } from '../types/apicalls.js';
import { UserModel } from '../types/model.js';
import { basicMySqlInsert } from '@tjsr/mysql-pool-utils';
import express from 'express';
import { getDbUserByEmail } from '../database/mysql.js';
import { getIp } from '../server.js';
import { getSnowflake } from '../snowflake.js';
import { validateEmailString } from '../utils.js';

export const login = async (req: ABSeeRequest, res: express.Response) => {
  try {
    const email: string = req.body.email;
    if (!validateEmailString(email)) {
      res.status(400);
      return;
    }

    const user: UserModel = await getDbUserByEmail(email);

    if (!user) {
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
  async (userId: string, email: string, sessionId: string, loginIp: IPAddress = ''): Promise<void> => {
    const idSnowflake: SnowflakeType = getSnowflake();
    return basicMySqlInsert('UserLogins',
      ['id', 'userId', 'email', 'sessionId', 'loginTime', 'loginIp'],
      [idSnowflake, userId, email, sessionId, new Date(), loginIp]);
  };

