import { Response } from 'express';

export const setUserCookies = (userId: string,
  displayName: string, response: Response): void => {
  // console.log(`Setting user_id=${userId},displayName=${displayName} in callback for session=${sessionId}`);
  const cookies: Map<string, string> = new Map<string, string>();
  // response.header('access-control-expose-headers', 'Set-Cookie');
  cookies.set('user_id', userId);
  cookies.set('displayName', displayName);

  cookies.forEach((value, key) => {
    response.cookie(key, value);
  });
};
