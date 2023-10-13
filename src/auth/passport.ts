import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import express, { NextFunction, Request, Response } from 'express';

import { ABSeeRequest } from '../session';
import { User } from '@prisma/client';
import { getConnectionPool } from '../database/mysqlConnections';
import passport from 'passport';
import { requireEnv } from '../utils';

// Configure Google authentication strategy
const GOOGLE_CLIENT_ID = requireEnv('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = requireEnv('GOOGLE_CLIENT_SECRET');
const SERVER_PREFIX = requireEnv('SERVER_PREFIX');

const getDisplayNameFromProfile = (profile: Profile): string => {
  return profile.displayName || (profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '');
};

const cachedGoogleUsers: Map<string, any> = new Map<string, any>();
const cacheGoogleUser = (user: any): void => {
  const googleId = user.google_id;
  cachedGoogleUsers.set(googleId, user);
};

export const initialisePassportToExpressApp = (app: express.Express) => {
  // Set up passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        callbackURL: SERVER_PREFIX + '/auth/google/callback',
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: object) => void
      ) => {
        console.log(`Getting database connection...`);
        // This function is called when the user is authenticated
        // You can do additional validation or store user data here
        getConnectionPool().getConnection((err, conn) => {
          if (err) {
            console.error(`Failed getting connection to check for existing user.`);
            conn.release();
            return done(err);
          }

          const googleId: string = profile.id;

          conn.query('SELECT * FROM User WHERE google_id = ?', [googleId], (_err, rows) => {
            if (rows.length > 0) {
              console.log(`Found user for googleId=${googleId} in passport.use, caching`);
              cacheGoogleUser(rows[0]);
              // User exists, pass the user object to Passport
              conn.release();
              return done(null, rows[0]);
            } else {
              // User does not exist, create a new user in the database
              const displayName = getDisplayNameFromProfile(profile);
              const newUser = {
                display_name: displayName,
                email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
                google_id: googleId,
              };

              conn.query('INSERT INTO User SET ?', newUser, (err) => {
                if (err) {
                  console.error(`User profile was ${JSON.stringify(profile)}`);
                  conn.release();
                  return done(err);
                }

                // User has been created, pass the user object to Passport
                conn.release();
                return done(null, newUser);
              });
            }
          });
        });

        return done(null, profile);
      }
    )
  );
  // Set up passport session serialization and deserialization
  passport.serializeUser((user: any, done: (error: Error | null, id?: string | undefined) => void) => {
    console.log(`Storing user for id ${JSON.stringify(user)}`);
    // console.warn(`Attempting to serialise user ${JSON.stringify(user)}`);
    done(null, user.id);
  });

  passport.deserializeUser((googleId: string, done: (error: Error | null, user?: Profile) => void) => {
    // Look up user by id
    try {
      if (cachedGoogleUsers.has(googleId)) {
        console.log(`Got user id ${googleId} from cache`);
        done(null, cachedGoogleUsers.get(googleId));
      } else {
        let idtype = 'googleId';
        let id:number|string|undefined = undefined;
        if ((typeof googleId === 'number' && googleId < 100000) || googleId?.length < 6) {
          idtype = 'id';
          id = googleId;
        }

        console.log(`Looking up user for ${idtype}=${googleId} from database during deserialize`);
        // const userProfile: any = { displayName: 'Alice', id: id }; // Replace with actual user data lookup
        getConnectionPool().getConnection((err, conn) => {
          if (err) {
            console.error(`Failed getting connection to check for existing user.`);
            return done(err);
          }

          const processResult = (field: string, id: string|number, _err: any, rows: User[]): void => {
            if (rows.length > 0) {
              // User exists, pass the user object to Passport
              console.log(`Found user for ${field}=${id} when deserializing`);
              cacheGoogleUser(rows[0]);
              const profile: Profile|any = { ...rows[0] };
              conn.release();
              return done(null, profile);
            } else {
              const errMessage = `Failed to find user for ${field}=${id}`;
              console.log(errMessage);
              conn.release();
              done(new Error(errMessage), undefined);
            }
          };
          if (idtype === 'id') {
            // id a userId in the User table is not a google id.
            conn.query('SELECT id, email, display_name, google_id FROM User WHERE id = ?',
              [id!], (_err, rows) => processResult('id', id!, _err, rows));
          } else {
            conn.query('SELECT id, email, display_name, google_id FROM User WHERE google_id = ?',
              [googleId], (_err, rows) => processResult('googleId', googleId, _err, rows));
          }
          // done(null, userProfile);
        });
      }
    } catch (err: any) {
      done(err);
    }
  });

  // Set up route for "Log in using Google" button
  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Set up callback route for Google authentication
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req: ABSeeRequest, res: Response, _next ): void => {
      // User has been authenticated, store user data in session
      // (req as any).session.passport.user;
      (req as any).session.userId = (req as any).user?.id;
      (req as any).session.username = (req as any).user.displayName;
      (req as any).session.accessToken = (req as any).user?.accessToken;
      console.log('User info in /auth/google/callback:' + JSON.stringify(req.user));

      return res.redirect(SERVER_PREFIX + '/');
      // next();
    }
  );

  app.get('/oauth2/redirect/google',
    passport.authenticate('google', {
      failureMessage: true,
      failureRedirect: '/loginFailed',
      scope: 'https://www.googleapis.com/auth/userinfo.email' }),
    function(_req, res) {
      res.redirect(SERVER_PREFIX + '/');
    });

  app.post('/',
    passport.authenticate('google', {
      failureMessage: true,
      failureRedirect: '/loginFailed',
      scope: 'https://www.googleapis.com/auth/userinfo.email' }),
    (req: ABSeeRequest, response: Response) => {
      const reqData = JSON.stringify({
        body: req.body,
        cookies: req.cookies,
        headers: req.headers,
        hostname: req.hostname,
        httpVersion: req.httpVersion,
        ip: req.ip,
        method: req.method,
        originalUrl: req.originalUrl,
        params: req.params,
        path: req.path,
        protocol: req.protocol,
        query: req.query,
        url: req.url,
      });
      console.info(reqData);
      response.redirect(SERVER_PREFIX + '/');
    });

  app.use((err: any,
    req: ABSeeRequest,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction):void => {
    console.error(err.stack); // Log the error for debugging
    (req as any).session = undefined;

    res.status(500).send('Something went wrong'); // Respond with an appropriate error message
    next();
    // res.end();
    // res.redirect('/');
  });
};
