import { CredentialResponse, GoogleLogin, googleLogout } from '@react-oauth/google';

import Cookies from 'js-cookie';
import { EmailAddress } from '../../types';
import { FreeformEmailLoginBox } from '../freeformEmailLogin';
import React from 'react';

interface LoginControlProps {
  isLoggedIn: boolean;
  setLoggedIn: (isLoggedIn: boolean) => void;
  fakeEmails?: boolean;
  email: EmailAddress | undefined;
  setEmail: (email: string) => void;
}

const doGoogleLogout = (setLoggedIn: (loggedIn: boolean) => void): void => {
  Cookies.remove('isLoggedIn');
  Cookies.remove('user_id');
  Cookies.remove('email');
  setLoggedIn(false);
  googleLogout();
};

export const LoginControl = (
  { isLoggedIn, fakeEmails, setLoggedIn, email, setEmail } : LoginControlProps): JSX.Element => {
  if (isLoggedIn) {
    return (
      <div>
        {/* Display content for logged in users */}
        <p>You are logged in as {email}!&nbsp;
          <a href="#" onClick={() => {
            doGoogleLogout(setLoggedIn);
          }}>Log out</a>
        </p>
      </div>
    );
  }

  if (fakeEmails) {
    return <FreeformEmailLoginBox />;
  }

  return (<GoogleLogin
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
  />
  );
};
