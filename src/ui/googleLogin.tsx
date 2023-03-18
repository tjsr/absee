// import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import React, { useState } from 'react';

const CLIENT_ID = 'your-google-client-id';

export const GoogleLoginBox = (): JSX.Element => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  // const handleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
  //   console.log('Login successful:', response);

  //   // Make a request to your backend to initiate the authentication process
  //   // You can pass the response.accessToken or response.code as needed
  //   // The backend should handle the authentication process and create the session
  //   // Once the session is created, set the 'loggedIn' state to true
  // };

  const handleLoginFailure = (error: any) => {
    console.log('Login failed:', error);
  };

  return (
    <div className="googleLoginBox">
      {loggedIn ? (
        <div>
          {/* Display content for logged in users */}
          <p>You are logged in!</p>
        </div>
      ) : (
        <></>
        // <GoogleLogin
        //   clientId={CLIENT_ID}
        //   buttonText="Log in with Google"
        //   onSuccess={handleLoginSuccess}
        //   onFailure={handleLoginFailure}
        //   cookiePolicy={'single_host_origin'}
        // />
      )}
    </div>
  );
};
