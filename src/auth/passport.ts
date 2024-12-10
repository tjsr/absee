import { ABSeeRequest, ABSeeSessionData } from '../session.js';
import { DatabaseConnection, EmailAddress, UserId } from '../types.js';
import { FieldPacket, PoolConnection, QueryResult, mysqlQuery, safeReleaseConnection } from '@tjsr/mysql-pool-utils';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import express, { NextFunction, Response } from 'express';

import debug from 'debug';
import { getConnection } from '@tjsr/mysql-pool-utils';
import passport from 'passport';
import { requireEnv } from '../utils.js';
import { saveUserLogin } from '../api/login.js';
import { setUserCookies } from '../sessions/setUserCookies.js';

const pd = debug('absee:passport');

// Configure Google authentication strategy
const GOOGLE_CLIENT_ID = requireEnv('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = requireEnv('GOOGLE_CLIENT_SECRET');
const SERVER_PREFIX = requireEnv('SERVER_PREFIX');

const getDisplayNameFromProfile = (profile: Profile): string => {
  return profile.displayName || (profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '');
};

const cachedGoogleUsers: Map<string, any> = new Map<string, any>();
const cacheGoogleUser = (user: UserDatabaseTableRow): void => {
  const googleId = user.google_id;
  cachedGoogleUsers.set(googleId, user);
};

type GoogleId = string;

interface UserDatabaseTableRow {
  id?: UserId;
  display_name: string;
  email: EmailAddress | null;
  google_id: GoogleId;
}

const createUserIdFromEmail = (conn: DatabaseConnection, profile: Profile, googleId: string): Promise<any> => {
  const displayName = getDisplayNameFromProfile(profile);
  const newUser: UserDatabaseTableRow = {
    display_name: displayName,
    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
    google_id: googleId,
  };

  return mysqlQuery('INSERT INTO User SET display_name = ?, email = ?, google_id = ?',
    [newUser.display_name, newUser.email ?? null, newUser.google_id], conn).then((
    [_result, _fields]: [QueryResult, FieldPacket[]]
  ) => {
    cacheGoogleUser(newUser);
    return newUser;
  }).catch((err) => {
    console.error(`User profile was ${JSON.stringify(newUser)}`);
    throw err;
  });
};

export const initialisePassportToExpressApp = (app: express.Express) => {
  if (!app.locals.connectionPool) {
    throw new Error('No connection pool available');
  }
  pd('Initialising passport middleware');
  
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
          const useConn = app.locals.connectionPool.getConnection();
          useConn.then((conn: PoolConnection) => {
            retrieveUserByGenericId(useConn, id).then((user: Profile) => {
              if (user !== null) {
                return done(null, user);
              }
              // User does not exist, create a new user in the database
  
              createUserIdFromEmail(useConn, profile, id).then((newUser: any) => {
                return done(null, newUser);
              });
            }).finally(() => {
              safeReleaseConnection(conn);
               // TODO: Is this called twice??
              done(null, profile);
            });
          });
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

  const retrieveUserById = (conn: DatabaseConnection, id: string): Promise<Profile> => {
    return mysqlQuery('SELECT id, email, display_name, google_id FROM User WHERE id = ?',
        [id], conn).then(([userRows, _packets]: [QueryResult, FieldPacket[]]) => {
      const rows = userRows as any;
      if (rows.length === 0) {
        return null;
      }

      cacheGoogleUser(rows[0]);
      const profile: Profile|any = { ...rows[0] };
      return profile;
    });
  };

  const retrieveUserByGoogleId = (conn: DatabaseConnection, googleId: string): Promise<Profile> => {
    return mysqlQuery(
      'SELECT id, email, display_name, google_id FROM User WHERE google_id = ?',
      [googleId],
      conn)
    .then(([userRows, _packets]: [QueryResult, FieldPacket[]]) => {
      const rows = userRows as any;
      cacheGoogleUser(rows[0]);
      const profile: Profile|any = { ...rows[0] };
      return profile;
    });
  };

  const isGoogleId = (id: string): boolean => {
    return (typeof id === 'number' && id >= 100000) || id?.length > 6;
  };

  const retrieveUserByGenericId = (conn: DatabaseConnection, id: string): Promise<Profile> => {
    return isGoogleId(id) ?
      retrieveUserByGoogleId(conn, id) : retrieveUserById(conn, id);
  };

  passport.deserializeUser((googleId: string, done: (error: Error | null, user?: Profile) => void) => {
    // Look up user by id
    if (cachedGoogleUsers.has(googleId)) {
      // console.log(`Got user googleId=${googleId} from cache`);
      done(null, cachedGoogleUsers.get(googleId));
    } else {
      const conn = getConnection();
      retrieveUserByGenericId(conn, googleId).then((user: Profile) => {
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
    (request: ABSeeRequest, response: Response ): void => {
      // User has been authenticated, store user data in session
      // (req as any).session.passport.user
      const user: Express.User|undefined = request.user;
      const session: ABSeeSessionData = request.session as ABSeeSessionData;
      if (user) {
        const userId: UserId = (user as any).id;
        session.userId = userId;
        session.username = (user as any).display_name;
        session.accessToken = (user as any).accessToken;
      }
      console.log('User info in /auth/google/callback:' + JSON.stringify(request.user));
      const responseConnection: DatabaseConnection = response.locals.connection;
      saveUserLogin(responseConnection, session.userId, session.username, session.id, request.ip).then(() => {
        console.log(`Saved user login for ${session.username} with userId ${session.userId}`);
      }).catch((err) => {
        console.error(`Failed saving user login`, err);
      });
      setUserCookies(session.userId, session.username, response);
      sendRedirectPage(response);
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
      if (session.userId === undefined || session.userId === null) {
        console.warn(`Session ${session.id} had no userId when posting to /`);
      }
      if (session.username === undefined) {
        console.warn(`Session ${session.id} had no username when posting to /`);
      }
      setUserCookies(session.userId!, session.username!, response);

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
    if (!res.headersSent) {
      res.status(500).send('Something went wrong'); // Respond with an appropriate error message
      next();
      // res.end();
      // res.redirect('/');
    } else {
      const existingStatus = res.statusCode;
      console.warn(`Headers already sent with ${existingStatus} status, not sending additional error message`);
    }
  });
};
