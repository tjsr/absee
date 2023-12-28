import Cookies from 'js-cookie';
import { getServerHost } from './utils';

export const fetchNewSession = async () => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const response = await fetch(`${getServerHost()}/session`, {
      headers,
      method: 'GET',
    });

    const json = await response.json();
    if (json.sessionId) {
      Cookies.set('sessionId', json.sessionId);
    }
  } catch (err) {}
};
