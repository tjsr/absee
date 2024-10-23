import {
  ComparisonSelectionResponse,
  SnowflakeType
} from '../types.js';
import {
  ComparisonSubmissionRequestBody,
  RestCallResult
} from '../types/apicalls.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER, getServerHost } from './utils.js';

import Cookies from 'js-cookie';
import { SESSION_ID_HEADER } from '../api/apiUtils.js';

export const fetchNewComparison = async (collectionId: string, comparisonObjects?: string[][]):
Promise<RestCallResult> => {
  const serverHost = getServerHost();
  let connectionUrl: string;
  try {
    const comparisonParams = comparisonObjects?.length == 2 ?
      `?objects=${comparisonObjects[0].join(QUERYSTRING_ELEMENT_DELIMETER)}`+
        `${QUERYSTRING_ARRAY_DELIMETER}${comparisonObjects[1].join(QUERYSTRING_ELEMENT_DELIMETER)}` : '';
    connectionUrl = `${serverHost}/collection/${collectionId}${comparisonParams}`;
  } catch (error) {
    console.error(`Failed to create connection url for ${serverHost}`, error);
    return { status: null, success: false };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const sessionId = Cookies.get('sessionId');
  if (sessionId !== undefined && sessionId !== 'undefined') {
    headers[`${SESSION_ID_HEADER}`] = sessionId;
  }

  let status = null;
  try {
    const response = await fetch(connectionUrl,
      {
        headers,
        method: 'GET',
      }
    );
    status = response.status;

    const success = status < 400;
    console.log(`Received response from ${connectionUrl} with status ${status}, returning success=${success}.`);
    const json = success ? await response.json() : undefined;
    return { data: json, status: status, success: success };
  } catch (error: any) {
    if (error.status) {
      status = error.status;
    }
    // if (error.status === 404) {
    //   throw new CollectionNotFoundError(collectionId);
    //   return { success: false };
    // }
    // if (error instanceof Error) {
    //   if (error.httpStatus) {

    //   }
    //   console.error(`Failed fetching from url ${serverHost}`, error);
    // }
    console.error(`Failed fetching from url ${serverHost}`, error.message, error);
    return { status: status, success: false };
  }
};

export const submitComparisonChoice = async <T>(
  comparison: ComparisonSelectionResponse<T>,
  elementId: SnowflakeType
): Promise<RestCallResult> => {
  let httpStatus = 0;
  const submitUrl = `${getServerHost()}/submit`;
  try {
    const sessionId = Cookies.get('sessionId');
    const postBody: ComparisonSubmissionRequestBody = {
      comparisonId: comparison.id,
      selectedElementId: elementId,
    };
    const response = await fetch(submitUrl, {
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
    console.log(`Failed while fetching ${submitUrl}`, error);
    return { status: httpStatus, success: false };
  }
};
