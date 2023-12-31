import { ABSeeRequest, ABSeeSessionData } from '../session';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import express, { NextFunction, Response } from 'express';

import { getConnectionPool } from '../database/mysqlConnections';
import passport from 'passport';
import { requireEnv } from '../utils';
import { setUserCookies } from '../sessions/getSession';

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

const createUserIdFromEmail = (profile: Profile, googleId: string): Promise<any> => {
  const displayName = getDisplayNameFromProfile(profile);
  const newUser = {
    display_name: displayName,
    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
    google_id: googleId,
  };

  const promise = new Promise<any>((resolve, reject) => {
    getConnectionPool().getConnection((err, conn) => {
      if (err) {
        console.error(`Failed getting connection to check for existing user.`);
        conn.release();
        return reject(err);
      }
      conn.query('INSERT INTO User SET ?', newUser, (err) => {
        if (err) {
          console.error(`User profile was ${JSON.stringify(newUser)}`);
          conn.release();
          return reject(err);
        }

        // User has been created, pass the user object to Passport
        conn.release();
        return resolve(newUser);
      });
    });
  });
  return promise;
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
        if (cachedGoogleUsers.has(profile.id)) {
          console.log(`Got cached google user for googleId=${profile.id} in GoogleStrategy`);
          return done(null, cachedGoogleUsers.get(profile.id));
        } else {
          console.log(`Getting database connection...`);
          // This function is called when the user is authenticated
          // You can do additional validation or store user data here
          const id: string = profile.id;
          retrieveUserByGenericId(id).then((user: Profile) => {
            if (user !== null) {
              return done(null, user);
            }
            // User does not exist, create a new user in the database

            createUserIdFromEmail(profile, id).then((newUser: any) => {
              return done(null, newUser);
            });
          });
          return done(null, profile);
        }
      }
    )
  );
  // Set up passport session serialization and deserialization
  passport.serializeUser((user: any, done: (error: Error | null, id?: string | undefined) => void) => {
    console.log(`Storing user for id ${JSON.stringify(user)}`);
    // console.warn(`Attempting to serialise user ${JSON.stringify(user)}`);
    done(null, user.id);
  });

  const retrieveUserById = (id: string): Promise<Profile> => {
    const promise = new Promise<any>((resolve, reject) => {
      getConnectionPool().getConnection((err, conn) => {
        if (err) {
          console.error(`Failed getting connection to check for existing user.`);
          conn.release();
          return reject(err);
        }

        conn.query('SELECT id, email, display_name, google_id FROM User WHERE id = ?',
          [id], (_err, rows) => {
            if (rows.length === 0) {
              conn.release();
              return resolve(null);
            }
            cacheGoogleUser(rows[0]);
            const profile: Profile|any = { ...rows[0] };
            conn.release();
            return resolve(profile);
          });
      });
    });
    return promise;
  };

  const retrieveUserByGoogleId = (googleId: string): Promise<Profile> => {
    const promise = new Promise<any>((resolve, reject) => {
      getConnectionPool().getConnection((err, conn) => {
        if (err) {
          console.error(`Failed getting connection to check for existing user.`);
          conn.release();
          return reject(err);
        }

        conn.query('SELECT id, email, display_name, google_id FROM User WHERE google_id = ?',
          [googleId], (_err, rows) => {
            cacheGoogleUser(rows[0]);
            const profile: Profile|any = { ...rows[0] };
            conn.release();
            return resolve(profile);
          });
      });
    });
    return promise;
  };

  const isGoogleId = (id: string): boolean => {
    return (typeof id === 'number' && id >= 100000) || id?.length > 6;
  };

  const retrieveUserByGenericId = (id: string): Promise<Profile> => {
    return isGoogleId(id) ?
      retrieveUserByGoogleId(id) : retrieveUserById(id);
  };

  passport.deserializeUser((googleId: string, done: (error: Error | null, user?: Profile) => void) => {
    // Look up user by id
    if (cachedGoogleUsers.has(googleId)) {
      // console.log(`Got user googleId=${googleId} from cache`);
      done(null, cachedGoogleUsers.get(googleId));
    } else {
      retrieveUserByGenericId(googleId).then((user: Profile) => {
        done(null, user);
      }).catch((err) => {
        console.error(`Failed to find user for googleId=${googleId}`);
        done(err);
      });
    }
  });

  // Set up route for "Log in using Google" button
  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  const sendRedirectPage = (response: Response): void => {
    response.contentType('text/html');
    response.status(200);
    response.send(`<!DOCTYPE html>
    <html>
    <head><meta http-equiv="refresh" content="0; url='${SERVER_PREFIX}/'"></head>
    <body></body>
    </html>`);
    response.end();
    // return res.redirect(SERVER_PREFIX + '/');
  };

  // Set up callback route for Google authentication
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (request: ABSeeRequest, response: Response, next: NextFunction ): void => {
      // User has been authenticated, store user data in session
      // (req as any).session.passport.user
      const user: Express.User|undefined = request.user;
      const session: ABSeeSessionData = request.session as ABSeeSessionData;
      // user.displayName;
      if (user) {
        const userId: string = (user as any).id;
        session.userId = userId;
        session.username = (user as any).display_name;
        session.accessToken = (user as any).accessToken;
      }
      console.log('User info in /auth/google/callback:' + JSON.stringify(request.user));
      setUserCookies(session.id, session.userId, session.username, response);
      sendRedirectPage(response);
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
    (request: ABSeeRequest, response: Response, next: NextFunction) => {
      const reqData = JSON.stringify({
        body: request.body,
        cookies: request.cookies,
        headers: request.headers,
        hostname: request.hostname,
        httpVersion: request.httpVersion,
        ip: request.ip,
        method: request.method,
        originalUrl: request.originalUrl,
        params: request.params,
        path: request.path,
        protocol: request.protocol,
        query: request.query,
        url: request.url,
      });
      const session = request.session;
      if (session.userId === undefined) {
        console.warn(`Session ${session.id} had no userId when posting to /`);
      }
      if (session.username === undefined) {
        console.warn(`Session ${session.id} had no username when posting to /`);
      }
      setUserCookies(session.id, session.userId!, session.username!, response);

      // response.set('Set-Cookie', `user_id=${req.session.userId}`);
      console.info('Got authentication request, redirecting to /', reqData);
      sendRedirectPage(response);
      next();
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
