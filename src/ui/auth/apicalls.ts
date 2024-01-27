import { AuthenticationRestResult } from '../../types/apicalls.js';
import Cookies from 'js-cookie';
import { EmailAddress } from '../../types.js';
import { getServerHost } from '../utils.js';

type LoginPostBody = {
  email: EmailAddress;
};

export const submitLogin = async (email: EmailAddress) => {
  try {
    const loginPostBody: LoginPostBody = {
      email,
    };
    const sessionId = Cookies.get('sessionId');
    const response: Response = await fetch(`${getServerHost()}/login`, {
      body: JSON.stringify(loginPostBody),
      cache: 'no-cache',
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session-id': sessionId!,
      },
      method: 'POST',
      mode: 'cors',
    });

    const headers = response.headers.get('Set-Cookie');
    // const rawHeaders = response.headers.raw()['Set-Cookie'];
    const cookie = headers ? headers.split(',') : [];

    const loginBody: AuthenticationRestResult = await response.json();
    setAuthenticationCookies(loginBody);

    if (response.status == 200) {
      return { success: true };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

const setAuthenticationCookies = (body: AuthenticationRestResult) => {
  Cookies.set('isLoggedIn', body.isLoggedIn ? 'true' : 'false');
  if (body.email) {
    Cookies.set('email', body.email);
  } else {
    Cookies.remove('email');
  }
  if (body.sessionId) {
    Cookies.set('sessionId', body.sessionId);
  } else {
    Cookies.remove('sessionId');
  }
};

export const submitLogout = async () => {
  try {
    const sessionId = Cookies.get('sessionId');
    const response = await fetch(`${getServerHost()}/logout`, {
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session-id': sessionId!,
      },
    });
    const logoutBody: AuthenticationRestResult = await response.json();
    setAuthenticationCookies(logoutBody);
  } catch (err) {
    console.warn(`Failed trying to log out`, err);
  }
};
