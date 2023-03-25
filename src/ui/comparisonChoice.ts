import {
  ComparisonSelectionResponse,
  SnowflakeType
} from '../types';
import {
  ComparisonSubmissionRequestBody,
  RestCallResult
} from '../types/apicalls';

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

export const fetchNewComparison = async (collectionId: string) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const sessionId = Cookies.get('sessionId');
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(
      `${getServerHost()}/collection/${collectionId}`,
      {
        headers,
        method: 'GET',
      }
    );

    const json = await response.json();
    return { data: json, success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

export const submitComparisonChoice = async <T>(
  comparison: ComparisonSelectionResponse<T>,
  elementId: SnowflakeType
): Promise<RestCallResult> => {
  let httpStatus = 0;
  try {
    const sessionId = Cookies.get('sessionId');
    const postBody: ComparisonSubmissionRequestBody = {
      comparisonId: comparison.id,
      selectedElementId: elementId,
    };
    const response = await fetch(`${getServerHost()}/submit`, {
      body: JSON.stringify(postBody),
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session-id': sessionId!,
      },
      method: 'POST',
    });
    httpStatus = response.status;
    const json = await response.json();
    return { data: json, status: httpStatus, success: true };
  } catch (error) {
    console.log(error);
    return { status: httpStatus, success: false };
  }
};
