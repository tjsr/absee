import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import express, { Request, Response } from 'express';

import { ABSeeRequest } from '../session';
import { getConnectionPool } from '../database/mysqlConnections';
import passport from 'passport';
import { requireEnv } from '../utils';

// Configure Google authentication strategy
const GOOGLE_CLIENT_ID = requireEnv('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = requireEnv('GOOGLE_CLIENT_SECRET');

export const initialisePassportToExpressApp = (app: express.Express) => {
  // Set up passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        callbackURL: '/auth/google/callback',
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      },
      (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: object) => void
      ) => {
        // This function is called when the user is authenticated
        // You can do additional validation or store user data here
        getConnectionPool().getConnection((err, conn) => {
          if (err) {
            return done(err);
          }

          const googleId: string = profile.id;

          conn.query('SELECT * FROM User WHERE google_id = ?', [googleId], (err, rows) => {
            if (rows.length > 0) {
              // User exists, pass the user object to Passport
              return done(null, rows[0]);
            } else {
              // User does not exist, create a new user in the database
              const newUser = {
                display_name: profile.displayName,
                email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
                google_id: googleId,
              };

              conn.query('INSERT INTO User SET ?', newUser, (err) => {
                if (err) {
                  return done(err);
                }

                // User has been created, pass the user object to Passport
                return done(null, newUser);
              });
            }
          });
        });

        return done(null, profile);
      }
    )
  );
  // // Set up passport session serialization and deserialization
  // passport.serializeUser((user: Profile, done: (error: Error | null, id?: string | undefined) => void) => {
  //   done(null, user.id);
  // });

  // passport.deserializeUser((id: string, done: (error: Error | null, user?: Profile) => void) => {
  //   // Look up user by id
  //   const user = { displayName: 'Alice', id: id }; // Replace with actual user data lookup
  //   done(null, user);
  // });

  // Set up route for "Log in using Google" button
  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Set up callback route for Google authentication
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req: ABSeeRequest, res: Response) => {
      // User has been authenticated, store user data in session
      // req.session.userId = req.user.id;
      // req.session.username = req.user.displayName;
      // req.session.accessToken
      console.log(JSON.stringify(req.user));

      return res.redirect('/');
    }
  );

  app.get('/oauth2/redirect/google',
    passport.authenticate('google', { failureMessage: true, failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });
};
