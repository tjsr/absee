import React, { useState } from 'react';

export const FreeformEmailLoginBox = (): JSX.Element => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  return (
    <>
      <div className="emailLogin">
        {loggedIn ? (
          <button id="logoutButton">Log out</button>
        ) : (
          <div>
            <input type="email" />
            <button id="loginButton">Log in</button>
          </div>
        )}
      </div>
    </>
  );
};
