import React, { useEffect, useState } from 'react';
import { submitLogin, submitLogout } from './auth/apicalls';

import Cookies from 'js-cookie';
import { EmailAddress } from '../types';

export const FreeformEmailLoginBox = (): JSX.Element => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress>('');

  useEffect(() => {
    // Check if the 'isLoggedIn' cookie exists and is set to 'true'
    const isLoggedIn = Cookies.get('isLoggedIn');
    const cookieEmail = Cookies.get('email');
    if (isLoggedIn === 'true' && cookieEmail !== undefined) {
      setLoggedIn(true);
      setEmail(cookieEmail);
    }
  }, []);

  const login = () => {
    submitLogin(email)
      .then((response) => {
        setLoggedIn(response.success);
      })
      .catch((err) => {
        setLoggedIn(false);
        console.error(err);
      });
  };

  const logout = () => {
    submitLogout()
      .then(() => {
        setLoggedIn(false);
      })
      .catch((err) => {
        setLoggedIn(false);
        console.error(err);
      });
  };

  return (
    <>
      <div className="emailLogin">
        {loggedIn ? (
          <>
            <div className="loginText">
              Logged in as <span className="loginEmail">{email}</span>
            </div>
            <button id="logoutButton" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <div>
            <div className="loginNote">
              For now, while in testing, you can just free-form enter any email
              address and it will accept it. Please don't abuse this.
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <button id="loginButton" onClick={login}>
              Log in
            </button>
          </div>
        )}
      </div>
    </>
  );
};
