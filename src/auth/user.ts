import { EmailAddress, UserId, uuid5 } from '../types';

import { ABSeeRequest } from '../session';
import { getSnowflake } from '../snowflake';
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE =
  process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  return uuidv5(email, USERID_UUID_NAMESPACE);
};

export const createRandomUserId = (): uuid5 => {
  return uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE);
};

export const getUserId = (request: ABSeeRequest): UserId => {
  if (request.session && request.session.userId) {
    // console.log('Got a session for current call');
    return request.session.userId;
  } else if (!request.session) {
    throw new Error('No session');
  } else {
    request.session.userId = createRandomUserId();
    request.session.save();
    return request.session.userId;
  }
};
