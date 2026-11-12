import Cookies from 'js-cookie';
import { getServerHost } from './utils.ts';

export const fetchNewSession = async () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const response = await fetch(`${getServerHost()}/session`, {
    headers,
    method: 'GET',
  });

  if (!response.ok) throw new Error('Failed to create session');

  const json = await response.json() as {sessionId?: string};
  if (json.sessionId) {
    Cookies.set('sessionId', json.sessionId);
  } else {
    throw new Error('Session response did not contain a session ID');
  }
};
