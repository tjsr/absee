import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import express, { NextFunction, Request, Response } from 'express';

import passport from 'passport';

// Configure Google authentication strategy
    const GOOGLE_CLIENT_ID = 'your-client-id-here';
    const GOOGLE_CLIENT_SECRET = 'your-client-secret-here';
    
    export const initialisePassportToExpressApp = (app: express.Express) => {
    // Set up passport middleware
    app.use(passport.initialize());
    app.use(passport.session());

  passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    (accessToken: string, refreshToken: string, profile: Profile, done: (error: Error | null, user?: object) => void) => {
      // This function is called when the user is authenticated
      // You can do additional validation or store user data here
      return done(null, profile);
    }
  )
);
// Set up passport session serialization and deserialization
// passport.serializeUser((user: Profile, done: (error: Error | null, id?: string | undefined) => void) => {
//   done(null, user.id);
// });

// passport.deserializeUser((id: string, done: (error: Error | null, user?: Profile) => void) => {
//   // Look up user by id
//   const user = { id: id, displayName: 'Alice' }; // Replace with actual user data lookup
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
  (req: Request, res: Response) => {
    // User has been authenticated, store user data in session
    // req.session.userId = req.user.id;
    // req.session.username = req.user.displayName;

    return res.redirect('/');
  }
);
}