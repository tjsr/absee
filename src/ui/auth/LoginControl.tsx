import { CredentialResponse, GoogleLogin, googleLogout } from '@react-oauth/google';

import Cookies from 'js-cookie';
import { EmailAddress } from '../../types.js';
import { FreeformEmailLoginBox } from '../freeformEmailLogin.js';
import React from 'react';
import { submitLogout } from './apicalls.js';

interface LoginControlProps {
  isLoggedIn: boolean;
  setLoggedIn: (isLoggedIn: boolean) => void;
  fakeEmails?: boolean;
  email: EmailAddress | undefined;
  setEmail: (email: EmailAddress|undefined) => void;
}

export const doGoogleLogout = (
  setLoggedIn: (loggedIn: boolean) => void,
  setEmail: (email: EmailAddress|undefined) => void
): void => {
  Cookies.remove('isLoggedIn');
  Cookies.remove('user_id');
  Cookies.remove('email');
  setLoggedIn(false);
  setEmail(undefined);
  submitLogout();
  googleLogout();
};

export const LoginControl = (
  { isLoggedIn, fakeEmails, setLoggedIn, email, setEmail } : LoginControlProps): JSX.Element => {
  const showLogoutText = false;
  if (isLoggedIn) {
    if (!showLogoutText) {
      return <></>;
    }
    return (
      <div>
        {/* Display content for logged in users */}
        <p>You are logged in as {email}!&nbsp;
          <a href="#" onClick={() => {
            doGoogleLogout(setLoggedIn, setEmail);
          }}>Log out</a>
        </p>
      </div>
    );
  }

  if (fakeEmails) {
    return <FreeformEmailLoginBox />;
  }

  return (<span style={ { float: 'right', marginRight: '2em' } }><GoogleLogin
    ux_mode="redirect"
    onSuccess={(credentialResponse: CredentialResponse) => {
      if (credentialResponse.credential === undefined) {
        console.warn('Credential response is undefined whihc we want to set as the email value.');
      }
      console.log('Logged in to google with credential: ', credentialResponse);
      setEmail(credentialResponse.credential || '');
      setLoggedIn(true);
      // googleSuccess(credentialResponse);
    }}
    onError={() => {
      setLoggedIn(false);
      console.log('Login Failed');
    }}
  /></span>
  );
};
