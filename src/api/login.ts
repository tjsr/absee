import { EmailAddress, IPAddress, SnowflakeType } from '../types.js';
import express, { NextFunction } from 'express';

import { ABSeeRequest } from '../session.js';
import { PoolConnection } from '@tjsr/mysql-pool-utils';
import { basicMySqlInsert } from '../database/basicMysqlInsert.js';
import { getSnowflake } from '../snowflake.js';

export const saveUserOnlogin = async (
  _req: ABSeeRequest,
  _res: express.Response,
  next: NextFunction) => {
  return next();
  //   return saveUserOnLogin(req, res, next);
  // try {

  //   const email: string = req.body.email;
  //   if (!validateEmailString(email)) {
  //     res.status(400);
  //     return;
  //   }

  //   const user: UserModel = await getDbUserByEmail(email);

  //   if (!user) {
  //     const result: AuthenticationRestResult = {
  //       email: undefined,
  //       isLoggedIn: false,
  //       message: 'Invalid email',
  //     };
  //     delete req.session.userId;
  //     delete req.session.email;
  //     req.session.save((err) => {
  //       if (err) {
  //         console.error(`Failed saving session`, err);
  //       }
  //     });

  //     res.statusCode = 403;
  //     console.error(`User tried to log in with invalid email ${email}`);
  //     return res.send(result);
  //   }

  //   const result: AuthenticationRestResult = {
  //     email: email,
  //     isLoggedIn: true,
  //     sessionId: req.session.id,
  //   };

  //   res.setHeader('Content-Type', 'application/json');
  //   res.setHeader('x-session-id', req.session.id);
  //   res.cookie('sessionId', req.session.id);

  //   req.session.userId = user.userId;
  //   req.session.email = email;
  //   console.log(`User ${email} logged in and has userId ${user.userId}`);
  //   req.session.save((err) => {
  //     if (err) {
  //       console.error(`Failed saving session`, err);
  //     }
  //   });

  //   await saveUserLogin(user.userId, email, req.session.id, getIp(req));

  //   console.log(`Logged in user ${email} and sent HTTP 200 status with result body.`);
  //   res.status(200);
  //   res.send(result);
  // } catch (e) {
  //   console.warn(`Failed logging in user and sent HTTP 500 status with empty body`);
  //   res.status(500);
  //   console.log(e);
  //   res.send();
  //   next(e);
  // } finally {
  //   res.end();
  //   return;
  // }
};

export const saveUserLogin =
  async (
    conn: Promise<PoolConnection>,
    userId: string,
    email: EmailAddress,
    sessionId: string,
    loginIp: IPAddress = ''
  ): Promise<void> => {
    const idSnowflake: SnowflakeType = getSnowflake();
    return basicMySqlInsert(conn, 'UserLogins',
      ['id', 'userId', 'email', 'sessionId', 'loginTime', 'loginIp'],
      [idSnowflake, userId, email, sessionId, new Date(), loginIp]);
  };

