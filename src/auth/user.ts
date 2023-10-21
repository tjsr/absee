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
    const userId: UserId = createRandomUserId();
    console.log(`Generated new userId ${userId}`);
    request.session.userId = userId;
    request.session.save();
    return request.session.userId;
  }
};

export const getUserIdentificationString = (request: ABSeeRequest): string => {
  if (request.session && (request.user as any)?.displayName) {
    return (request.user as any).displayName;
    // console.log('Got a session for current call');
    // return request.session.userId;
  } else if (request.session && request.session?.username) {
    return request.session.username;
  } else if (!request.session) {
    throw new Error('No session');
  } else {
    if (request.session.userId === undefined) {
      request.session.userId = createRandomUserId();
      request.session.save();
    }
    return request.session.userId;
  }
};
